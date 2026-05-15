import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { taskRunner } from './task-runner.js';
import { createClient } from 'redis';
import chalk from 'chalk';
import { gitManager } from './git-manager.js';

const app = express();
app.use(express.json());

// ── Redis client ───────────────────────────────────────────
export const redis = createClient({ url: process.env.REDIS_URL });
redis.on('error', (err) => console.error(chalk.red('Redis error:'), err));
await redis.connect();
console.log(chalk.green('✓ Redis connected'));

// ── Routes ─────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Run a specific task
// POST /task { project: 'hello-world', task: '001-auth.md' }
app.post('/task', async (req, res) => {
  const { project, task } = req.body;

  if (!project || !task) {
    return res.status(400).json({ error: 'project and task are required' });
  }

  console.log(chalk.blue(`\n▶ Running task: ${task} for project: ${project}`));

  // Acknowledge immediately, run async
  res.json({ status: 'started', project, task });

  try {
    await taskRunner.run(project, task);
  } catch (err) {
    console.error(chalk.red('Task failed:'), err.message);
    await redis.set(`task:${project}:${task}:status`, 'failed');
    await redis.set(`task:${project}:${task}:error`, err.message);
  }
});

// Create a task file from Telegram free-text and run it immediately
// POST /task-from-bot { project: 'hello-world', content: 'Change heading to X' }
app.post('/task-from-bot', async (req, res) => {
  const { project, content } = req.body;
  if (!project || !content) {
    return res.status(400).json({ error: 'project and content are required' });
  }

  try {
    const projectDir = path.join('/projects', project);
    const tasksDir = path.join(projectDir, 'tasks');
    await fs.ensureDir(tasksDir);

    // Find next .taskN.md index
    const files = await fs.readdir(tasksDir);
    const regex = /^\.task(\d+)\.md$/;
    let max = 0;
    for (const f of files) {
      const m = f.match(regex);
      if (m) max = Math.max(max, Number(m[1]));
    }
    const next = max + 1;
    const filename = `.task${next}.md`;
    const filePath = path.join(tasksDir, filename);

    const fileContent = `# Task (from Telegram)\n\n${content}\n`;
    await fs.writeFile(filePath, fileContent, 'utf-8');

    // Mark running and respond immediately
    await redis.set(`task:${project}:${filename}:status`, 'running');
    res.json({ status: 'started', project, task: filename });

    // Quick heuristic: normalize message and match both quoted and unquoted forms.
    const normalized = content.replace(/\s+/g, ' ').trim();
    const headingMatch = normalized.match(/Change the heading to\s*(?:"|')?([^"']+)(?:"|')?/i);
    if (headingMatch) {
      const newHeading = headingMatch[1].trim();
      try {
        // Attempt a project-wide replacement for the existing heading text
        const searchText = 'Hello World Full-Stack Example';
        const exts = ['.jsx', '.js', '.tsx', '.ts', '.html', '.md'];
        let madeChange = false;

        // Walk project files and replace occurrences
        const walk = async (dir) => {
          const entries = await fs.readdir(dir, { withFileTypes: true });
          for (const ent of entries) {
            const p = path.join(dir, ent.name);
            if (ent.isDirectory()) {
              if (ent.name === 'node_modules' || ent.name === '.git') continue;
              await walk(p);
            } else {
              const ext = path.extname(ent.name);
              if (!exts.includes(ext)) continue;
              let txt = await fs.readFile(p, 'utf-8');
              if (txt.includes(searchText)) {
                txt = txt.split(searchText).join(newHeading);
                await fs.writeFile(p, txt, 'utf-8');
                madeChange = true;
                console.log(chalk.gray(`  Replaced heading in ${p}`));
              }
              // Also replace literal <h1>old</h1> if present
              const h1regex = /<h1>[\s\S]*?<\/h1>/i;
              if (h1regex.test(txt)) {
                const replaced = txt.replace(h1regex, `<h1>${newHeading}</h1>`);
                if (replaced !== txt) {
                  await fs.writeFile(p, replaced, 'utf-8');
                  madeChange = true;
                  console.log(chalk.gray(`  Replaced <h1> in ${p}`));
                }
              }
            }
          }
        };

        await walk(projectDir);

        if (madeChange) {
          try {
            await gitManager.commit(projectDir, filename, `feat(.${filename}): Changed heading to '${newHeading}'`);
          } catch (e) {
            console.warn('Git commit failed:', e.message);
          }
          await redis.set(`task:${project}:${filename}:status`, 'complete');
          console.log(chalk.green(`\n✓ Quick task applied: ${filename} (heading updated across project)`));
          return;
        }
      } catch (err) {
        console.error(chalk.red('Quick task apply failed:'), err.message);
        // fall through to normal LLM processing
      }
    }

    // Run the task async (fallback to full task runner)
    (async () => {
      try {
        await taskRunner.run(project, filename);
      } catch (err) {
        console.error(chalk.red('Task failed:'), err.message);
        await redis.set(`task:${project}:${filename}:status`, 'failed');
        await redis.set(`task:${project}:${filename}:error`, err.message);
      }
    })();

  } catch (err) {
    console.error(chalk.red('Failed to create task from bot:'), err.message);
    return res.status(500).json({ error: err.message });
  }
});

// Get task status
// GET /status?project=hello-world&task=001-auth.md
app.get('/status', async (req, res) => {
  const { project, task } = req.query;
  const status = await redis.get(`task:${project}:${task}:status`) || 'unknown';
  const error  = await redis.get(`task:${project}:${task}:error`) || null;
  res.json({ project, task, status, error });
});

// List all tasks for a project
// GET /tasks?project=hello-world
app.get('/tasks', async (req, res) => {
  const { project } = req.query;
  const keys = await redis.keys(`task:${project}:*:status`);
  const tasks = await Promise.all(
    keys.map(async (key) => {
      const parts  = key.split(':');
      const name   = parts[2];
      const status = await redis.get(key);
      return { name, status };
    })
  );
  res.json({ project, tasks });
});

// ── GET /logs/:container ───────────────────────────────────
app.get('/logs/:container', async (req, res) => {
  const { container } = req.params;
  try {
    const { dockerManager } = await import('./docker-manager.js');
    const logs = await dockerManager.getLogs(container);
    res.json({ container, logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /containers ────────────────────────────────────────
app.get('/containers', async (req, res) => {
  try {
    const { dockerManager } = await import('./docker-manager.js');
    const containers = await dockerManager.getAllStatus();
    res.json({ containers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /restart/:container ───────────────────────────────
app.post('/restart/:container', async (req, res) => {
  const { container } = req.params;
  try {
    const { dockerManager } = await import('./docker-manager.js');
    await dockerManager.restart(container);
    res.json({ status: 'restarted', container });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /project ──────────────────────────────────────────
app.post('/project', async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const projectDir = path.join('/projects', name);
  const templateDir = path.join('/projects', '_template');

  try {
    if (await fs.pathExists(projectDir)) {
      return res.status(409).json({ error: `Project '${name}' already exists` });
    }
    await fs.copy(templateDir, projectDir);
    await fs.ensureDir(path.join(projectDir, 'backend'));
    await fs.ensureDir(path.join(projectDir, 'frontend'));
    await fs.ensureDir(path.join(projectDir, 'mobile'));
    await fs.ensureDir(path.join(projectDir, 'tasks'));
    res.json({ status: 'created', name, path: projectDir });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(chalk.green(`\n✓ Agent Controller running on port ${PORT}`));
  console.log(chalk.gray(`  LLM Router  → ${process.env.LLM_ROUTER_URL}`));
  console.log(chalk.gray(`  Ollama      → ${process.env.OLLAMA_URL}`));
  console.log(chalk.gray(`  Projects    → /projects\n`));
});
