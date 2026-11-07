# Notebook

A desktop notebook for **Markdown notes** and **to-do lists**, built with Electron, React and SQLite. Everything is stored locally on your machine.

- **Notes:** write in Markdown with a formatting toolbar (headings, bold, italic, strikethrough, lists, checklists, quotes, code, links) and shortcuts (`Ctrl+B`, `Ctrl+I`, `Ctrl+K`).
- **To-do lists:** check off tasks, rename them inline, and reorder by dragging the grip or with `Alt+↑` / `Alt+↓`. Text size and weight can be set per list.
- **Pages:** each note or list can hold several pages ("Page 1 of 2"). Add them with **New page**, delete them from the page `⋯` menu.
- **Sidebar:** shows every note and list with a short excerpt or "3 of 8 done" progress, and has a search box.
- Light and dark mode follow your OS setting.

## Tech stack

| Area       | Choice                                                                                |
| ---------- | ------------------------------------------------------------------------------------- |
| Shell      | Electron + [electron-vite](https://electron-vite.org)                                 |
| UI         | React 19, TypeScript, Tailwind CSS v4 (design tokens in `@theme`)                     |
| Data       | SQLite via `better-sqlite3` + `drizzle-orm`, accessed only from the main process      |
| State      | `@tanstack/react-query` over a typed `window.api` IPC bridge, with optimistic updates |
| Validation | `zod` on every IPC payload                                                            |
| Tests      | Vitest + Testing Library                                                              |

## Getting started

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

On first launch the app opens the welcome screen. Pick **Note** or **To-do list** to create your first page.

### Where data is stored

The database is `app.db` in Electron's `userData` folder:

| OS      | Path                                              |
| ------- | ------------------------------------------------- |
| Windows | `%APPDATA%\to-do-list\app.db`                     |
| macOS   | `~/Library/Application Support/to-do-list/app.db` |
| Linux   | `~/.config/to-do-list/app.db`                     |

Migrations run automatically on startup.

## Scripts

| Command               | What it does                                                    |
| --------------------- | --------------------------------------------------------------- |
| `npm run dev`         | Start the app with hot reload                                   |
| `npm test`            | Run unit tests (`npm run test:watch` for watch mode)            |
| `npm run typecheck`   | Type-check main, preload and renderer                           |
| `npm run lint`        | ESLint, including the architecture boundary rules               |
| `npm run format`      | Prettier (also sorts Tailwind classes)                          |
| `npm run db:generate` | Create a migration after changing `src/main/db/schema.ts`       |
| `npm run build:win`   | Windows installer → `dist/to-do-list-<version>-setup.exe`       |
| `npm run build:linux` | AppImage, snap and deb → `dist/` (must run on Linux, see below) |
| `npm run build:mac`   | macOS dmg (must run on macOS)                                   |

### Building for Linux from Windows

AppImage, snap and deb packaging need Linux tools, so run the build in Docker:

```bash
docker run --rm -v "${PWD}:/src:ro" -v "${PWD}/dist:/out" electronuserland/builder:22 \
  bash -c "cp -r /src /app && cd /app && rm -rf node_modules dist && npm ci && npx electron-vite build && npx electron-builder --linux AppImage deb --x64 -c.directories.output=/out"
```

`npx electron-builder --linux tar.gz` works on Windows directly if a plain archive is enough.

## Project structure

```
src/
  shared/      contracts used by every process: zod schemas, interfaces, IPC channel names
  main/        Electron main process: SQLite (db/), features (repository → service → ipc)
  preload/     exposes the typed window.api
  renderer/src/
    app/       providers and router
    pages/     screens composed from features (Welcome, Workspace)
    features/  documents, note, todo, each with a public index.ts
    shared/    atomic UI (atoms → molecules → organisms → templates), hooks, lib
    styles/    app.css and theme.css (design tokens)
design/        design-system.figcraft, the source of the tokens and screens
```

Architecture rules (import direction, feature isolation, `I`-prefixed interfaces, token-only styling) are enforced by ESLint. See [AGENTS.md](AGENTS.md) for the full conventions.

## Contributing

1. Branch from `develop`.
2. Make sure `npm run typecheck && npm run lint && npm test` pass.
3. Commit messages are in English, imperative mood.
