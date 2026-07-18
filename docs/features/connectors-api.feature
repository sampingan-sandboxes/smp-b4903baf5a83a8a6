Feature: Connectors API client
  The connectors API client talks to the backend over fetch with a Bearer token. It
  parses the documented response shape on success and throws "Failed to <action>:
  <status>" when the backend responds with a non-OK status.

  Scenario: Listing connectors returns the connectors from the backend
    Given a connector for "gmail" exists in the backend
    When the connectors are listed with token "id-token"
    Then the listed connectors include a connector for "gmail"

  Scenario: Listing connectors sends the token as a bearer credential
    Given the connectors endpoint records the incoming request
    When the connectors are listed with token "the-token"
    Then the endpoint received authorization "Bearer the-token"

  Scenario: Listing connectors throws when the response is not OK
    Given the connectors endpoint responds with status 401
    When the connectors are listed with token "bad-token"
    Then the call is rejected with "Failed to load connectors: 401"

  Scenario: Searching toolkits returns the matching toolkits
    When toolkits are searched for "gmail" with token "id-token"
    Then the search results include a toolkit "gmail"

  Scenario: Searching toolkits sends the query and the bearer token
    Given the toolkits endpoint records the incoming request
    When toolkits are searched for "slack" with token "the-token"
    Then the endpoint received the search query "slack"
    And the endpoint received authorization "Bearer the-token"

  Scenario: Searching toolkits throws when the response is not OK
    Given the toolkits endpoint responds with status 502
    When toolkits are searched for "gmail" with token "id-token"
    Then the call is rejected with "Failed to search toolkits: 502"

  Scenario: Connecting a toolkit returns the redirect URL
    When the toolkit "gmail" is connected with token "id-token"
    Then the returned redirect URL is "https://composio.dev/oauth/mock"

  Scenario: Connecting a toolkit POSTs with the bearer token
    Given the connect endpoint for "slack" records the incoming request
    When the toolkit "slack" is connected with token "the-token"
    Then the endpoint received method "POST"
    And the endpoint received authorization "Bearer the-token"

  Scenario: Connecting a toolkit throws when the response is not OK
    Given the connect endpoint for "gmail" responds with status 502
    When the toolkit "gmail" is connected with token "id-token"
    Then the call is rejected with "Failed to connect gmail: 502"

  Scenario: Syncing a toolkit returns its fresh status
    When the toolkit "gmail" is synced with token "id-token"
    Then the returned status is "ACTIVE"

  Scenario: Syncing a toolkit throws when the response is not OK
    Given the sync endpoint for "gmail" responds with status 404
    When the toolkit "gmail" is synced with token "id-token"
    Then the call is rejected with "Failed to sync gmail: 404"

  Scenario: Disconnecting a toolkit resolves on success
    When the toolkit "slack" is disconnected with token "id-token"
    Then the disconnect completed without error

  Scenario: Disconnecting a toolkit sends a DELETE with the bearer token
    Given the disconnect endpoint for "slack" records the incoming request
    When the toolkit "slack" is disconnected with token "the-token"
    Then the endpoint received method "DELETE"
    And the endpoint received authorization "Bearer the-token"

  Scenario: Disconnecting a toolkit throws when the response is not OK
    Given the disconnect endpoint for "slack" responds with status 404
    When the toolkit "slack" is disconnected with token "id-token"
    Then the call is rejected with "Failed to disconnect slack: 404"
