import axios from 'axios';

const AGENT_URL = process.env.AGENT_URL || 'http://agent-controller:5000';

// /start_task <project> <task>
// Example: /start_task hello-world 001-auth.md
export async function startTask(bot, msg, match) {
  const chatId = msg.chat.id;
  const parts  = match[1].trim().split(/\s+/);

  if (parts.length < 2) {
    await bot.sendMessage(chatId,
      `⚠️ Usage: \`/start_task <project> <task>\`\n\nExample:\n\`/start_task hello-world 001-auth.md\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const [project, task] = parts;

  // Send "starting" message and get its ID so we can update it
  const sent = await bot.sendMessage(chatId,
    `⏳ Starting task...\n\n*Project:* \`${project}\`\n*Task:* \`${task}\``,
    { parse_mode: 'Markdown' }
  );

  try {
    // Call agent controller
    await axios.post(`${AGENT_URL}/task`, { project, task });

    await bot.editMessageText(
      `🚀 *Task started!*\n\n*Project:* \`${project}\`\n*Task:* \`${task}\`\n\nThe agent is working on it. Check progress with:\n\`/status ${project} ${task}\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );

    // Poll for completion in background
    pollTaskStatus(bot, chatId, project, task);

  } catch (err) {
    await bot.editMessageText(
      `❌ *Failed to start task*\n\n\`${err.message}\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );
  }
}

// ── Poll task status and notify when done ──────────────────

async function pollTaskStatus(bot, chatId, project, task, attempts = 0) {
  const MAX_ATTEMPTS = 60;   // 60 × 10s = 10 minutes max
  const INTERVAL_MS  = 10000;

  if (attempts >= MAX_ATTEMPTS) {
    await bot.sendMessage(chatId,
      `⏰ Task is taking longer than expected.\nCheck manually: \`/status ${project} ${task}\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  setTimeout(async () => {
    try {
      const res    = await axios.get(`${AGENT_URL}/status`, { params: { project, task } });
      const { status, error } = res.data;

      if (status === 'complete') {
        await bot.sendMessage(chatId,
          `✅ *Task complete!*\n\n*Project:* \`${project}\`\n*Task:* \`${task}\`\n\nCode has been written and committed to git.`,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      if (status === 'failed') {
        await bot.sendMessage(chatId,
          `❌ *Task failed*\n\n*Project:* \`${project}\`\n*Task:* \`${task}\`\n\n*Error:* \`${error || 'Unknown error'}\``,
          { parse_mode: 'Markdown' }
        );
        return;
      }

      // Still running — keep polling
      pollTaskStatus(bot, chatId, project, task, attempts + 1);

    } catch {
      pollTaskStatus(bot, chatId, project, task, attempts + 1);
    }
  }, INTERVAL_MS);
}
