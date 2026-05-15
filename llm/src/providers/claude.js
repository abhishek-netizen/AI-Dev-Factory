import axios from 'axios';

const BASE_URL = 'https://api.anthropic.com/v1';
const MODEL    = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

async function generate(prompt) {
  if (!process.env.CLAUDE_API_KEY) {
    throw new Error('CLAUDE_API_KEY is not set');
  }

  const res = await axios.post(
    `${BASE_URL}/messages`,
    {
      model:      MODEL,
      max_tokens: 8096,
      system:     'You are an expert full-stack developer. Write clean, production-ready code. Always respond with valid JSON when asked.',
      messages: [
        {
          role:    'user',
          content: prompt,
        },
      ],
    },
    {
      headers: {
        'x-api-key':         process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      timeout: 60000,
    }
  );

  const content = res.data?.content?.[0]?.text;
  if (!content) throw new Error('Claude returned empty response');

  return content;
}

async function ping() {
  if (!process.env.CLAUDE_API_KEY) return false;
  try {
    await axios.post(
      `${BASE_URL}/messages`,
      {
        model:      MODEL,
        max_tokens: 1,
        messages:   [{ role: 'user', content: 'hi' }],
      },
      {
        headers: {
          'x-api-key':         process.env.CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        timeout: 5000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

export const claudeProvider = { name: 'claude', generate, ping };
