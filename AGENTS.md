# AGENTS.md

Guide for AI agents and humans working in this repo. Rules marked **[lint]** are enforced by ESLint (`npm run lint`) — a failing lint is a failing change.

## Stack
- Electron (electron-vite) · React 19 · TypeScript
- SQLite via `better-sqlite3` + `drizzle-orm` (main process only)
- Tailwind CSS v4 (`@tailwindcss/vite`) — no hand-written CSS classes
- Data fetching in renderer: `@tanstack/react-query` over `window.api`
- Validation: `zod`

## Commands
| Task | Command |
|---|---|
| Dev | `npm run dev` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Format | `npm run format` |
| Build (unpacked) | `npm run build:unpack` |

Before finishing any change: `npm run typecheck && npm run lint` must pass.

## Process boundaries
```
renderer (React, no Node) ──window.api──▶ preload (contextBridge) ──ipcRenderer.invoke──▶ main ──▶ SQLite
```
- Renderer never imports `electron`, `fs`, `path`, `better-sqlite3`, `drizzle-orm` or anything under `src/main` / `src/preload`. **[lint]**
- Main/preload never import from `src/renderer`. **[lint]**
- Types and zod schemas shared across processes live in `src/shared/` (alias `@shared`). `src/shared` imports nothing from main/preload/renderer. **[lint]**
- IPC channel names: `<feature>:<action>` (e.g. `todo:list`, `todo:create`). Define them once in `src/shared/ipc/`.
- Main validates every IPC payload with the zod schema from `@shared` before calling services.

## Project structure
```
src/
  shared/                  # cross-process contracts: zod schemas, interfaces, IPC channel names
  main/
    index.ts               # bootstrap only
    db/                    # client.ts, schema.ts, migrations/
    features/<name>/       # <name>.repository.ts · <name>.service.ts · <name>.ipc.ts
    ipc/register.ts
  preload/
    index.ts               # exposes typed window.api
  renderer/src/
    app/                   # App, providers, router
    pages/                 # compose features into screens; no business logic
    features/<name>/
      api/ components/ hooks/ types.ts
      index.ts             # PUBLIC API of the feature
    shared/
      ui/atoms|molecules|organisms|templates/
      lib/ hooks/
    styles/                # app.css (entry), theme.css (@theme tokens)
```

### Renderer dependency rules **[lint]**
Allowed import direction (left may import right, never the reverse):
```
app → pages → features → shared/ui, shared/lib, shared/hooks
```
- `features/a` must not import `features/b`. Share via `shared/` or compose in `pages/`.
- Outside a feature, import it only through `features/<name>/index.ts` (no deep imports).
- Atomic levels: `organisms → molecules → atoms`. A level may import only levels below it (atoms import no UI). `templates` may use any `shared/ui` level.
- `shared/ui` holds no domain logic and no data fetching.

### Main dependency rules **[lint]**
`ipc → service → repository → db`. Repositories are the only place that touches `db/`. Features do not import each other's repository.

## TypeScript conventions **[lint]**
- Use `interface` for object shapes, props and contracts. Name with an `I` prefix: `ITodo`, `IButtonProps`, `ITodoRepository`.
- Use `type` only where an interface cannot express it (unions, mapped/conditional types): `type TodoStatus = 'open' | 'done'`.
- Wrap inferred types in an interface: `export interface ITodo extends z.infer<typeof todoSchema> {}`.
- No `any`. Use `unknown` and narrow.
- Use path aliases (`@shared/*`, `@renderer/*`) instead of `../../..` across top-level folders.

## Styling (Tailwind v4)
Follows https://tailwindcss.com/docs/adding-custom-styles.
- **All design tokens** live in `@theme` in `src/renderer/src/styles/theme.css`, using Tailwind namespaces so utilities are generated: `--color-*`, `--font-*`, `--text-*`, `--spacing-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--breakpoint-*`.
- Two layers: primitive (`--color-brand-500`) → semantic (`--color-surface`, `--color-fg`, `--color-primary`). Components use **semantic** tokens only.
- Token values come from `design/design-system.figcraft`.
- Base styles: classes on `<html>`/`<body>` first; element defaults go in `@layer base` using `var(--…)` tokens.
- Tailwind's default palette, radius and text scales are cleared (`--color-*: initial` …): only design-system tokens exist. Spacing keeps the 4px base, which maps 1:1 to design `space/1–9`.
- Dark mode = `prefers-color-scheme` (Electron follows the OS); dark values override the same `--color-*` vars, so components never need `dark:` for token colors.
- Do **not** write custom CSS classes or `@layer components`. Component variants live in React atoms using `tv()` + `cn()` **imported from `@renderer/shared/lib`** — never from `tailwind-variants` / `tailwind-merge` directly. **[lint]**
- When adding a token to `@theme`, also add its name to the `extendTailwindMerge` config in `src/renderer/src/shared/lib/cn.ts`; otherwise `cn()` silently drops conflicting classes (e.g. `text-body` vs `text-fg`).
- A CSS feature with no utility → add `@utility` in `app.css` (e.g. `drag-region` for `-webkit-app-region`).
- Arbitrary values (`top-[117px]`) are an escape hatch. Never use them for color, spacing, radius or font size — add a token instead.
- CSS variables in classes: `bg-(--x)`; add a type hint when ambiguous: `text-(color:--x)`.
- No inline `style={{…}}` except for truly dynamic runtime values.

## Data (SQLite)
- DB file: `app.getPath('userData')/app.db`, WAL mode.
- Schema in `src/main/db/schema.ts`; after changing it run `npm run db:generate`. Migrations run on app start (`initDb()`), and ship via `extraResources` → `resources/migrations`. Never edit an applied migration — add a new one.
- `better-sqlite3` is a native module: it is listed under `asarUnpack` in `electron-builder.yml`.

## Adding a feature (checklist)
1. `src/shared/<name>/` — zod schemas + `I*` interfaces; channels in `src/shared/ipc/channels.ts`; API contract in `src/shared/ipc/api.ts`.
2. `src/main/db/schema.ts` table → `npm run db:generate`.
3. `src/main/features/<name>/` — repository → service → ipc (validate with zod); register in `src/main/ipc/register.ts`.
4. `src/preload/index.ts` — expose the typed methods.
5. `src/renderer/src/features/<name>/` — `api/` react-query hooks, `components/`, `index.ts` public API.
6. Compose in a `pages/` file, route in `app/router.tsx`.

## Git
- Branch from `develop`. Commit messages in English, imperative mood.
