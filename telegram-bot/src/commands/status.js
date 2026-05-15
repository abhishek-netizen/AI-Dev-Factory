import axios from 'axios';

const AGENT_URL = process.env.AGENT_URL || 'http://agent-controller:5000';

const STATUS_EMOJI = {
  complete: '✅',
  running:  '⏳',
  failed:   '❌',
  unknown:  '❓',
};

// /status <project> <task>     → single task status
// /tasks  <project>            → all tasks for a project
export async function status(bot, msg, match, opts = {}) {
  const chatId = msg.chat.id;

  // List all tasks for a project
  if (opts.listAll) {
    await listAllTasks(bot, chatId, opts.project);
    return;
  }

  const parts = match[1].trim().split(/\s+/);

  if (parts.length < 2) {
    await bot.sendMessage(chatId,
      `⚠️ Usage: \`/status <project> <task>\`\n\nExample:\n\`/status hello-world 001-auth.md\`\n\nTo list all tasks:\n\`/tasks hello-world\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const [project, task] = parts;

  try {
    const res  = await axios.get(`${AGENT_URL}/status`, { params: { project, task } });
    const { status: taskStatus, error } = res.data;
    const emoji = STATUS_EMOJI[taskStatus] || '❓';

    let text = `${emoji} *Task Status*\n\n*Project:* \`${project}\`\n*Task:* \`${task}\`\n*Status:* \`${taskStatus}\``;
    if (error) text += `\n*Error:* \`${error}\``;

    await bot.sendMessage(chatId, text, { parse_mode: 'Markdown' });

  } catch (err) {
    await bot.sendMessage(chatId,
      `❌ Could not fetch status\n\`${err.message}\``,
      { parse_mode: 'Markdown' }
    );
  }
}

// ── List all tasks ─────────────────────────────────────────

async function listAllTasks(bot, chatId, project) {
  try {
    const res   = await axios.get(`${AGENT_URL}/tasks`, { params: { project } });
    const tasks = res.data.tasks;

    if (!tasks || tasks.length === 0) {
      await bot.sendMessage(chatId,
        `📋 No tasks found for project \`${project}\``,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const lines = tasks.map(({ name, status }) => {
      const emoji = STATUS_EMOJI[status] || '❓';
      return `${emoji} \`${name}\` — ${status}`;
    });

    await bot.sendMessage(chatId,
      `📋 *Tasks for ${project}*\n\n${lines.join('\n')}`,
      { parse_mode: 'Markdown' }
    );

  } catch (err) {
    await bot.sendMessage(chatId,
      `❌ Could not fetch tasks\n\`${err.message}\``,
      { parse_mode: 'Markdown' }
    );
  }
}
