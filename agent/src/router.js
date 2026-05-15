import axios from 'axios';
import chalk from 'chalk';

// Agent router delegates to the llm-router service
// which handles complexity assessment + provider selection + fallback
const LLM_ROUTER_URL = process.env.LLM_ROUTER_URL || 'http://llm-router:6000';

export async function routeToLLM(prompt, taskContent) {
  console.log(chalk.gray(`  → Calling LLM Router at ${LLM_ROUTER_URL}`));

  const res = await axios.post(
    `${LLM_ROUTER_URL}/generate`,
    {
      prompt,
      type:    'code-gen',
      context: taskContent,
    },
    { timeout: 180000 }  // 3 min timeout for large code gen tasks
  );

  const { response, provider, complexity, duration_ms } = res.data;
  console.log(chalk.gray(`  ✓ Response from ${provider} (complexity=${complexity}, ${duration_ms}ms)`));

  return response;
}
