// PROVIDED — do not modify.
import { http, HttpResponse } from 'msw';
import { backendUrl } from '@/base/config';
import { createIdbStore } from '@/base/lib/idbStore';
import { requireBearer } from '@/base/mocks/requireBearer';
import type { ConnectorSummary, ToolkitCatalogEntry } from '@/interfaces/connectors';

// Stands in for Composio's full toolkit catalog, which the real GET /toolkits proxies
// (via the backend's cached toolkitCatalog module) — just enough entries to exercise
// search/filtering in tests without needing the real Composio API.
export const mockToolkitCatalog: ToolkitCatalogEntry[] = [
  { slug: 'gmail', name: 'Gmail', logo: 'https://logos.composio.dev/gmail.png' },
  { slug: 'googlecalendar', name: 'Google Calendar', logo: 'https://logos.composio.dev/googlecalendar.png' },
  { slug: 'slack', name: 'Slack', logo: 'https://logos.composio.dev/slack.png' },
  { slug: 'fireflies', name: 'Fireflies', logo: 'https://logos.composio.dev/fireflies.png' },
  { slug: 'notion', name: 'Notion', logo: 'https://logos.composio.dev/notion.png' },
  { slug: 'github', name: 'GitHub', logo: 'https://logos.composio.dev/github.png' },
];

// The connect/sync/disconnect handlers below mutate this store so a test (or an e2e run)
// can exercise the full connect -> sync -> disconnect loop through the real API client,
// not just one canned response per call. This mock does NOT reproduce the backend's own
// guard rules (409 on reconnecting an ACTIVE toolkit, 404 on disconnecting a missing one)
// — those are the backend's own tested behavior; this store only needs to make the happy
// path stateful.
// Reset between Vitest tests via resetConnectorsMock() (see src/base/test/setup.ts).
const connectorsStore = createIdbStore<ConnectorSummary[]>('msw-connectors-mock', 'state', 'connectors', []);

let connectionCounter = 0;

export async function resetConnectorsMock(): Promise<void> {
  connectionCounter = 0;
  await connectorsStore.set([]);
}

// Upserts by toolkit — at most one connection per toolkit per user, mirroring the
// backend's upsertConnection.
async function upsertConnection(toolkit: string): Promise<void> {
  const current = await connectorsStore.get();
  const catalogEntry = mockToolkitCatalog.find((entry) => entry.slug === toolkit);
  const existing = current.find((connection) => connection.toolkit === toolkit);
  const connectedAccountId = existing?.connectedAccountId ?? `mock-ca-${++connectionCounter}`;
  const connection: ConnectorSummary = {
    connectedAccountId,
    toolkit,
    name: catalogEntry?.name ?? toolkit,
    logo: catalogEntry?.logo ?? null,
    status: 'INITIATED',
  };
  await connectorsStore.set([...current.filter((c) => c.toolkit !== toolkit), connection]);
}

async function updateConnectionByToolkit(toolkit: string, patch: Partial<ConnectorSummary>): Promise<void> {
  const current = await connectorsStore.get();
  await connectorsStore.set(
    current.map((connection) => (connection.toolkit === toolkit ? { ...connection, ...patch } : connection)),
  );
}

async function removeConnectionByToolkit(toolkit: string): Promise<void> {
  const current = await connectorsStore.get();
  await connectorsStore.set(current.filter((connection) => connection.toolkit !== toolkit));
}

// Mirrors the response shapes of playbook-backend's src/connectors/handlers/*.ts.
export const connectorsHandlers = [
  http.get(`${backendUrl}/connectors`, async ({ request }) => {
    return requireBearer(request) ?? HttpResponse.json({ connectors: await connectorsStore.get() });
  }),

  http.get(`${backendUrl}/toolkits`, ({ request }) => {
    const unauthorized = requireBearer(request);
    if (unauthorized) return unauthorized;
    const search = new URL(request.url).searchParams.get('search')?.toLowerCase() ?? '';
    const toolkits = search
      ? mockToolkitCatalog.filter(
          (entry) => entry.name.toLowerCase().includes(search) || entry.slug.toLowerCase().includes(search),
        )
      : mockToolkitCatalog;
    return HttpResponse.json({ toolkits });
  }),

  http.post(`${backendUrl}/connectors/:toolkit/connect`, async ({ request, params }) => {
    const unauthorized = requireBearer(request);
    if (unauthorized) return unauthorized;
    await upsertConnection(params.toolkit as string);
    return HttpResponse.json({ redirectUrl: 'https://composio.dev/oauth/mock' });
  }),

  http.post(`${backendUrl}/connectors/:toolkit/sync`, async ({ request, params }) => {
    const unauthorized = requireBearer(request);
    if (unauthorized) return unauthorized;
    const toolkit = params.toolkit as string;
    await updateConnectionByToolkit(toolkit, { status: 'ACTIVE' });
    return HttpResponse.json({ toolkit, status: 'ACTIVE' });
  }),

  http.delete(`${backendUrl}/connectors/:toolkit`, async ({ request, params }) => {
    const unauthorized = requireBearer(request);
    if (unauthorized) return unauthorized;
    const toolkit = params.toolkit as string;
    await removeConnectionByToolkit(toolkit);
    return HttpResponse.json({ toolkit, disconnected: true });
  }),
];
