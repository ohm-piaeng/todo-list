import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'

const R = 'src/renderer/src'

/** Node / Electron / DB modules the renderer must never touch. */
const RENDERER_FORBIDDEN_MODULES = [
  { name: 'electron', message: 'Renderer has no Node access. Use window.api (preload).' },
  { name: 'better-sqlite3', message: 'DB lives in main. Use window.api (preload).' },
  { name: 'fs', message: 'Renderer has no Node access. Use window.api (preload).' },
  { name: 'path', message: 'Renderer has no Node access. Use window.api (preload).' },
  {
    name: 'tailwind-variants',
    importNames: ['tv', 'createTV', 'cn'],
    message: 'Use tv/cn from @renderer/shared/lib (token-aware tailwind-merge).'
  },
  {
    name: '@shared/notebook',
    allowTypeImports: true,
    message:
      'Value imports pull zod into the renderer bundle. Use `import type`, or plain values from @shared/notebook/constants.'
  },
  {
    name: 'tailwind-merge',
    message: 'Use cn from @renderer/shared/lib (token-aware tailwind-merge).'
  }
]
const RENDERER_FORBIDDEN_PATTERNS = [
  { group: ['node:*'], message: 'Renderer has no Node access. Use window.api (preload).' },
  { group: ['drizzle-orm', 'drizzle-orm/*'], message: 'DB lives in main. Use window.api.' }
]

export default defineConfig(
  { ignores: ['**/node_modules', '**/dist', '**/out', 'src/main/db/migrations/**'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },

  // ---------------------------------------------------------------------------
  // TypeScript conventions (see AGENTS.md)
  // ---------------------------------------------------------------------------
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true }
        }
      ],
      // allow `interface ITodo extends z.infer<typeof schema> {}`
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' }
      ],
      '@typescript-eslint/no-explicit-any': 'error'
    }
  },
  {
    // ambient declaration files augment third-party interfaces (e.g. `Window`)
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/naming-convention': 'off' }
  },

  // ---------------------------------------------------------------------------
  // Architecture boundaries (see AGENTS.md → Project structure)
  // ---------------------------------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { boundaries },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['tsconfig.node.json', 'tsconfig.web.json'],
          noWarnOnMultipleProjects: true
        }
      },
      'boundaries/include': ['src/**/*'],
      // first matching descriptor wins → most specific first
      'boundaries/elements': [
        // main process
        { type: 'main-ipc', pattern: 'src/main/ipc' },
        { type: 'main-db', pattern: 'src/main/db' },
        { type: 'main-feature', pattern: 'src/main/features/*', capture: ['name'] },

        // preload
        { type: 'preload', pattern: 'src/preload' },

        // renderer
        { type: 'r-app', pattern: `${R}/app` },
        { type: 'r-page', pattern: `${R}/pages` },
        { type: 'r-feature', pattern: `${R}/features/*`, capture: ['name'] },
        { type: 'r-ui', pattern: `${R}/shared/ui/*`, capture: ['level'] },
        { type: 'r-lib', pattern: `${R}/shared/(lib|hooks)` },
        { type: 'r-styles', pattern: `${R}/styles` },
        { type: 'r-assets', pattern: `${R}/assets` },

        // cross-process contracts — keep LAST: 'src/shared' also partially matches '${R}/shared'
        { type: 'shared', pattern: 'src/shared', partialMatch: false }
      ],
      'boundaries/files': [
        // entry files (element patterns match folders only)
        { pattern: 'src/main/index.ts', category: 'main-entry' },
        { pattern: `${R}/main.tsx`, category: 'r-entry' },
        { pattern: `${R}/env.d.ts`, category: 'r-entry' },
        { pattern: 'src/**/*.test.{ts,tsx}', category: 'test' },
        { pattern: 'src/main/features/*/*.repository.ts', category: 'repository' },
        { pattern: 'src/main/features/*/*.service.ts', category: 'service' },
        { pattern: 'src/main/features/*/*.ipc.ts', category: 'ipc' }
      ]
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            // --- tests may wire any layer of their own process together (e.g. an in-memory DB)
            {
              from: { file: { categories: 'test' } },
              allow: { to: { element: { type: '*' } } }
            },

            // --- shared contracts: depend on nothing local
            {
              from: { element: { type: 'shared' } },
              allow: { to: { element: { type: 'shared' } } }
            },

            // --- main
            {
              from: { file: { categories: 'main-entry' } },
              allow: { to: { element: { type: ['main-ipc', 'main-db', 'shared'] } } }
            },
            {
              from: { element: { type: 'main-ipc' } },
              allow: {
                to: [
                  { element: { type: 'shared' } },
                  // features are registered through their *.ipc.ts only
                  { element: { type: 'main-feature' }, file: { categories: 'ipc' } }
                ]
              }
            },
            {
              from: { element: { type: 'main-db' } },
              allow: { to: { element: { type: ['main-db', 'shared'] } } }
            },
            {
              from: { element: { type: 'main-feature' } },
              allow: { to: { element: { type: 'shared' } } }
            },
            {
              // only repositories touch the DB
              from: { element: { type: 'main-feature' }, file: { categories: 'repository' } },
              allow: { to: { element: { type: 'main-db' } } }
            },

            // --- preload
            {
              from: { element: { type: 'preload' } },
              allow: { to: { element: { type: ['preload', 'shared'] } } }
            },

            // --- renderer: app → pages → features → shared/ui, shared/lib
            {
              from: { file: { categories: 'r-entry' } },
              allow: { to: { element: { type: ['r-app', 'r-styles'] } } }
            },
            {
              from: { element: { type: 'r-app' } },
              allow: {
                to: [
                  {
                    element: { type: ['r-page', 'r-ui', 'r-lib', 'r-styles', 'r-assets', 'shared'] }
                  },
                  { element: { type: 'r-feature', fileInternalPath: 'index.ts' } }
                ]
              }
            },
            {
              from: { element: { type: 'r-page' } },
              allow: {
                to: [
                  { element: { type: ['r-ui', 'r-lib', 'r-assets', 'shared'] } },
                  { element: { type: 'r-feature', fileInternalPath: 'index.ts' } }
                ]
              }
            },
            {
              // features never import other features
              from: { element: { type: 'r-feature' } },
              allow: { to: { element: { type: ['r-ui', 'r-lib', 'r-assets', 'shared'] } } }
            },
            {
              from: { element: { type: 'r-lib' } },
              allow: { to: { element: { type: ['r-lib', 'shared'] } } }
            },

            // --- atomic levels: organisms → molecules → atoms
            {
              from: { element: { type: 'r-ui' } },
              allow: { to: { element: { type: ['r-lib', 'r-assets', 'shared'] } } }
            },
            {
              from: { element: { type: 'r-ui', captured: { level: 'molecules' } } },
              allow: { to: { element: { type: 'r-ui', captured: { level: 'atoms' } } } }
            },
            {
              from: { element: { type: 'r-ui', captured: { level: 'organisms' } } },
              allow: {
                to: { element: { type: 'r-ui', captured: { level: ['atoms', 'molecules'] } } }
              }
            },
            {
              from: { element: { type: 'r-ui', captured: { level: 'templates' } } },
              allow: {
                to: {
                  element: {
                    type: 'r-ui',
                    captured: { level: ['atoms', 'molecules', 'organisms'] }
                  }
                }
              }
            }
          ]
        }
      ]
    }
  },
  {
    // inside a main feature: ipc → service → repository
    files: ['src/main/features/**/*.ipc.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.repository', '**/*.repository'],
              message: 'IPC must go through the service.'
            }
          ]
        }
      ]
    }
  },
  {
    files: ['src/main/features/**/*.repository.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['*.service', '**/*.service', '*.ipc', '**/*.ipc'],
              message: 'Repository is the lowest layer.'
            }
          ]
        }
      ]
    }
  },
  {
    files: [`${R}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: RENDERER_FORBIDDEN_MODULES, patterns: RENDERER_FORBIDDEN_PATTERNS }
      ]
    }
  },

  {
    // the one place allowed to configure tailwind-merge / tailwind-variants
    files: [`${R}/shared/lib/cn.ts`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: RENDERER_FORBIDDEN_MODULES.filter((p) => !p.name.startsWith('tailwind')),
          patterns: RENDERER_FORBIDDEN_PATTERNS
        }
      ]
    }
  },

  eslintConfigPrettier
)
