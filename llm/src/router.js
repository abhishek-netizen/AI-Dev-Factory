import chalk from 'chalk';
import { ollamaProvider }   from './providers/ollama.js';
import { deepseekProvider } from './providers/deepseek.js';
import { claudeProvider }   from './providers/claude.js';
import { codeGenPrompt }    from './prompts/code-gen.js';
import { codeReviewPrompt } from './prompts/code-review.js';
import { bugFixPrompt }     from './prompts/bug-fix.js';

// ── Complexity signals ─────────────────────────────────────

const COMPLEX_SIGNALS = [
  'architect', 'design system', 'refactor', 'migrate', 'security',
  'payment', 'stripe', 'oauth', 'authentication', 'authorisation',
  'authorization', 'websocket', 'real-time', 'microservice', 'caching strategy',
  'performance', 'optimise', 'optimize', 'database schema', 'indexing',
];

const MEDIUM_SIGNALS = [
  'api', 'endpoint', 'controller', 'service', 'component', 'screen',
  'hook', 'module', 'middleware', 'guard', 'interceptor', 'resolver',
  'repository', 'entity', 'dto', 'form', 'modal', 'page',
];

export function assessComplexity(context) {
  const lower = context.toLowerCase();
  if (COMPLEX_SIGNALS.some((s) => lower.includes(s))) return 'complex';
  if (MEDIUM_SIGNALS.some((s)  => lower.includes(s))) return 'medium';
  return 'simple';
}

// ── Prompt builder ─────────────────────────────────────────

function buildPrompt(type, prompt) {
  switch (type) {
    case 'code-review': return codeReviewPrompt(prompt);
    case 'bug-fix':     return bugFixPrompt(prompt);
    case 'code-gen':
    default:            return codeGenPrompt(prompt);
  }
}

// ── Provider selector ──────────────────────────────────────

function selectProvider(complexity, forceProvider) {
  // Manual override always wins
  if (forceProvider === 'ollama')   return ollamaProvider;
  if (forceProvider === 'deepseek') return deepseekProvider;
  if (forceProvider === 'claude')   return claudeProvider;

  // Env-level default overrides complexity routing
  const envDefault = process.env.DEFAULT_PROVIDER;
  if (envDefault === 'deepseek') return deepseekProvider;
  if (envDefault === 'claude')   return claudeProvider;

  // Route by complexity (ollama default)
  if (complexity === 'simple')  return ollamaProvider;
  if (complexity === 'medium')  return deepseekProvider;
  if (complexity === 'complex') return claudeProvider;

  return ollamaProvider;
}

// ── Fallback chain ─────────────────────────────────────────

const FALLBACK_CHAIN = [ollamaProvider, deepseekProvider, claudeProvider];

// ── Main route function ────────────────────────────────────

export async function route({ prompt, type, context, forceProvider }) {
  const complexity = assessComplexity(context || prompt);
  const finalPrompt = buildPrompt(type, prompt);
  const primary     = selectProvider(complexity, forceProvider);

  console.log(chalk.gray(`  complexity=${complexity}  provider=${primary.name}  type=${type}`));

  // Try primary provider
  try {
    const start    = Date.now();
    const response = await primary.generate(finalPrompt);
    const ms       = Date.now() - start;

    console.log(chalk.green(`  ✓ ${primary.name} responded in ${ms}ms`));

    return {
      response,
      provider:   primary.name,
      complexity,
      type,
      duration_ms: ms,
    };
  } catch (primaryErr) {
    console.warn(chalk.yellow(`  ⚠ ${primary.name} failed: ${primaryErr.message}`));

    // Try remaining providers in fallback chain
    const fallbacks = FALLBACK_CHAIN.filter((p) => p.name !== primary.name);

    for (const fallback of fallbacks) {
      try {
        console.log(chalk.gray(`  Trying fallback: ${fallback.name}`));
        const start    = Date.now();
        const response = await fallback.generate(finalPrompt);
        const ms       = Date.now() - start;

        console.log(chalk.green(`  ✓ ${fallback.name} responded in ${ms}ms (fallback)`));

        return {
          response,
          provider:    fallback.name,
          complexity,
          type,
          duration_ms: ms,
          fallback:    true,
        };
      } catch (err) {
        console.warn(chalk.yellow(`  ⚠ ${fallback.name} also failed: ${err.message}`));
      }
    }

    throw new Error('All LLM providers failed. Check your API keys and Ollama connection.');
  }
}
