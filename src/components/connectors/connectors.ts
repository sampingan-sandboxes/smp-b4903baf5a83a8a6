import { backendUrl } from '@/base/config';
import type { ConnectionStatus, ConnectorSummary, ToolkitCatalogEntry } from '@/interfaces/connectors';

/**
 * YOUR TASK — implement the connectors API client.
 *
 * Every call targets the backend at `${backendUrl}/…` and authenticates with the user's
 * bearer token via an `authorization: Bearer <accessToken>` header. On a non-OK response
 * each function throws `Failed to <action>: <status>` (see each doc comment for the exact
 * message). On success it parses and returns the documented shape.
 *
 * See docs/requirements.md and docs/specifications.md for the full contract.
 */

/**
 * GET `${backendUrl}/connectors` — the current user's connected toolkits.
 * Response body: `{ connectors: ConnectorSummary[] }`; resolve `connectors`.
 * Non-OK → throw `Failed to load connectors: <status>`.
 */
export async function listConnectors(_accessToken: string): Promise<ConnectorSummary[]> {
  void backendUrl;
  throw new Error('NotImplemented');
}

/**
 * GET `${backendUrl}/toolkits?search=<query>` — the toolkit catalog filtered by `query`.
 * Response body: `{ toolkits: ToolkitCatalogEntry[] }`; resolve `toolkits`.
 * Non-OK → throw `Failed to search toolkits: <status>`.
 */
export async function searchToolkits(_accessToken: string, _query: string): Promise<ToolkitCatalogEntry[]> {
  void backendUrl;
  throw new Error('NotImplemented');
}

/**
 * POST `${backendUrl}/connectors/<toolkit>/connect` — start a connection.
 * Response body: `{ redirectUrl: string | null }`; resolve `redirectUrl` (the hosted OAuth
 * URL to open, or null when no redirect is required).
 * Non-OK → throw `Failed to connect <toolkit>: <status>`.
 */
export async function connectConnector(_accessToken: string, _toolkit: string): Promise<string | null> {
  void backendUrl;
  throw new Error('NotImplemented');
}

/**
 * POST `${backendUrl}/connectors/<toolkit>/sync` — refresh a connection's status.
 * Response body: `{ status: ConnectionStatus }`; resolve `status`.
 * Non-OK → throw `Failed to sync <toolkit>: <status>`.
 */
export async function syncConnector(_accessToken: string, _toolkit: string): Promise<ConnectionStatus> {
  void backendUrl;
  throw new Error('NotImplemented');
}

/**
 * DELETE `${backendUrl}/connectors/<toolkit>` — remove a connection.
 * Resolves with no value on success.
 * Non-OK → throw `Failed to disconnect <toolkit>: <status>`.
 */
export async function disconnectConnector(_accessToken: string, _toolkit: string): Promise<void> {
  void backendUrl;
  throw new Error('NotImplemented');
}
