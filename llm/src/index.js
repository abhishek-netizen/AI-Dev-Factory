import 'dotenv/config';
import express from 'express';
import chalk from 'chalk';
import { route } from './router.js';

const app = express();
app.use(express.json({ limit: '2mb' }));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status:    'ok',
    providers: {
      ollama:   !!process.env.OLLAMA_URL,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      claude:   !!process.env.CLAUDE_API_KEY,
    },
    default: process.env.DEFAULT_PROVIDER || 'ollama',
  });
});

// ── Main generate endpoint ─────────────────────────────────
// POST /generate
// Body: { prompt, type, context, forceProvider }
//
// type          → 'code-gen' | 'code-review' | 'bug-fix'
// context       → raw task/code string used to assess complexity
// forceProvider → 'ollama' | 'deepseek' | 'claude' (optional override)
app.post('/generate', async (req, res) => {
  const { prompt, type = 'code-gen', context = '', forceProvider } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  console.log(chalk.blue(`\n▶ /generate  type=${type}  force=${forceProvider || 'auto'}`));

  try {
    const result = await route({ prompt, type, context, forceProvider });
    res.json(result);
  } catch (err) {
    console.error(chalk.red('Generate error:'), err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Providers status ───────────────────────────────────────
// GET /providers — check which providers are reachable
app.get('/providers', async (req, res) => {
  const { ollamaProvider }   = await import('./providers/ollama.js');
  const { deepseekProvider } = await import('./providers/deepseek.js');
  const { claudeProvider }   = await import('./providers/claude.js');

  const [ollamaOk, deepseekOk, claudeOk] = await Promise.all([
    ollamaProvider.ping(),
    deepseekProvider.ping(),
    claudeProvider.ping(),
  ]);

  res.json({
    ollama:   { available: ollamaOk,   free: true,  label: 'Ollama (local)' },
    deepseek: { available: deepseekOk, free: false, label: 'DeepSeek API'   },
    claude:   { available: claudeOk,   free: false, label: 'Claude Haiku'   },
  });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 6000;
app.listen(PORT, () => {
  console.log(chalk.green(`\n✓ LLM Router running on port ${PORT}`));
  console.log(chalk.gray(`  Default provider → ${process.env.DEFAULT_PROVIDER || 'ollama'}`));
  console.log(chalk.gray(`  Ollama model     → ${process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b'}\n`));
});
