import axios from 'axios';

const BASE_URL = 'https://api.deepseek.com/v1';
const MODEL    = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

async function generate(prompt) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not set');
  }

  const res = await axios.post(
    `${BASE_URL}/chat/completions`,
    {
      model: MODEL,
      messages: [
        {
          role:    'system',
          content: 'You are an expert full-stack developer. Write clean, production-ready code. Always respond with valid JSON when asked.',
        },
        {
          role:    'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens:  8192,
    },
    {
      headers: {
        Authorization:  `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const content = res.data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('DeepSeek returned empty response');

  return content;
}

async function ping() {
  if (!process.env.DEEPSEEK_API_KEY) return false;
  try {
    // Lightweight check — just validate the API key works
    await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model:      MODEL,
        messages:   [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      },
      {
        headers: { Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        timeout: 5000,
      }
    );
    return true;
  } catch {
    return false;
  }
}

export const deepseekProvider = { name: 'deepseek', generate, ping };
