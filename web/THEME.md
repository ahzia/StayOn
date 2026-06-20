# StayOn theme (web frontend)

Design tokens and components for the Next.js app. Canonical brand rules: [../docs/11_branding.md](../docs/11_branding.md)

## Structure

```
src/theme/
  tokens.css    # CSS variables — :root (light) + .dark
  config.ts     # TypeScript mirror + formatPoints()
  index.ts      # exports

src/components/
  theme-provider.tsx   # next-themes (light / dark / system)
  theme-toggle.tsx     # header sun/moon control
  ui/                  # Card, Button, PointsDisplay, CodeBlock
```

## Light & dark mode

- **Default:** follows system (`prefers-color-scheme`)
- **Override:** theme toggle in header → stored in `localStorage` key `stayon-theme`
- **Implementation:** `next-themes` adds `.dark` class on `<html>`

## Using tokens in Tailwind

Semantic utilities map to CSS variables:

| Utility | Token |
|---------|--------|
| `bg-background` | page background |
| `bg-surface` | cards |
| `text-foreground` | primary text |
| `text-muted` | secondary text |
| `text-brand` | primary accent |
| `text-points` | point balances |
| `bg-brand` | primary buttons |
| `border-border` | dividers |

Do not hardcode `zinc-*` or `amber-*` in pages — use semantic classes.

## Points formatting

```ts
import { formatPoints } from '@/theme';

formatPoints(1250);       // "1,250 points"
formatPoints(1);          // "1 point"
formatPoints(250, true);  // "250 pts"
```

## Adding a new page

1. Use `SiteHeader` via root layout (already global)
2. Wrap content in `main.flex-1` + `max-w-3xl` container
3. Use `Card`, `Button`, `PointsDisplay` from `@/components/ui/`
4. Test in both light and dark mode
