import 'dotenv/config';
import TelegramBot from 'node-telegram-bot-api';
import chalk from 'chalk';
import { messageHandler } from './handlers/message-handler.js';
import { startTask }   from './commands/start-task.js';
import { status }      from './commands/status.js';
import { logs }        from './commands/logs.js';
import { newProject }  from './commands/new-project.js';

// ── Bot init ───────────────────────────────────────────────
const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

// const bot = new TelegramBot(process.env.TELEGRAM_TOKEN, {
//     request: {
//         agentOptions: {
//             keepAlive: true,
//             family: 4
//         },
//         url: "https://api.telegram.org",
//     }
// });

console.log(chalk.green('✓ Telegram bot started'));

// ── Allowed users (optional security) ─────────────────────
// Set ALLOWED_CHAT_IDS=123456,789012 in .env to restrict access
// Leave empty to allow everyone
const ALLOWED = process.env.ALLOWED_CHAT_IDS
  ? process.env.ALLOWED_CHAT_IDS.split(',').map((id) => id.trim())
  : [];

function isAllowed(chatId) {
  if (ALLOWED.length === 0) return true;
  return ALLOWED.includes(String(chatId));
}

// ── Auth middleware ────────────────────────────────────────
function guard(handler) {
  return async (msg, match) => {
    if (!isAllowed(msg.chat.id)) {
      await bot.sendMessage(msg.chat.id, '⛔ Unauthorised.');
      return;
    }
    await handler(bot, msg, match);
  };
}

// ── Commands ───────────────────────────────────────────────

// /start — welcome message
bot.onText(/\/start$/, guard(async (bot, msg) => {
  await bot.sendMessage(msg.chat.id,
    `🏭 *AI Dev Factory*\n\nAvailable commands:\n\n` +
    `/start\_task \`<project>\` \`<task>\` — run a task\n` +
    `/status \`<project>\` \`<task>\` — check task status\n` +
    `/tasks \`<project>\` — list all tasks\n` +
    `/logs \`<container>\` — get container logs\n` +
    `/new\_project \`<name>\` — scaffold a new project\n` +
    `/help — show this message`,
    { parse_mode: 'Markdown' }
  );
}));

// /help — same as /start
bot.onText(/\/help/, guard(async (bot, msg) => {
  await bot.sendMessage(msg.chat.id,
    `🏭 *AI Dev Factory — Commands*\n\n` +
    `*Run a task:*\n\`/start_task hello-world task1.md\`\n\n` +
    `*Check task status:*\n\`/status hello-world task1.md\`\n\n` +
    `*List all tasks:*\n\`/tasks hello-world\`\n\n` +
    `*Get container logs:*\n\`/logs api\`\n\n` +
    `*New project:*\n\`/new_project myapp\``,
    { parse_mode: 'Markdown' }
  );
}));

// /start_task <project> <task>
bot.onText(/\/start_task (.+)/, guard(startTask));

// /status <project> <task>
bot.onText(/\/status (.+)/, guard(status));

// /tasks <project>
bot.onText(/\/tasks (.+)/, guard(async (bot, msg, match) => {
  const project = match[1].trim();
  await status(bot, msg, match, { listAll: true, project });
}));

// /logs <container>
bot.onText(/\/logs (.+)/, guard(logs));

// /new_project <name>
bot.onText(/\/new_project (.+)/, guard(newProject));

// ── Free text messages ─────────────────────────────────────
bot.on('message', guard(async (bot, msg) => {
  // Ignore command messages (already handled above)
  if (msg.text?.startsWith('/')) return;
  await messageHandler(bot, msg);
}));

// ── Error handling ─────────────────────────────────────────
bot.on('polling_error', (err) => {
  console.error(chalk.red('Polling error:'), err.message);
});

process.on('unhandledRejection', (err) => {
  console.error(chalk.red('Unhandled rejection:'), err);
});
