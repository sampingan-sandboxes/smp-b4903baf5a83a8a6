# Project Brief — Frontend Connectors Module

This project is a self-contained slice of a production React SPA. The goal of this engagement
is to build its **connectors** module: a small API client over the backend's connectors
endpoints, and the **AddConnectorCombobox** search-and-connect UI.

## Scope of work

The skeleton files under `src/components/connectors/` (currently throwing `NotImplemented`):

- `connectors.ts` — `listConnectors`, `searchToolkits`, `connectConnector`,
  `syncConnector`, `disconnectConnector` (fetch + Bearer auth against the backend).
- `components/AddConnectorCombobox.tsx` — the search-as-you-type combobox (cmdk `Command`)
  that filters, excludes already-connected toolkits, and runs the optimistic connect flow.

The contract is documented in:

- [docs/requirements.md](docs/requirements.md) — context + functional requirements
- [docs/specifications.md](docs/specifications.md) — file map, endpoints, types
- [docs/swimlane-diagram.md](docs/swimlane-diagram.md) — connect flow + select decisions
- [docs/features/](docs/features/) — the executable acceptance scenarios (Gherkin)

`src/base/**`, `src/interfaces/connectors.ts`, the msw mock (`connectors/mocks.ts`), and the
dev harness (`App.tsx`, `main.tsx`, `index.html`) are **provided** — you import them but do
not modify them.

## Getting started

```bash
npm install
npm test               # runs the acceptance suites (they fail until you implement)
```

| Command | Purpose |
|---------|---------|
| `npm run dev` | Boots the SPA (Vite). Set `VITE_ENABLE_MOCKS=true` to serve the API from the in-browser msw mock so the combobox works without a backend |
| `npm test` | Runs all tests, including the jest-cucumber acceptance suites (Vitest + jsdom) |
| `npm run test:coverage` | Runs tests with coverage |
| `npm run lint` | oxlint — must pass |
| `npm run build` | `tsc -b && vite build` — must pass |

`.env.test` already provides safe backend/Cognito values for the test run.

## Definition of done

1. **All acceptance scenarios should pass.** The suites under
   `tests/` execute the Gherkin features in `docs/features/`.
   Please leave the feature files and the step definitions alone.
2. **Ship the module with its own tests too.** Add your unit tests (`*.test.ts[x]`) alongside
   the acceptance suite and aim for solid coverage of the code you write — check with
   `npm run test:coverage`.
3. **Keep the public surface and file paths exactly as given** — so the module plugs straight
   into the wider codebase.
4. **Please leave the provided files alone** — configs, docs, acceptance suites, `src/base/**`,
   `src/interfaces/**`, `connectors/mocks.ts`, and the dev harness.
5. **Avoid new runtime dependencies** unless there's a clear reason (note it in your handover).
   Test dev-dependencies are fine.
6. `npm run lint` and `npm run build` should pass with zero errors.

## Delivery

Push to a repository and share access, or send the sandbox as a zip (without `node_modules/`),
including a short note on any decisions or trade-offs you made.
