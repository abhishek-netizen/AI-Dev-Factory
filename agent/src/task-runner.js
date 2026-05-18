import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { routeToLLM } from './router.js';
import { fileWriter } from './file-writer.js';
import { gitManager } from './git-manager.js';
import { redis } from './index.js';

const PROJECTS_DIR = '/projects';

// ── Load context files ─────────────────────────────────────

async function loadProjectContext(projectName) {
  const projectDir = path.join(PROJECTS_DIR, projectName);

  const readIfExists = async (filename) => {
    const filePath = path.join(projectDir, filename);
    return (await fs.pathExists(filePath))
      ? await fs.readFile(filePath, 'utf-8')
      : '';
  };

  const [definition, architecture, rules, spec] = await Promise.all([
    readIfExists('PROJ_DEFINATION.md'),
    readIfExists('ARCHITECTURE.md'),
    readIfExists('CODING_RULES.md'),
    readIfExists('PROJECT_SPEC.md'),
  ]);

  return { definition, architecture, rules, spec };
}

// ── Build prompt ───────────────────────────────────────────

function buildPrompt({ definition, architecture, rules, spec, task }) {
  return `
You are an expert full-stack developer. Your job is to implement the task below.
Follow ALL the rules and architecture guidelines exactly.

=== PROJECT DEFINITION ===
${definition}

=== ARCHITECTURE ===
${architecture}

=== CODING RULES ===
${rules}

=== PROJECT SPEC (fallback) ===
${spec}

=== TASK TO IMPLEMENT ===
${task}

=== INSTRUCTIONS ===
Respond ONLY with a JSON object in this exact format, no extra text:
{
  "summary": "brief description of what you implemented",
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "full file content here"
    }
  ],
  "commands": [
    "npm install some-package"
  ]
}

- "path" is relative to the project root (e.g. "src/modules/auth/auth.service.ts")
- "content" is the complete file content
- "commands" are shell commands to run after writing files (installs, migrations, etc.)
- Write complete, production-ready, fully working code
- Never write placeholder comments like "// TODO" or "// implement this"
`.trim();
}

// ── Parse LLM response ─────────────────────────────────────

function parseResponse(raw) {
  try {
    // Strip markdown code fences if present
    const clean = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    throw new Error('LLM returned invalid JSON — could not parse response');
  }
}
async function tryDirectHeadingUpdate(projectDir, taskFileName, taskContent) {
  const targetFile = path.join(projectDir, 'frontend', 'src', 'App.jsx');
  if (!(await fs.pathExists(targetFile))) return false;

  if (!/frontend\/src\/App\.jsx/i.test(taskContent)) return false;

  const changeMatch = taskContent.match(/from\s+[`'"]([^`'"]+)[`'"]\s+to\s+[`'"]([^`'"]+)[`'"]/i);
  if (!changeMatch) return false;

  const [, oldText, newText] = changeMatch;
  const fileText = await fs.readFile(targetFile, 'utf-8');
  const headingRegex = /<h1>([\s\S]*?)<\/h1>/i;
  if (!headingRegex.test(fileText)) return false;

  const updated = fileText.replace(headingRegex, `<h1>${newText}</h1>`);
  if (updated === fileText) return false;

  await fs.writeFile(targetFile, updated, 'utf-8');
  await gitManager.commit(projectDir, taskFileName, `feat(${taskFileName}): Updated heading to '${newText}'`);
  return true;
}
// ── Task runner ────────────────────────────────────────────

async function run(projectName, taskFileName) {
  const projectDir = path.join(PROJECTS_DIR, projectName);
  const taskPath   = path.join(projectDir, 'tasks', taskFileName);

  // Mark task as running
  await redis.set(`task:${projectName}:${taskFileName}:status`, 'running');

  // 1. Read task file
  console.log(chalk.blue('\n[1/7] Reading task file...'));
  if (!(await fs.pathExists(taskPath))) {
    throw new Error(`Task file not found: ${taskPath}`);
  }
  const taskContent = await fs.readFile(taskPath, 'utf-8');

  // 2. Load project context
  console.log(chalk.blue('[2/7] Loading project context...'));
  const context = await loadProjectContext(projectName);

  // 3. Try a direct update for simple heading tasks before calling the LLM
  console.log(chalk.blue('[3/7] Checking for direct update...'));
  const directUpdate = await tryDirectHeadingUpdate(projectDir, taskFileName, taskContent);
  if (directUpdate) {
    console.log(chalk.green('✓ Direct heading update applied'));
    await redis.set(`task:${projectName}:${taskFileName}:status`, 'complete');
    await redis.set(`task:${projectName}:${taskFileName}:error`, '');
    return;
  }

  // 4. Build prompt and call LLM
  console.log(chalk.blue('[4/7] Calling LLM...'));
  const prompt   = buildPrompt({ ...context, task: taskContent });
  const rawReply = await routeToLLM(prompt, taskContent);

  // 5. Parse response
  console.log(chalk.blue('[5/7] Parsing LLM response...'));
  const result = parseResponse(rawReply);
  console.log(chalk.gray(`  Summary: ${result.summary}`));
  console.log(chalk.gray(`  Files:   ${result.files.length}`));

  // 6. Write files
  console.log(chalk.blue('[6/7] Writing files...'));
  await fileWriter.writeFiles(projectDir, result.files, result.commands);

  // 7. Commit to git
  console.log(chalk.blue('[7/7] Committing to git...'));
  await gitManager.commit(projectDir, taskFileName, result.summary);

  // Mark task as complete
  await redis.set(`task:${projectName}:${taskFileName}:status`, 'complete');
  console.log(chalk.green(`\n✓ Task complete: ${taskFileName}\n`));
}

export const taskRunner = { run };
