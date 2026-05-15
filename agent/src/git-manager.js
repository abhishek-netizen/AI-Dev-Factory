import simpleGit from 'simple-git';
import fs from 'fs-extra';
import chalk from 'chalk';

// ── Init git repo if not already ──────────────────────────

async function ensureRepo(projectDir) {
  const git = simpleGit(projectDir);
  const isRepo = await git.checkIsRepo().catch(() => false);

  if (!isRepo) {
    console.log(chalk.gray('  Initialising git repo...'));
    await git.init();
    await git.addConfig('user.name',  'AI Dev Factory');
    await git.addConfig('user.email', 'agent@ai-dev-factory.local');

    // Create initial .gitignore
    await fs.writeFile(
      `${projectDir}/.gitignore`,
      'node_modules/\n.env\ndist/\nbuild/\n.expo/\n',
      'utf-8'
    );

    await git.add('.');
    await git.commit('chore: initial commit');
    console.log(chalk.gray('  ✓ Git repo initialised'));
  }

  return git;
}

// ── Commit generated code ──────────────────────────────────

async function commit(projectDir, taskFileName, summary) {
  const git = await ensureRepo(projectDir);

  // Stage all changes
  await git.add('.');

  // Check if there's anything to commit
  const status = await git.status();
  if (status.files.length === 0) {
    console.log(chalk.gray('  Nothing to commit'));
    return;
  }

  // Commit with task name + summary
  const taskId  = taskFileName.replace('.md', '');
  const message = `feat(${taskId}): ${summary}`;
  await git.commit(message);

  const log = await git.log({ maxCount: 1 });
  console.log(chalk.gray(`  ✓ Committed: ${log.latest.hash.slice(0, 7)} — ${message}`));
}

// ── Get recent commits ─────────────────────────────────────

async function recentCommits(projectDir, count = 5) {
  const git = simpleGit(projectDir);
  const log  = await git.log({ maxCount: count });
  return log.all.map((c) => ({
    hash:    c.hash.slice(0, 7),
    message: c.message,
    date:    c.date,
  }));
}

export const gitManager = { commit, recentCommits, ensureRepo };
