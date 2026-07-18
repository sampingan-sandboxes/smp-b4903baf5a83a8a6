# Module Specification — frontend connectors

## Files you implement (`src/components/connectors/`)

| File | Exports |
|------|---------|
| `connectors.ts` | `listConnectors`, `searchToolkits`, `connectConnector`, `syncConnector`, `disconnectConnector` |
| `components/AddConnectorCombobox.tsx` | default `AddConnectorCombobox` |

## Provided — do not modify

| File | Role |
|------|------|
| `src/base/config.ts` | `backendUrl` (from `VITE_BACKEND_URL`) |
| `src/base/lib/utils.ts` | `cn` class-name helper |
| `src/base/components/ui/command.tsx` | `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem` (cmdk) |
| `src/interfaces/connectors.ts` | `ConnectionStatus`, `ConnectorSummary`, `ToolkitCatalogEntry` |
| `src/components/connectors/mocks.ts` | the msw handlers that simulate the backend (dev + tests) |
| `src/base/mocks/**`, `src/base/test/**`, `src/base/lib/idbStore.ts` | msw wiring + Vitest setup |
| `src/App.tsx`, `src/main.tsx`, `src/index.css`, `index.html` | dev harness |

## Endpoints & shapes

`backendUrl` is `${VITE_BACKEND_URL}` (`http://backend.test` under `.env.test`). All calls
send `authorization: Bearer <token>`.

| Call | Request | Response |
|------|---------|----------|
| List | `GET ${backendUrl}/connectors` | `{ connectors: ConnectorSummary[] }` |
| Search | `GET ${backendUrl}/toolkits?search=<query>` | `{ toolkits: ToolkitCatalogEntry[] }` |
| Connect | `POST ${backendUrl}/connectors/<toolkit>/connect` | `{ redirectUrl: string \| null }` |
| Sync | `POST ${backendUrl}/connectors/<toolkit>/sync` | `{ status: ConnectionStatus }` |
| Disconnect | `DELETE ${backendUrl}/connectors/<toolkit>` | 2xx (body ignored) |

On any non-OK status each function throws `Failed to <action>: <status>` — see
[requirements.md](requirements.md) for the exact per-function wording.

## Types (`src/interfaces/connectors.ts`)

```ts
type ConnectionStatus =
  | 'INITIALIZING' | 'INITIATED' | 'ACTIVE' | 'FAILED' | 'EXPIRED' | 'INACTIVE' | 'REVOKED';

interface ConnectorSummary {
  connectedAccountId: string;
  toolkit: string;
  name: string;
  logo: string | null;
  status: ConnectionStatus;
}

interface ToolkitCatalogEntry { slug: string; name: string; logo: string | null; }
```

## Component constants

`SEARCH_DEBOUNCE_MS = 250`, `BLUR_CLOSE_DELAY_MS = 150`.

## Env (from `.env.test`)

`VITE_COGNITO_DOMAIN=test.auth.example.com`, `VITE_COGNITO_CLIENT_ID=test-client-id`,
`VITE_BACKEND_URL=http://backend.test`. Only `VITE_BACKEND_URL` is read by this module; the
Cognito values exist so the sandbox matches the parent app's env shape. Set
`VITE_ENABLE_MOCKS=true` to serve the API from the in-browser msw mock during `npm run dev`.

## Acceptance

The features in [features/](features/) run via jest-cucumber suites under
`tests/` (Vitest + jsdom, `globals: true`):

- `connectors-api.steps.ts` drives the API client against the real msw server (started in
  `src/base/test/setup.ts`) — the default stateful mock powers happy paths; per-scenario
  `server.use(...)` overrides record requests or force errors.
- `add-connector-combobox.steps.tsx` mocks `../connectors` and drives the component with
  React Testing Library + userEvent.

Your own unit tests (`*.test.ts[x]`) plus the acceptance suite must bring total coverage of
the files you write to 100% (branches, functions, lines, statements).
