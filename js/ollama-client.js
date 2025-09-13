/**
 * Get model configuration from localStorage
 * @returns {Object} - Model configuration object
 */
function getModelConfig() {
  try {
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('copilot-espriu-model-config');
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (error) {
    console.warn('Failed to load model config:', error);
  }

  return {
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: ''
  };
}

/**
 * Send completion request to OpenAI-compatible API
 * @param {Object} requestBody - Original request payload (for backward compatibility)
 * @returns {Promise<string>} - Raw response text from the model
 */
export async function generateCompletion(requestBody) {
  const config = getModelConfig();
  const prompt = requestBody.prompt;

  try {
    const { generateOpenAICompletion } = await import('./openai-client.js');
    return await generateOpenAICompletion(prompt, config);
  } catch (error) {
    console.error('API completion error:', error);
    throw error;
  }
}
