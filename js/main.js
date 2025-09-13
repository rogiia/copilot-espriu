import { getSuggestion } from "./autocomplete.js";
import { TextParser } from "./text-parser.js";

/**
 * Render markdown content to the content display area
 * @param {string} content - Raw markdown text to be rendered
 */
function renderMarkdown(content) {
  document.getElementById('content').innerHTML =
    marked.parse(content);
}

/**
 * Creates the suggestion element in the editor if it does not exist
 * @param {HTMLElement} target - the editor element containing the suggestion span
 */
function addSuggestionElementToEditor(target) {
  const suggestionEl = target.querySelector("#suggestion");
  if (!suggestionEl) {
    target.innerHTML += '<span id="suggestion"></span>';
  }
}

/**
 * Clears the suggestion text
 * @param {HTMLElement} target - the editor element containing the suggestion span
 */
function clearSuggestion(target) {
  const suggestionEl = target.querySelector("#suggestion");
  suggestionEl.innerHTML = '';
}

/**
 * Extract plain text content from editor element, excluding suggestion span content
 * @param {HTMLElement} target - The editor element
 * @returns {string} - Plain text content from the editor without suggestions
 */
function getEditorText(target) {
  return target.innerText;
}

/**
 * Set cursor position to a specific offset in the editor
 * @param {HTMLElement} editor - The editor element
 * @param {number} offset - Character offset where to place the cursor
 */
function setCursorPosition(editor, offset) {
  const range = document.createRange();
  const selection = window.getSelection();

  let currentOffset = 0;
  let targetNode = null;
  let targetOffset = 0;

  // Walk through text nodes to find the position
  const walker = document.createTreeWalker(
    editor,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip suggestion span content
        if (node.parentNode.id === 'suggestion') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    const nodeLength = node.textContent.length;
    if (currentOffset + nodeLength >= offset) {
      targetNode = node;
      targetOffset = offset - currentOffset;
      break;
    }
    currentOffset += nodeLength;
  }

  if (targetNode) {
    range.setStart(targetNode, targetOffset);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

/**
 * Display autocomplete suggestion in the editor
 * @param {HTMLElement} target - The editor element containing the suggestion span
 * @param {string} suggestion - The suggestion text to display
 */
function renderSuggestion(target, suggestion) {
  const suggestionEl = target.querySelector('#suggestion');
  suggestionEl.innerText = suggestion;
}

/**
 * Accept the current suggestion by moving it into the editor content
 * @param {HTMLElement} target - The editor element
 */
function acceptSuggestion(target) {
  const suggestionEl = target.querySelector('#suggestion');
  const suggestionText = suggestionEl.innerText;

  if (suggestionText) {
    clearSuggestion(target);

    // Get current content without suggestion
    const currentText = getEditorText(target);

    // Add suggestion to the content
    const newContent = currentText + suggestionText;

    // Update editor content
    target.innerText = newContent;
    addSuggestionElementToEditor(target);

    // Move cursor to end
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(target);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);

    // Save updated content to localStorage
    saveEditorContent(newContent);

    // Re-render markdown
    renderMarkdown(newContent);
  }
}

/**
 * Calculate cursor position offset within the editor text
 * @param {Selection} selection - Browser selection object
 * @returns {number} - Character offset position of the cursor
 */
function getCursorOffset(selection) {
  const currentLineText = selection.anchorNode.data;
  const wholeText = selection.anchorNode.parentNode.innerText;
  return wholeText.length - currentLineText.length + selection.anchorOffset;
}

/**
 * Get context information from the context panel
 * @returns {Object} - Object containing purpose, audience, and style/tone
 */
function getContextInfo() {
  const purpose = document.getElementById('purpose').value.trim();
  const audience = document.getElementById('audience').value.trim();
  const styleTone = document.getElementById('style-tone').value.trim();
  
  return {
    purpose,
    audience,
    styleTone,
    hasContext: purpose || audience || styleTone
  };
}

/**
 * Save editor content to localStorage
 * @param {string} content - The content to save
 */
function saveEditorContent(content) {
  try {
    // Only save if localStorage is available and content is valid
    if (typeof Storage !== 'undefined' && typeof content === 'string') {
      localStorage.setItem('copilot-espriu-editor-content', content);
    }
  } catch (error) {
    console.warn('Failed to save editor content to localStorage:', error);
  }
}

/**
 * Load editor content from localStorage
 * @returns {string} - The saved content or empty string if none exists
 */
function loadEditorContent() {
  try {
    if (typeof Storage !== 'undefined') {
      const content = localStorage.getItem('copilot-espriu-editor-content');
      return content || '';
    }
    return '';
  } catch (error) {
    console.warn('Failed to load editor content from localStorage:', error);
    return '';
  }
}

/**
 * Clear saved editor content from localStorage
 */
function clearSavedContent() {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.removeItem('copilot-espriu-editor-content');
    }
  } catch (error) {
    console.warn('Failed to clear saved content from localStorage:', error);
  }
}

/**
 * Setup context panel functionality
 */
function setupContextPanel() {
  const toggleButton = document.getElementById('context-toggle');
  const toggleIcon = document.getElementById('toggle-icon');
  const contextContent = document.getElementById('context-content');

  toggleButton.addEventListener('click', () => {
    const isCollapsed = contextContent.classList.contains('collapsed');
    
    if (isCollapsed) {
      contextContent.classList.remove('collapsed');
      toggleIcon.classList.add('expanded');
      toggleIcon.textContent = '▼';
    } else {
      contextContent.classList.add('collapsed');
      toggleIcon.classList.remove('expanded');
      toggleIcon.textContent = '▶';
    }
  });
}

/**
 * Get model configuration from the form
 * @returns {Object} - Object containing model configuration
 */
function getModelConfig() {
  return {
    model: document.getElementById('model-name').value.trim() || 'gpt-4o-mini',
    baseUrl: document.getElementById('base-url').value.trim() || 'https://api.openai.com/v1',
    apiKey: document.getElementById('api-key').value.trim()
  };
}

/**
 * Save model configuration to localStorage
 * @param {Object} config - Model configuration object
 */
function saveModelConfig(config) {
  try {
    if (typeof Storage !== 'undefined') {
      localStorage.setItem('copilot-espriu-model-config', JSON.stringify(config));
    }
  } catch (error) {
    console.warn('Failed to save model config to localStorage:', error);
  }
}

/**
 * Load model configuration from localStorage
 * @returns {Object} - Saved model configuration or defaults
 */
function loadModelConfig() {
  try {
    if (typeof Storage !== 'undefined') {
      const saved = localStorage.getItem('copilot-espriu-model-config');
      if (saved) {
        return JSON.parse(saved);
      }
    }
  } catch (error) {
    console.warn('Failed to load model config from localStorage:', error);
  }
  
  return {
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: ''
  };
}

/**
 * Test connection to the configured API endpoint
 * @returns {Promise<boolean>} - True if connection successful
 */
async function testModelConnection() {
  const config = getModelConfig();
  const statusEl = document.getElementById('connection-status');
  const testBtn = document.getElementById('test-connection');
  
  statusEl.textContent = 'Testing...';
  statusEl.className = 'testing';
  testBtn.disabled = true;
  
  try {
    const { testOpenAIConnection } = await import('./openai-client.js');
    const success = await testOpenAIConnection(config);
    
    if (success) {
      statusEl.textContent = 'Connected ✓';
      statusEl.className = 'success';
      return true;
    }
  } catch (error) {
    statusEl.textContent = `Connection failed: ${error.message}`;
    statusEl.className = 'error';
    return false;
  } finally {
    testBtn.disabled = false;
  }
}

/**
 * Setup model configuration panel functionality
 */
function setupModelConfigPanel() {
  const toggleButton = document.getElementById('model-config-toggle');
  const toggleIcon = document.getElementById('model-toggle-icon');
  const configContent = document.getElementById('model-config-content');
  const testButton = document.getElementById('test-connection');
  
  // Load saved configuration
  const savedConfig = loadModelConfig();
  document.getElementById('model-name').value = savedConfig.model || 'gpt-4o-mini';
  document.getElementById('base-url').value = savedConfig.baseUrl || 'https://api.openai.com/v1';
  document.getElementById('api-key').value = savedConfig.apiKey || '';

  // Toggle panel
  toggleButton.addEventListener('click', () => {
    const isCollapsed = configContent.classList.contains('collapsed');
    
    if (isCollapsed) {
      configContent.classList.remove('collapsed');
      toggleIcon.classList.add('expanded');
      toggleIcon.textContent = '▼';
    } else {
      configContent.classList.add('collapsed');
      toggleIcon.classList.remove('expanded');
      toggleIcon.textContent = '▶';
    }
  });

  // Save configuration on change
  const configInputs = ['model-name', 'base-url', 'api-key'];
  configInputs.forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      saveModelConfig(getModelConfig());
    });
  });

  // Test connection button
  testButton.addEventListener('click', testModelConnection);
}

/**
 * Initialize editor with autocomplete functionality
 * @param {string} selector - CSS selector for the editor element
 */
function setupEditor(selector) {
  const editor = document.querySelector(selector);
  
  // Load saved content from localStorage
  const savedContent = loadEditorContent();
  if (savedContent) {
    editor.innerText = savedContent;
    renderMarkdown(savedContent);
    
    // Set cursor to end of loaded content
    setTimeout(() => {
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editor);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }, 0);
  }
  
  addSuggestionElementToEditor(editor);

  // Store the cursor position before suggestion appears
  let cursorPositionBeforeSuggestion = 0;

  editor.addEventListener('input', async (event) => {
    clearSuggestion(event.target);
    const text = getEditorText(event.target);
    
    // Save content to localStorage on every change
    saveEditorContent(text);
    
    renderMarkdown(text);
    const selection = window.getSelection();
    const cursorPosition = selection.anchorNode.parentNode === event.target ?
      getCursorOffset(selection) : null;

    // Store cursor position before showing suggestion
    if (cursorPosition !== null) {
      cursorPositionBeforeSuggestion = cursorPosition;
    }

    const autocompleteCtx = TextParser.getAutocompleteContext(text, cursorPosition, 2);
    if (autocompleteCtx && autocompleteCtx.shouldAutocomplete) {
      const contextInfo = getContextInfo();
      renderSuggestion(event.target,
        await getSuggestion(autocompleteCtx.currentSentence, autocompleteCtx.fullPreviousText, contextInfo));
    } else {
      renderSuggestion(event.target, '');
    }
  });

  editor.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      acceptSuggestion(event.target);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      clearSuggestion(event.target);
    }
    addSuggestionElementToEditor(editor);
  });

  // Handle cursor positioning when clicking/focusing in suggestion
  editor.addEventListener('mousedown', (event) => {
    // Check if the click target is inside the suggestion span
    if (event.target.id === 'suggestion' || event.target.closest('#suggestion')) {
      event.preventDefault();
      // Move cursor to position before suggestion
      setCursorPosition(editor, cursorPositionBeforeSuggestion);
    }
  });

  editor.addEventListener('focus', (event) => {
    // Use setTimeout to handle focus after any selection changes
    setTimeout(() => {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const suggestionEl = editor.querySelector('#suggestion');

        // Check if cursor is inside suggestion span
        if (suggestionEl && suggestionEl.contains(range.startContainer)) {
          setCursorPosition(editor, cursorPositionBeforeSuggestion);
        }
      }
    }, 0);
  });
}

window.addEventListener('load', () => {
  setupContextPanel();
  setupModelConfigPanel();
  setupEditor("#editor");
});
