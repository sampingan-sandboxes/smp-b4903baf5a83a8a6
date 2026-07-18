// Provided dev harness — do not modify.
//
// A minimal page that mounts <AddConnectorCombobox> so `npm run dev` renders it. With
// VITE_ENABLE_MOCKS=true the msw worker answers the toolkit-search and connect calls, so
// you can drive the combobox end to end without a real backend. The parent-callback events
// (onConnecting / onConnected / onConnectError) are echoed into a small activity log to
// make the optimistic-update contract visible.
import { useState } from 'react';
import AddConnectorCombobox from '@/components/connectors/components/AddConnectorCombobox';
import type { ToolkitCatalogEntry } from '@/interfaces/connectors';

// A stand-in bearer credential for the dev harness; the msw mock accepts any Bearer token.
const FAKE_ID_TOKEN = 'dev-id-token';

function App() {
  const [log, setLog] = useState<string[]>([]);
  const append = (line: string) => setLog((prev) => [line, ...prev]);

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 16 }}>
      <h1>Connectors — add a connector</h1>
      <p>Search the toolkit catalog and connect one. Callback events appear below.</p>
      <AddConnectorCombobox
        idToken={FAKE_ID_TOKEN}
        onConnecting={(toolkit: ToolkitCatalogEntry) => append(`connecting ${toolkit.slug}`)}
        onConnected={() => append('connected')}
        onConnectError={(toolkit: string) => append(`connect error ${toolkit}`)}
      />
      <ul>
        {log.map((line, index) => (
          <li key={index}>{line}</li>
        ))}
      </ul>
    </main>
  );
}

export default App;
