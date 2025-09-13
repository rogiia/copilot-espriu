import { generateCompletion } from './ollama-client.js';

/**
 * Build prompt for writing suggestion
 * @param {string} currentSentence - The incomplete sentence to complete
 * @param {string} previousText - Context from previous text
 * @param {Object} contextInfo - Writing context information
 * @returns {string} - Formatted prompt for the AI model
 */
function getSuggestionPrompt(currentSentence, previousText, contextInfo = {}) {
  let contextSection = '';
  
  if (contextInfo.hasContext) {
    contextSection = '\nWriting Guidelines:\n';
    if (contextInfo.purpose) {
      contextSection += `- Purpose: ${contextInfo.purpose}\n`;
    }
    if (contextInfo.audience) {
      contextSection += `- Target Audience: ${contextInfo.audience}\n`;
    }
    if (contextInfo.styleTone) {
      contextSection += `- Style & Tone: ${contextInfo.styleTone}\n`;
    }
  }

  return `You are a writing assistant for blog posts. Complete the current unfinished sentence based on the context provided.${contextSection}

Context: ${previousText}
Current sentence to complete: ${currentSentence}

Instructions:
- Return the complete sentence including both the existing text and your completion
- Match the writing tone and style from the context${contextInfo.hasContext ? ' and follow the writing guidelines above' : ''}
- End at the first sentence-ending punctuation (. ! ?)
- Keep it concise and natural
- Do not add new sentences or paragraphs

Complete sentence: ${currentSentence}`
}

/**
 * Parse and clean completion response
 * @param {string} response - Raw response from AI model (complete sentence)
 * @param {string} currentSentence - The original incomplete sentence
 * @returns {string} - Just the completion part, or empty string if no match
 */
function parseCompletion(response, currentSentence) {
  const cleanResponse = response.trim();
  const cleanCurrentSentence = currentSentence.trim();

  // Only show suggestion if response starts with the current sentence
  if (cleanResponse.toLowerCase().startsWith(cleanCurrentSentence.toLowerCase())) {
    return cleanResponse.slice(cleanCurrentSentence.length);
  }

  // If response doesn't match current sentence, don't show suggestion
  return '';
}

/**
 * Get writing suggestion from AI model
 * @param {string} currentSentence - The incomplete sentence to complete
 * @param {string} previousText - Context from previous text
 * @param {Object} contextInfo - Writing context information
 * @returns {Promise<string>} - Completion suggestion
 */
export async function getSuggestion(currentSentence, previousText, contextInfo = {}) {
  // Skip completions for very short sentences (1-2 characters)
  if (currentSentence.trim().length <= 2) {
    return '';
  }

  try {
    const prompt = getSuggestionPrompt(currentSentence, previousText, contextInfo);
    const response = await generateCompletion({
      prompt: prompt,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        num_predict: 50,
        stop: [".", "!", "?", "\n"]
      },
      stream: false
    });

    return parseCompletion(response, currentSentence);
  } catch (error) {
    console.error('Error getting suggestion:', error);
    return '';
  }
}
