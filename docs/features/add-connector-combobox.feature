Feature: Add-connector combobox
  A search-as-you-type combobox for connecting a new toolkit. It debounces the toolkit
  search, hides toolkits that are already connected, and on selection optimistically
  notifies the parent, connects the toolkit, opens the returned OAuth redirect in a new
  tab, and notifies the parent again.

  Scenario: The combobox renders a search input
    When the combobox is rendered
    Then a search input is shown

  Scenario: Typing shows the matching toolkits
    Given the toolkit search returns "notion" named "Notion"
    When the combobox is rendered
    And the user types "note" into the search input
    Then the option "Notion" is shown

  Scenario: An empty state is shown when no toolkits match
    Given the toolkit search returns no toolkits
    When the combobox is rendered
    And the user types "zzz" into the search input
    Then the empty state "No connectors found" is shown

  Scenario: Already-connected toolkits are excluded from the results
    Given the toolkit search returns "gmail" named "Gmail" and "notion" named "Notion"
    And the toolkit "gmail" is already connected
    When the combobox is rendered
    And the user opens the search input
    Then the option "Notion" is shown
    And the option "Gmail" is not shown

  Scenario: Selecting a toolkit connects it and opens the redirect
    Given the toolkit search returns "notion" named "Notion"
    And connecting returns the redirect URL "https://composio.dev/oauth/notion"
    When the combobox is rendered
    And the user opens the search input
    And the user selects the option "Notion"
    Then the parent is told "notion" is connecting
    And the toolkit "notion" was connected with token "token"
    And the redirect URL "https://composio.dev/oauth/notion" was opened in a new tab
    And the parent is told the connection completed

  Scenario: A failed connect shows an error and rolls back
    Given the toolkit search returns "notion" named "Notion"
    And connecting fails
    When the combobox is rendered
    And the user opens the search input
    And the user selects the option "Notion"
    Then the error "Failed to connect" is shown
    And the parent is told connecting "notion" failed
    And the connection is not reported as completed
    And no new tab is opened

  Scenario: Searching sends the id token as the bearer credential
    Given the toolkit search returns no toolkits
    When the combobox is rendered with id token "the-id-token"
    And the user types "x" into the search input
    Then the toolkit search was called with token "the-id-token" and query "x"
