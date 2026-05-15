import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);

// ── Write files ────────────────────────────────────────────

async function writeFiles(projectDir, files, commands = []) {
  // Write each file
  for (const file of files) {
    const fullPath = path.join(projectDir, file.path);

    // Create directory if it doesn't exist
    await fs.ensureDir(path.dirname(fullPath));

    // Write file content
    await fs.writeFile(fullPath, file.content, 'utf-8');
    console.log(chalk.gray(`  ✓ Written: ${file.path}`));
  }

  // Run post-write commands (npm installs, migrations etc.)
  if (commands.length > 0) {
    console.log(chalk.blue(`\n  Running ${commands.length} command(s)...`));
    for (const cmd of commands) {
      await runCommand(cmd, projectDir);
    }
  }
}

// ── Run shell command ──────────────────────────────────────

async function runCommand(command, cwd) {
  console.log(chalk.gray(`  $ ${command}`));
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 60000, // 60s timeout per command
    });
    if (stdout) console.log(chalk.gray(stdout.trim()));
    if (stderr) console.warn(chalk.yellow(stderr.trim()));
  } catch (err) {
    // Non-fatal — log warning but don't crash the task
    console.warn(chalk.yellow(`  ⚠ Command failed (non-fatal): ${err.message}`));
  }
}

// ── Read a file ────────────────────────────────────────────

async function readFile(filePath) {
  if (!(await fs.pathExists(filePath))) return null;
  return await fs.readFile(filePath, 'utf-8');
}

// ── Check if file exists ───────────────────────────────────

async function fileExists(filePath) {
  return await fs.pathExists(filePath);
}

export const fileWriter = {
  writeFiles,
  readFile,
  fileExists,
};
