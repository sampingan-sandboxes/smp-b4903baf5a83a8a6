# Diagrams — Frontend Connectors Module

## Connect flow (swimlane)

The optimistic connect path: the combobox notifies the parent the moment a toolkit is
picked, then completes the connect + redirect round trip.

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant CB as AddConnectorCombobox
    participant P as Parent (connector list)
    participant API as connectors.ts
    participant BE as Backend (msw mock)
    participant Tab as New browser tab

    U->>CB: type query
    CB->>CB: debounce 250ms
    CB->>API: searchToolkits(idToken, query)
    API->>BE: GET /toolkits?search=query
    BE-->>CB: { toolkits }
    CB->>CB: drop excludeToolkits, render options
    U->>CB: select a toolkit
    CB->>P: onConnecting(toolkit)  %% synchronous, optimistic
    CB->>CB: clear query + close list
    CB->>API: connectConnector(idToken, slug)
    API->>BE: POST /connectors/slug/connect
    alt connect succeeds
        BE-->>CB: { redirectUrl }
        CB->>Tab: window.open(redirectUrl, _blank, noopener,noreferrer)
        CB->>P: onConnected()
    else connect fails
        BE-->>CB: non-OK
        CB->>CB: show "Failed to connect"
        CB->>P: onConnectError(slug)  %% parent rolls back the optimistic row
    end
```

## Combobox select decision

```mermaid
flowchart TD
    A[handleSelect toolkit] --> B[onConnecting toolkit]
    B --> C[clear query + close list]
    C --> D[await connectConnector idToken, slug]
    D -->|throws| E[setError 'Failed to connect' + onConnectError slug]
    D -->|ok| F{redirectUrl present?}
    F -->|yes| G[window.open redirectUrl]
    F -->|no| H[skip open]
    G --> I[onConnected]
    H --> I[onConnected]
```

## API client error contract

```mermaid
flowchart TD
    A[call fetch with Bearer token] --> B{response.ok?}
    B -->|no| E[throw 'Failed to <action>: <status>']
    B -->|yes| P[parse JSON]
    P --> R[return documented field]
```
