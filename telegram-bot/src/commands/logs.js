import axios from 'axios';

const AGENT_URL = process.env.AGENT_URL || 'http://agent-controller:5000';

// Valid containers the user can request logs from
const VALID_CONTAINERS = ['api', 'web', 'mobile', 'ollama', 'redis', 'agent-controller', 'llm-router', 'telegram-bot', 'playwright'];

// /logs <container>
// Example: /logs api
export async function logs(bot, msg, match) {
  const chatId    = msg.chat.id;
  const container = match[1].trim().toLowerCase();

  if (!VALID_CONTAINERS.includes(container)) {
    await bot.sendMessage(chatId,
      `⚠️ Unknown container: \`${container}\`\n\nValid containers:\n${VALID_CONTAINERS.map((c) => `• \`${c}\``).join('\n')}`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const sent = await bot.sendMessage(chatId,
    `⏳ Fetching logs for \`${container}\`...`,
    { parse_mode: 'Markdown' }
  );

  try {
    const res  = await axios.get(`${AGENT_URL}/logs/${container}`);
    const text = res.data.logs || '(no logs)';

    // Telegram message limit is 4096 chars — truncate if needed
    const truncated = text.length > 3500
      ? '...(truncated)\n\n' + text.slice(-3500)
      : text;

    await bot.editMessageText(
      `📋 *Logs: ${container}*\n\n\`\`\`\n${truncated}\n\`\`\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );

  } catch (err) {
    await bot.editMessageText(
      `❌ Could not fetch logs\n\`${err.message}\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );
  }
}
