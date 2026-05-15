import axios from 'axios';

const BASE_URL = process.env.OLLAMA_URL  || 'http://ollama:11434';
const MODEL    = process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b';

async function generate(prompt) {
  const res = await axios.post(
    `${BASE_URL}/api/generate`,
    {
      model:  MODEL,
      prompt,
      stream: false,
      options: {
        temperature:  0.2,    // low temp = more deterministic code
        num_predict:  8192,   // max tokens to generate
      },
    },
    { timeout: 600000 }       // 2 min timeout — local models can be slow
  );

  if (!res.data?.response) {
    throw new Error('Ollama returned empty response');
  }

  return res.data.response;
}

async function ping() {
  try {
    await axios.get(`${BASE_URL}`, { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

export const ollamaProvider = { name: 'ollama', generate, ping };
