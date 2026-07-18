// PROVIDED — do not modify.
// Mirrors playbook-backend/src/interfaces/connectors.ts — keep in sync with the backend contract.
export type ConnectionStatus =
  | 'INITIALIZING'
  | 'INITIATED'
  | 'ACTIVE'
  | 'FAILED'
  | 'EXPIRED'
  | 'INACTIVE'
  | 'REVOKED';

// One row per connected toolkit (at most one connection per toolkit per user).
export interface ConnectorSummary {
  connectedAccountId: string;
  toolkit: string;
  name: string;
  logo: string | null;
  status: ConnectionStatus;
}

// Mirrors playbook-backend/src/components/connectors/toolkitCatalog.ts's ToolkitCatalogEntry.
export interface ToolkitCatalogEntry {
  slug: string;
  name: string;
  logo: string | null;
}
