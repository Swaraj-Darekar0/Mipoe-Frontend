# SYSTEM.md – Frontend Contract

## Framework/Tooling
- **Framework:** React (with Vite)
- **Language:** TypeScript (strict conventions enforced)
- **State Management:** Zustand, React Query (for async state and caching)
- **Styling:** Tailwind CSS (primary), with allowance for CSS Modules if needed

## Component Patterns
- **Props:** All components must have explicit, typed props. Use TypeScript interfaces.
- **Presentational vs. Container:**
  - Presentational components: Stateless, UI-only, found in `/src/components/ui/`.
  - Container components: Handle logic, data fetching, and state, found in `/src/components/` or `/src/pages/`.
- **Styling:**
  - Use Tailwind CSS utility classes for layout and design.
  - Use CSS Modules only for complex, isolated styles.
- **Naming:**
  - Components: PascalCase (e.g., `UserCard.tsx`)
  - Hooks: camelCase, prefixed with `use` (e.g., `useUser.ts`)

## AI Guardrails
- **Component Reuse:** When editing UI, always check existing components in `/src/components` first to prevent duplicate code.
- **No Node Modules Scanning:** Never scan or reference `node_modules` for context or code suggestions.
- **Wiki-First Rule:** Any new hook, component, or pattern must be documented in `.wiki/` before or during implementation.
