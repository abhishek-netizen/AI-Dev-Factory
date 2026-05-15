import Docker from 'dockerode';
import chalk from 'chalk';

// Connects via the mounted docker socket
// /var/run/docker.sock:/var/run/docker.sock in docker-compose
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

// ── Get container by name ──────────────────────────────────

async function getContainer(name) {
  const containers = await docker.listContainers({ all: true });
  const info = containers.find((c) =>
    c.Names.some((n) => n === `/${name}` || n === name)
  );
  if (!info) throw new Error(`Container not found: ${name}`);
  return docker.getContainer(info.Id);
}

// ── Restart a container ────────────────────────────────────

async function restart(containerName) {
  console.log(chalk.gray(`  Restarting container: ${containerName}`));
  const container = await getContainer(containerName);
  await container.restart();
  console.log(chalk.gray(`  ✓ Restarted: ${containerName}`));
}

// ── Get container logs ─────────────────────────────────────

async function getLogs(containerName, tail = 50) {
  const container = await getContainer(containerName);
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail,
  });
  return logs.toString('utf-8');
}

// ── Get container status ───────────────────────────────────

async function getStatus(containerName) {
  try {
    const container = await getContainer(containerName);
    const info      = await container.inspect();
    return {
      name:    containerName,
      status:  info.State.Status,     // running | exited | paused
      running: info.State.Running,
      started: info.State.StartedAt,
    };
  } catch {
    return { name: containerName, status: 'not found', running: false };
  }
}

// ── Get status of all factory containers ──────────────────

async function getAllStatus() {
  const names = ['api', 'web', 'mobile', 'ollama', 'redis', 'playwright', 'agent-controller', 'llm-router', 'telegram-bot'];
  return await Promise.all(names.map(getStatus));
}

// ── Exec a command inside a container ─────────────────────

async function exec(containerName, command) {
  const container = await getContainer(containerName);
  const exec = await container.exec({
    Cmd:          command.split(' '),
    AttachStdout: true,
    AttachStderr: true,
  });

  return new Promise((resolve, reject) => {
    exec.start({}, (err, stream) => {
      if (err) return reject(err);
      let output = '';
      stream.on('data',  (chunk) => (output += chunk.toString()));
      stream.on('end',   () => resolve(output));
      stream.on('error', reject);
    });
  });
}

export const dockerManager = {
  restart,
  getLogs,
  getStatus,
  getAllStatus,
  exec,
};
