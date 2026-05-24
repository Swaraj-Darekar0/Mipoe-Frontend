# COMPONENT_LIBRARY.md – Shared UI Components

## Key UI Primitives (in `/src/components/ui/`)
- **Button (`button.tsx`)**: Standard button, supports variants and loading state.
- **Input (`input.tsx`)**: Text input, with label and error support.
- **Dialog (`dialog.tsx`)**: Modal dialog, composable for custom content.
- **Card (`card.tsx`)**: Card container for grouping content.
- **Table (`table.tsx`)**: Table component for data display.
- **Tabs (`tabs.tsx`)**: Tabbed navigation UI.
- **Toast/Toaster (`toast.tsx`, `toaster.tsx`)**: Notification system for feedback.
- **Avatar (`avatar.tsx`)**: User or brand avatar display.
- **Badge (`badge.tsx`)**: Status or label badge.
- **Accordion (`accordion.tsx`)**: Expand/collapse content sections.
- **Switch (`switch.tsx`)**: Toggle switch for boolean values.
- **Popover (`popover.tsx`)**: Floating content container.
- **Dropdown Menu (`dropdown-menu.tsx`)**: Menu for actions or navigation.

## Usage
- Always import from `/src/components/ui/` for shared primitives.
- Prefer composition over duplication—extend primitives for custom needs.
- Check this file before creating new UI components.
