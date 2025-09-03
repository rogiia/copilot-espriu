import { getSuggestion } from "./ollama-client.js";
import { TextParser } from "./text-parser.js";

function renderMarkdown(content) {
  document.getElementById('content').innerHTML =
    marked.parse(content);
}

function getEditorText(target) {
  return target.innerText;
}

function renderSuggestion(target, suggestion) {
  const suggestionEl = target.querySelector('#suggestion');
  suggestionEl.innerText = suggestion;
}

function setupEditor(selector) {
  const editor = document.querySelector(selector);
  editor.innerHTML += '<span id="suggestion"></span>';
  editor.addEventListener('input', async (event) => {
    const text = getEditorText(event.target);
    renderMarkdown(text);
    const selection = window.getSelection();
    const cursorPosition = selection.anchorNode.parentNode === event.target ?
      selection.anchorOffset : null;
    const autocompleteCtx = TextParser.getAutocompleteContext(text, cursorPosition, 2);
    if (autocompleteCtx && autocompleteCtx.shouldAutocomplete) {
      renderSuggestion(event.target,
        await getSuggestion(autocompleteCtx.currentSentence, autocompleteCtx.fullPreviousText));
    } else {
      renderSuggestion(event.target, '');
    }
  });
}

window.addEventListener('load', () => {
  setupEditor("#editor")
});
