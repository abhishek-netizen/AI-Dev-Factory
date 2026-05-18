import axios from 'axios';

const AGENT_URL = process.env.AGENT_URL || 'http://agent-controller:5000';

// /new_project <name>
// Example: /new_project tripmate
export async function newProject(bot, msg, match) {
  const chatId      = msg.chat.id;
  const projectName = match[1].trim().toLowerCase().replace(/\s+/g, '-');

  if (!projectName) {
    await bot.sendMessage(chatId,
      `⚠️ Usage: \`/new_project <name>\`\n\nExample:\n\`/new_project tripmate\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const sent = await bot.sendMessage(chatId,
    `⏳ Scaffolding project \`${projectName}\`...`,
    { parse_mode: 'Markdown' }
  );

  try {
    await axios.post(`${AGENT_URL}/project`, { name: projectName });

    await bot.editMessageText(
      `✅ *Project created: ${projectName}*\n\n` +
      `Scaffold is ready at \`/projects/${projectName}/\`\n\n` +
      `Next steps:\n` +
      `1. Edit \`PROJ_DEFINATION.md\` with your project details\n` +
      `2. Add tasks to \`tasks/\` folder\n` +
      `3. Run \`/start_task ${projectName} 001-yourfirsttask.md\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );

  } catch (err) {
    await bot.editMessageText(
      `❌ *Failed to create project*\n\n\`${err.message}\``,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: 'Markdown' }
    );
  }
}
