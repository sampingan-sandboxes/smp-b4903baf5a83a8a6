// Provided acceptance suite — do not modify.
// Executes docs/features/connectors-api.feature against your connectors API client.
// The tests drive the real msw server (started in src/base/test/setup.ts): the default
// stateful connectors mock powers the happy paths, and per-scenario `server.use(...)`
// overrides record requests or force error responses.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { http, HttpResponse } from 'msw';
import { beforeEach, expect } from 'vitest';
import { backendUrl } from '@/base/config';
import { server } from '@/base/test/server';
import type { ConnectionStatus, ConnectorSummary, ToolkitCatalogEntry } from '@/interfaces/connectors';
import {
  connectConnector,
  disconnectConnector,
  listConnectors,
  searchToolkits,
  syncConnector,
} from '../src/components/connectors/connectors';

const feature = loadFeature('docs/features/connectors-api.feature');

interface Ctx {
  connectors: ConnectorSummary[];
  toolkits: ToolkitCatalogEntry[];
  redirectUrl: string | null;
  status: ConnectionStatus | null;
  disconnected: boolean;
  error: unknown;
  capturedAuth: string | null;
  capturedMethod: string | null;
  capturedQuery: string | null;
}

const ctx: Ctx = {
  connectors: [],
  toolkits: [],
  redirectUrl: null,
  status: null,
  disconnected: false,
  error: null,
  capturedAuth: null,
  capturedMethod: null,
  capturedQuery: null,
};

beforeEach(() => {
  ctx.connectors = [];
  ctx.toolkits = [];
  ctx.redirectUrl = null;
  ctx.status = null;
  ctx.disconnected = false;
  ctx.error = null;
  ctx.capturedAuth = null;
  ctx.capturedMethod = null;
  ctx.capturedQuery = null;
});

// ---- setup callbacks (run through the real msw server) ----
const seedConnector = async (toolkit: string) => {
  // Seed via the default stateful mock's connect endpoint, bypassing the code under test.
  await fetch(`${backendUrl}/connectors/${toolkit}/connect`, {
    method: 'POST',
    headers: { authorization: 'Bearer seed' },
  });
};

const recordConnectors = () =>
  server.use(
    http.get(`${backendUrl}/connectors`, ({ request }) => {
      ctx.capturedAuth = request.headers.get('authorization');
      ctx.capturedMethod = request.method;
      return HttpResponse.json({ connectors: [] });
    }),
  );
const recordToolkits = () =>
  server.use(
    http.get(`${backendUrl}/toolkits`, ({ request }) => {
      ctx.capturedAuth = request.headers.get('authorization');
      ctx.capturedMethod = request.method;
      ctx.capturedQuery = new URL(request.url).searchParams.get('search');
      return HttpResponse.json({ toolkits: [] });
    }),
  );
const recordConnect = (toolkit: string) =>
  server.use(
    http.post(`${backendUrl}/connectors/${toolkit}/connect`, ({ request }) => {
      ctx.capturedAuth = request.headers.get('authorization');
      ctx.capturedMethod = request.method;
      return HttpResponse.json({ redirectUrl: null });
    }),
  );
const recordDisconnect = (toolkit: string) =>
  server.use(
    http.delete(`${backendUrl}/connectors/${toolkit}`, ({ request }) => {
      ctx.capturedAuth = request.headers.get('authorization');
      ctx.capturedMethod = request.method;
      return HttpResponse.json({ toolkit, disconnected: true });
    }),
  );

const failConnectors = (status: number) =>
  server.use(http.get(`${backendUrl}/connectors`, () => HttpResponse.json({ message: 'error' }, { status })));
const failToolkits = (status: number) =>
  server.use(http.get(`${backendUrl}/toolkits`, () => HttpResponse.json({ message: 'error' }, { status })));
const failConnect = (toolkit: string, status: number) =>
  server.use(
    http.post(`${backendUrl}/connectors/${toolkit}/connect`, () => HttpResponse.json({ message: 'error' }, { status })),
  );
const failSync = (toolkit: string, status: number) =>
  server.use(
    http.post(`${backendUrl}/connectors/${toolkit}/sync`, () => HttpResponse.json({ message: 'error' }, { status })),
  );
const failDisconnect = (toolkit: string, status: number) =>
  server.use(
    http.delete(`${backendUrl}/connectors/${toolkit}`, () => HttpResponse.json({ message: 'error' }, { status })),
  );

// ---- action callbacks (invoke the code under test) ----
const doList = async (token: string) => {
  try {
    ctx.connectors = await listConnectors(token);
  } catch (error) {
    ctx.error = error;
  }
};
const doSearch = async (query: string, token: string) => {
  try {
    ctx.toolkits = await searchToolkits(token, query);
  } catch (error) {
    ctx.error = error;
  }
};
const doConnect = async (toolkit: string, token: string) => {
  try {
    ctx.redirectUrl = await connectConnector(token, toolkit);
  } catch (error) {
    ctx.error = error;
  }
};
const doSync = async (toolkit: string, token: string) => {
  try {
    ctx.status = await syncConnector(token, toolkit);
  } catch (error) {
    ctx.error = error;
  }
};
const doDisconnect = async (toolkit: string, token: string) => {
  try {
    await disconnectConnector(token, toolkit);
    ctx.disconnected = true;
  } catch (error) {
    ctx.error = error;
  }
};

// ---- shared assertions ----
const thenRejectedWith = (message: string) => expect((ctx.error as Error).message).toBe(message);
const thenAuthIs = (value: string) => expect(ctx.capturedAuth).toBe(value);
const thenMethodIs = (method: string) => expect(ctx.capturedMethod).toBe(method);

defineFeature(feature, (test) => {
  test('Listing connectors returns the connectors from the backend', ({ given, when, then }) => {
    given(/^a connector for "([^"]*)" exists in the backend$/, seedConnector);
    when(/^the connectors are listed with token "([^"]*)"$/, doList);
    then(/^the listed connectors include a connector for "([^"]*)"$/, (toolkit) => {
      expect(ctx.connectors.some((connector) => connector.toolkit === toolkit)).toBe(true);
    });
  });

  test('Listing connectors sends the token as a bearer credential', ({ given, when, then }) => {
    given(/^the connectors endpoint records the incoming request$/, recordConnectors);
    when(/^the connectors are listed with token "([^"]*)"$/, doList);
    then(/^the endpoint received authorization "([^"]*)"$/, thenAuthIs);
  });

  test('Listing connectors throws when the response is not OK', ({ given, when, then }) => {
    given(/^the connectors endpoint responds with status (\d+)$/, (status) => failConnectors(Number(status)));
    when(/^the connectors are listed with token "([^"]*)"$/, doList);
    then(/^the call is rejected with "([^"]*)"$/, thenRejectedWith);
  });

  test('Searching toolkits returns the matching toolkits', ({ when, then }) => {
    when(/^toolkits are searched for "([^"]*)" with token "([^"]*)"$/, doSearch);
    then(/^the search results include a toolkit "([^"]*)"$/, (slug) => {
      expect(ctx.toolkits.some((toolkit) => toolkit.slug === slug)).toBe(true);
    });
  });

  test('Searching toolkits sends the query and the bearer token', ({ given, when, then, and }) => {
    given(/^the toolkits endpoint records the incoming request$/, recordToolkits);
    when(/^toolkits are searched for "([^"]*)" with token "([^"]*)"$/, doSearch);
    then(/^the endpoint received the search query "([^"]*)"$/, (query) => {
      expect(ctx.capturedQuery).toBe(query);
    });
    and(/^the endpoint received authorization "([^"]*)"$/, thenAuthIs);
  });

  test('Searching toolkits throws when the response is not OK', ({ given, when, then }) => {
    given(/^the toolkits endpoint responds with status (\d+)$/, (status) => failToolkits(Number(status)));
    when(/^toolkits are searched for "([^"]*)" with token "([^"]*)"$/, doSearch);
    then(/^the call is rejected with "([^"]*)"$/, thenRejectedWith);
  });

  test('Connecting a toolkit returns the redirect URL', ({ when, then }) => {
    when(/^the toolkit "([^"]*)" is connected with token "([^"]*)"$/, doConnect);
    then(/^the returned redirect URL is "([^"]*)"$/, (url) => {
      expect(ctx.redirectUrl).toBe(url);
    });
  });

  test('Connecting a toolkit POSTs with the bearer token', ({ given, when, then, and }) => {
    given(/^the connect endpoint for "([^"]*)" records the incoming request$/, recordConnect);
    when(/^the toolkit "([^"]*)" is connected with token "([^"]*)"$/, doConnect);
    then(/^the endpoint received method "([^"]*)"$/, thenMethodIs);
    and(/^the endpoint received authorization "([^"]*)"$/, thenAuthIs);
  });

  test('Connecting a toolkit throws when the response is not OK', ({ given, when, then }) => {
    given(/^the connect endpoint for "([^"]*)" responds with status (\d+)$/, (toolkit, status) =>
      failConnect(toolkit, Number(status)),
    );
    when(/^the toolkit "([^"]*)" is connected with token "([^"]*)"$/, doConnect);
    then(/^the call is rejected with "([^"]*)"$/, thenRejectedWith);
  });

  test('Syncing a toolkit returns its fresh status', ({ when, then }) => {
    when(/^the toolkit "([^"]*)" is synced with token "([^"]*)"$/, doSync);
    then(/^the returned status is "([^"]*)"$/, (status) => {
      expect(ctx.status).toBe(status);
    });
  });

  test('Syncing a toolkit throws when the response is not OK', ({ given, when, then }) => {
    given(/^the sync endpoint for "([^"]*)" responds with status (\d+)$/, (toolkit, status) =>
      failSync(toolkit, Number(status)),
    );
    when(/^the toolkit "([^"]*)" is synced with token "([^"]*)"$/, doSync);
    then(/^the call is rejected with "([^"]*)"$/, thenRejectedWith);
  });

  test('Disconnecting a toolkit resolves on success', ({ when, then }) => {
    when(/^the toolkit "([^"]*)" is disconnected with token "([^"]*)"$/, doDisconnect);
    then(/^the disconnect completed without error$/, () => {
      expect(ctx.disconnected).toBe(true);
      expect(ctx.error).toBeNull();
    });
  });

  test('Disconnecting a toolkit sends a DELETE with the bearer token', ({ given, when, then, and }) => {
    given(/^the disconnect endpoint for "([^"]*)" records the incoming request$/, recordDisconnect);
    when(/^the toolkit "([^"]*)" is disconnected with token "([^"]*)"$/, doDisconnect);
    then(/^the endpoint received method "([^"]*)"$/, thenMethodIs);
    and(/^the endpoint received authorization "([^"]*)"$/, thenAuthIs);
  });

  test('Disconnecting a toolkit throws when the response is not OK', ({ given, when, then }) => {
    given(/^the disconnect endpoint for "([^"]*)" responds with status (\d+)$/, (toolkit, status) =>
      failDisconnect(toolkit, Number(status)),
    );
    when(/^the toolkit "([^"]*)" is disconnected with token "([^"]*)"$/, doDisconnect);
    then(/^the call is rejected with "([^"]*)"$/, thenRejectedWith);
  });
});
