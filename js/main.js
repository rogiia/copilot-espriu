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

function getCursorOffset(selection) {
  const currentLineText = selection.anchorNode.data;
  const wholeText = selection.anchorNode.parentNode.innerText;
  return wholeText.length - currentLineText.length + selection.anchorOffset;
}

function setupEditor(selector) {
  const editor = document.querySelector(selector);
  editor.innerHTML += '<span id="suggestion"></span>';
  editor.addEventListener('input', async (event) => {
    const text = getEditorText(event.target);
    renderMarkdown(text);
    const selection = window.getSelection();
    const cursorPosition = selection.anchorNode.parentNode === event.target ?
      getCursorOffset(selection) : null;
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
