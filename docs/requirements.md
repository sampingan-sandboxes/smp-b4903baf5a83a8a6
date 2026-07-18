# Requirements — Frontend Connectors Module

## Context

A React (Vite) single-page app lets a signed-in user connect third-party **toolkits**
(Gmail, Slack, Notion, …) to the product. Connections are brokered by the backend, which
in turn talks to Composio. This module owns the client-side of that experience:

- a small **API client** (`connectors.ts`) over the backend's connectors endpoints, and
- the **AddConnectorCombobox** — a search-as-you-type control for finding a toolkit and
  starting a connection.

The backend, the shared TypeScript contract (`src/interfaces/connectors.ts`), the design
system `Command` primitives, and the msw mock that simulates the backend are **provided**.
You implement everything under `src/components/connectors/` that currently throws
`NotImplemented`.

## Functional requirements

### FR-1 — API client (`connectors.ts`)

Every call hits the backend at `${backendUrl}/…` and authenticates with the caller's token
via an `authorization: Bearer <accessToken>` header. On a non-OK HTTP response, throw the
exact message shown; on success, parse and return the documented value.

| Function | Request | Success → returns | Error message |
|----------|---------|-------------------|---------------|
| `listConnectors(accessToken)` | `GET /connectors` | `connectors` from `{ connectors }` | `Failed to load connectors: <status>` |
| `searchToolkits(accessToken, query)` | `GET /toolkits?search=<query>` | `toolkits` from `{ toolkits }` | `Failed to search toolkits: <status>` |
| `connectConnector(accessToken, toolkit)` | `POST /connectors/<toolkit>/connect` | `redirectUrl` from `{ redirectUrl }` (`string \| null`) | `Failed to connect <toolkit>: <status>` |
| `syncConnector(accessToken, toolkit)` | `POST /connectors/<toolkit>/sync` | `status` from `{ status }` | `Failed to sync <toolkit>: <status>` |
| `disconnectConnector(accessToken, toolkit)` | `DELETE /connectors/<toolkit>` | `void` | `Failed to disconnect <toolkit>: <status>` |

Build the `/toolkits` URL so `query` is sent as the `search` query-string parameter.

### FR-2 — AddConnectorCombobox (`components/AddConnectorCombobox.tsx`)

A `.tsx` React component built on the provided cmdk `Command` primitives.

Props:

```ts
interface AddConnectorComboboxProps {
  idToken: string;                                   // bearer credential for the API calls
  onConnected: () => void;                           // connect+redirect finished
  onConnecting?: (toolkit: ToolkitCatalogEntry) => void;  // fired synchronously on select
  onConnectError?: (toolkit: string) => void;        // connect failed (roll back)
  excludeToolkits?: string[];                        // slugs to hide (already connected)
}
```

Behaviour:

- **Search**: debounce the typed query by `SEARCH_DEBOUNCE_MS` (250 ms), then
  `searchToolkits(idToken, query)` and render the results as `CommandItem` options (each
  shows the logo, if any, and the name). A failed search clears the results — no error is
  shown to the user.
- **Exclusion**: never show a toolkit whose `slug` is in `excludeToolkits`.
- **Empty state**: render `CommandEmpty` with the text "No connectors found".
- **Open/close**: the list is shown only while the input is focused. Open on focus; close
  a short delay (`BLUR_CLOSE_DELAY_MS`, 150 ms) after blur so a click on an option still
  registers.
- **Select** (`handleSelect`), in order:
  1. call `onConnecting?.(toolkit)` **synchronously**, before any request, so the parent
     can optimistically show the row;
  2. clear the query and close the list;
  3. `await connectConnector(idToken, toolkit.slug)`;
  4. if a `redirectUrl` comes back, `window.open(redirectUrl, '_blank', 'noopener,noreferrer')`;
  5. call `onConnected()`.
- **Select failure**: if `connectConnector` throws, show the error text "Failed to connect"
  and call `onConnectError?.(toolkit.slug)`. Do **not** call `onConnected` or open a tab.

Accessibility: the search field exposes role `combobox`; each result exposes role `option`
(both come from the provided cmdk primitives — use them as given).

## Non-functional requirements

- TypeScript strict; `npm run lint` (oxlint) and `npm run build` (`tsc -b && vite build`)
  must be clean.
- Keep every file path and export signature exactly as given so the module stays drop-in
  compatible with the wider codebase.
- Do not modify provided files (see [specifications.md](specifications.md)).

See [specifications.md](specifications.md), [swimlane-diagram.md](swimlane-diagram.md), and
[features/](features/).
