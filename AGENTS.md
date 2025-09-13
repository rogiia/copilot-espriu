# Agent Guidelines for Copilot Espriu

## Project Structure
- Frontend-only web app: HTML, CSS, vanilla JavaScript with ES6 modules
- Main files: `index.html`, `js/main.js`, `js/ollama-client.js`, `js/text-parser.js`, `style.css`
- Uses marked.js for markdown, integrates with Ollama API

## Build/Test Commands
- No package.json - static site served directly from filesystem
- Test manually by opening `index.html` in browser
- For development server: `python -m http.server 8000` or similar static server

## Code Style Guidelines
- **Modules**: Use ES6 imports/exports (`import { func } from "./module.js"`)
- **Functions**: Prefer function declarations over arrow functions for top-level
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: JSDoc format with `@param` and `@returns` for functions
- **Async**: Use async/await pattern, handle errors with try/catch
- **DOM**: Use `document.querySelector()`, avoid jQuery
- **Constants**: UPPER_SNAKE_CASE for API URLs and config
- **Strings**: Single quotes preferred, template literals for interpolation

## Patterns to Follow
- Export functions from modules, import only what's needed
- Use semantic HTML elements and CSS flexbox for layout
- Handle API responses with proper error checking (`response.ok`)
- Keep functions focused and well-documented