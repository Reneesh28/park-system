# PARKWISE — Development Guidelines

## 1. Architectural Philosophy

PARKWISE follows a strict **Frontend-First** strategy:
1. All client interfaces, states, and user journeys must be fully developed and validated against typed mock data before backend development begins.
2. The UI must interact exclusively with an independent API abstraction layer (`frontend/js/api/`). UI components must never hardcode fetch URLs or manipulate backend response objects directly.
3. No build tools, compilers (e.g. Babel/Webpack/Vite), or external frontend frameworks (React/Vue/Angular) are permitted. Vanilla standards-compliant HTML5, CSS3, and ES6+ modules must be maintained throughout.

---

## 2. Naming Conventions

### File & Directory Names
- All files and directories must use `kebab-case`.
  - Good: `student-dashboard.html`, `storage.service.js`, `mock-data.js`
  - Bad: `studentDashboard.html`, `StorageService.js`, `mock_data.js`
- Module type indicators should be placed as the second extension where appropriate:
  - `.api.js` for API clients (e.g., `parking.api.js`)
  - `.component.js` for UI renderers (e.g., `navbar.component.js`)
  - `.service.js` for services (e.g., `storage.service.js`)
  - `.page.js` for page controllers (e.g., `index.page.js`)

### JavaScript Identifiers
- **Variables & Functions**: `camelCase` (e.g., `getUserProfile`, `activeParkingSession`).
- **Constants & Configs**: `UPPER_SNAKE_CASE` (e.g., `API_CONFIG`, `STORAGE_PREFIX`).
- **Classes**: `PascalCase` (e.g., `ParkingService`).
- **DOM Element Variables**: Postfix with `El` (e.g., `submitBtnEl`, `lotsContainerEl`).

### CSS Classes & Variables
- **CSS Custom Properties**: `--kebab-case` with categorical prefixes:
  - Colors: `--color-primary`, `--color-text-main`, `--color-bg-surface`
  - Typography: `--font-size-sm`, `--font-weight-bold`
  - Spacing: `--space-2`, `--space-4`, `--space-8`
- **CSS Selectors**: Use `kebab-case` following standard BEM-inspired clarity without excessive nesting (e.g., `.card`, `.card-header`, `.card-body`, `.btn-primary`).
- Never use inline styles in production code; all styles must live in modular CSS sheets.

---

## 3. JavaScript Module Conventions

- Always include the `.js` extension in all `import` statements:
  ```javascript
  // Correct:
  import { apiRequest } from './api.js';

  // Incorrect (will break in native browser ES modules):
  import { apiRequest } from './api';
  ```
- Keep modules focused on a single responsibility:
  - `api/`: Network and mock data dispatching only.
  - `components/`: Pure markup generation or DOM rendering only.
  - `services/`: Encapsulating stateful browser APIs.
  - `utils/`: Side-effect-free pure functions.
  - `pages/`: DOM event listeners and view coordination only.
- Always handle errors gracefully with meaningful user feedback.

---

## 4. CSS Conventions

- Keep stylesheets strictly modular:
  - Tokens and variables in `variables.css`.
  - Base resets and layout in `main.css`.
  - Reusable buttons, cards, forms, and badges in `components.css`.
  - Specialized view styling in `auth.css` or `dashboard.css`.
  - Breakpoints and device adjustments in `responsive.css`.
- Use CSS Custom Properties for all colors, spacings, radiuses, and fonts to ensure visual consistency and simple theming.

---

## 5. Rules for Future AI Coding Agents

When continuing development on subsequent phases of PARKWISE:

1. **Respect Phase Boundaries**: Never begin implementing features for Phase 1.3 or Phase 2 while working on Phase 1.2. Complete the requested phase only.
2. **Never Introduce Frameworks or Build Tools**: Do not install npm packages, create `package.json` in the frontend, or write TypeScript/JSX. The project must always run directly via VS Code Live Server.
3. **Preserve Relative Paths**: HTML and script files must use relative paths (e.g. `../css/variables.css`, `./js/api/api.js`).
4. **Mock API Integrity**: Keep all mock business logic inside `js/api/` and `js/data/`. Do not bypass the API layer by accessing `mockData` directly inside page controllers.
5. **Update Progress Documentation**: Whenever completing a milestone, update `documentation/frontend-progress.md` with files created or modified.
6. **No External Maps or Paid APIs**: Campus parking locations and navigation must use self-contained geometric mock coordinates or campus zone grids.
