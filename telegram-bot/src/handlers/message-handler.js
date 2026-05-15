import axios from 'axios';

const AGENT_URL = process.env.AGENT_URL || 'http://agent-controller:5000';

// Handles free-text messages (not commands)
// Lets you type naturally instead of remembering exact commands
export async function messageHandler(bot, msg) {
  const chatId = msg.chat.id;
  const text   = msg.text?.trim().toLowerCase() || '';

  if (!text) return;

  // ── Natural language shortcuts ─────────────────────────

  // "status" or "what's running"
  if (text === 'status' || text.includes("what's running") || text.includes('whats running')) {
    try {
      const res       = await axios.get(`${AGENT_URL}/containers`);
      const statuses  = res.data.containers;
      const lines     = statuses.map(({ name, status, running }) => {
        const emoji = running ? '🟢' : '🔴';
        return `${emoji} \`${name}\` — ${status}`;
      });
      await bot.sendMessage(chatId,
        `🏭 *Factory Status*\n\n${lines.join('\n')}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      await bot.sendMessage(chatId, `❌ Could not fetch status: \`${err.message}\``, { parse_mode: 'Markdown' });
    }
    return;
  }

  // "help"
  if (text === 'help' || text === 'commands') {
    await bot.sendMessage(chatId,
      `🏭 *AI Dev Factory — Commands*\n\n` +
      `/start\_task \`<project>\` \`<task>\` — run a task\n` +
      `/status \`<project>\` \`<task>\` — check task status\n` +
      `/tasks \`<project>\` — list all tasks\n` +
      `/logs \`<container>\` — get container logs\n` +
      `/new\_project \`<n>\` — scaffold new project`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // "restart <container>"
  const restartMatch = text.match(/^restart\s+(\w[\w-]*)$/);
  if (restartMatch) {
    const container = restartMatch[1];
    const sent = await bot.sendMessage(chatId, `⏳ Restarting \`${container}\`...`, { parse_mode: 'Markdown' });
    try {
      await axios.post(`${AGENT_URL}/restart/${container}`);
      await bot.editMessageText(
        `✅ Restarted \`${container}\``,
        { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
      );
    } catch (err) {
      await bot.editMessageText(
        `❌ Failed to restart \`${container}\`: \`${err.message}\``,
        { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
      );
    }
    return;
  }

  // ── Default: show hint ─────────────────────────────────
  // If the message is free text, create a task from it and run via agent
  const sent = await bot.sendMessage(chatId, `⏳ Creating task from your message...`);
  try {
    const res = await axios.post(`${AGENT_URL}/task-from-bot`, { project: 'hello-world', content: msg.text });
    const task = res.data.task;

    await bot.editMessageText(
      `🚀 Task created: \`${task}\`\nRunning...`,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );

    // Poll for status and notify when done
    const pollTask = async (attempts = 0) => {
      const MAX_ATTEMPTS = 60;
      const INTERVAL_MS = 10000;
      if (attempts >= MAX_ATTEMPTS) {
        await bot.sendMessage(chatId, `⏰ Task is taking longer than expected. Check with /status hello-world ${task}`);
        return;
      }
      try {
        const statusRes = await axios.get(`${AGENT_URL}/status`, { params: { project: 'hello-world', task } });
        const { status, error } = statusRes.data;
        if (status === 'complete') {
          await bot.sendMessage(chatId,
            `✅ *Task complete!*\n\n*Project:* \`hello-world\`\n*Task:* \`${task}\`\n\nCode has been written and committed to git.`,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        if (status === 'failed') {
          await bot.sendMessage(chatId,
            `❌ *Task failed*\n\n*Project:* \`hello-world\`\n*Task:* \`${task}\`\n\n*Error:* \`${error || 'Unknown error'}\``,
            { parse_mode: 'Markdown' }
          );
          return;
        }
        setTimeout(() => pollTask(attempts + 1), INTERVAL_MS);
      } catch (err) {
        setTimeout(() => pollTask(attempts + 1), INTERVAL_MS);
      }
    };
    pollTask();

  } catch (err) {
    await bot.editMessageText(
      `❌ Could not create task: \`${err.message}\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );
  }
}
