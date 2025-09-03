const OLLAMA_BASE_URL = 'http://localhost:11434';

function getSuggestionPrompt(currentSentence, previousText) {

  return `You are a writing assistant for blog posts. Complete only the current unfinished sentence based on the context provided.

Context: ${previousText}
Current sentence to complete: ${currentSentence}

Instructions:
- Provide only the words needed to finish the current sentence
- Match the writing tone and style from the context
- End at the first sentence-ending punctuation (. ! ?)
- Keep it concise and natural
- Do not add new sentences or paragraphs

Completion:`
}

export async function getSuggestion(currentSentence, previousText) {
  const url = OLLAMA_BASE_URL + '/api/generate';
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      model: 'gemma3',
      prompt: getSuggestionPrompt(currentSentence, previousText),
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        num_predict: 50,
        stop: [".", "!", "?", "\n"]
      },
      stream: false
    })
  });
  if (response.ok) {
    const result = await response.json();
    return result['response'];
  } else {
    throw new Error(`Ollama request error: ${response.status}`);
  }
}
