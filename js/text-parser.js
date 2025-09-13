export class TextParser {
  /**
   * Parse text and separate into context and current sentence
   * @param {string} fullText - Complete text from the editor
   * @param {number} cursorPosition - Current cursor position in the text
   * @returns {Object} - {previousText, currentSentence, hasIncompleteSentence}
   */
  static parseText(fullText, cursorPosition) {
    // If cursor is not at the end, we're editing in the middle - handle differently
    const textUpToCursor = fullText.substring(0, cursorPosition);

    // Find sentence boundaries (., !, ?, line breaks) followed by space or end of text
    const sentenceEnders = /[.!?\n](?:\s|$)/g;

    let lastSentenceEnd = -1;
    let match;

    // Find the last sentence ending before cursor position
    while ((match = sentenceEnders.exec(textUpToCursor)) !== null) {
      lastSentenceEnd = match.index + 1; // Position after the punctuation
    }

    // Split the text
    const previousText = lastSentenceEnd >= 0 ?
      fullText.substring(0, lastSentenceEnd).trim() : '';

    const currentSentence = lastSentenceEnd >= 0 ?
      textUpToCursor.substring(lastSentenceEnd).trim() : textUpToCursor.trim();

    // Check if we actually have an incomplete sentence
    const hasIncompleteSentence = currentSentence.length > 0 &&
      !this.endsWithSentencePunctuation(currentSentence);

    return {
      previousText,
      currentSentence,
      hasIncompleteSentence,
      cursorAtEnd: cursorPosition === fullText.length
    };
  }

  /**
   * Check if text ends with sentence-ending punctuation or line break
   */
  static endsWithSentencePunctuation(text) {
    return /[.!?\n]\s*$/.test(text);
  }

  /**
   * Get context for autocomplete (last few sentences + current incomplete sentence)
   * @param {string} fullText - Complete text from editor
   * @param {number} cursorPosition - Current cursor position
   * @param {number} contextSentences - Number of previous sentences to include as context
   * @returns {Object} - Parsed text with context
   */
  static getAutocompleteContext(fullText, cursorPosition, contextSentences = 2) {
    const parsed = this.parseText(fullText, cursorPosition);

    if (!parsed.hasIncompleteSentence) {
      return null; // No autocomplete needed
    }

    // Get limited context (last N sentences)
    const contextText = this.getLastNSentences(parsed.previousText, contextSentences);

    return {
      context: contextText,
      currentSentence: parsed.currentSentence,
      shouldAutocomplete: parsed.hasIncompleteSentence && parsed.cursorAtEnd,
      fullPreviousText: parsed.previousText
    };
  }

  /**
   * Extract the last N complete sentences from text
   */
  static getLastNSentences(text, n) {
    if (!text || n <= 0) return '';

    const sentences = text.match(/[^.!?\n]*[.!?\n]/g) || [];
    return sentences.slice(-n).join(' ').trim();
  }

  /**
   * Clean and validate autocomplete suggestion
   */
  static cleanSuggestion(suggestion, currentSentence) {
    if (!suggestion) return '';

    let cleaned = suggestion.trim();

    // Remove any repeated text from the beginning
    if (cleaned.toLowerCase().startsWith(currentSentence.toLowerCase())) {
      cleaned = cleaned.substring(currentSentence.length).trim();
    }

    // Ensure it doesn't start with punctuation (unless it's a continuation)
    if (cleaned.match(/^[.!?]/)) {
      return cleaned;
    }

    // Add space if needed
    if (cleaned && currentSentence && !currentSentence.endsWith(' ')) {
      cleaned = ' ' + cleaned;
    }

    // Stop at first sentence ending
    const firstSentenceEnd = cleaned.match(/[.!?\n]/);
    if (firstSentenceEnd) {
      cleaned = cleaned.substring(0, firstSentenceEnd.index + 1);
    }

    return cleaned;
  }
}
