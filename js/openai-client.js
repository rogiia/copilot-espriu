/**
 * OpenAI API client for chat completions
 */

/**
 * Send chat completion request to OpenAI API
 * @param {string} prompt - The prompt to send
 * @param {Object} config - OpenAI configuration
 * @returns {Promise<string>} - Response text from the model
 */
export async function generateOpenAICompletion(prompt, config) {
  const url = `${config.baseUrl}/chat/completions`;

  const requestBody = {
    model: config.model,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_completion_tokens: 100,
    temperature: 1,
    top_p: 0.9,
    stop: [".", "!", "?", "\n"]
  };

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config.apiKey}`
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (response.ok) {
    const result = await response.json();
    return result.choices[0].message.content;
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }
}

/**
 * Test OpenAI API connection
 * @param {Object} config - OpenAI configuration
 * @returns {Promise<boolean>} - True if connection successful
 */
export async function testOpenAIConnection(config) {
  const url = `${config.baseUrl}/models`;

  const headers = {
    'Authorization': `Bearer ${config.apiKey}`
  };

  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  if (response.ok) {
    return true;
  } else {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }
}
