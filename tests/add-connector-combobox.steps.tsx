// Provided acceptance suite — do not modify.
// Executes docs/features/add-connector-combobox.feature against your component.
// The '../src/components/connectors/connectors' module is mocked so this suite exercises the component's behaviour
// in isolation (search debounce, exclusion filter, optimistic connect flow) without any
// real network. The component is imported AFTER vi.mock so it binds to the mocked module.
import { defineFeature, loadFeature } from 'jest-cucumber';
import { afterEach, beforeEach, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ToolkitCatalogEntry } from '@/interfaces/connectors';

const mockSearchToolkits = vi.fn<(token: string, query: string) => Promise<ToolkitCatalogEntry[]>>();
const mockConnectConnector = vi.fn<(token: string, toolkit: string) => Promise<string | null>>();

vi.mock('../src/components/connectors/connectors', () => ({
  searchToolkits: mockSearchToolkits,
  connectConnector: mockConnectConnector,
}));

// Imported AFTER vi.mock so the component binds to the mocked '../src/components/connectors/connectors'.
const { default: AddConnectorCombobox } = await import('../src/components/connectors/components/AddConnectorCombobox');

const feature = loadFeature('docs/features/add-connector-combobox.feature');

let onConnected: ReturnType<typeof vi.fn<() => void>>;
let onConnecting: ReturnType<typeof vi.fn<(toolkit: ToolkitCatalogEntry) => void>>;
let onConnectError: ReturnType<typeof vi.fn<(toolkit: string) => void>>;
let openMock: ReturnType<typeof vi.spyOn>;
let user: ReturnType<typeof userEvent.setup>;
let excluded: string[];

beforeEach(() => {
  onConnected = vi.fn<() => void>();
  onConnecting = vi.fn<(toolkit: ToolkitCatalogEntry) => void>();
  onConnectError = vi.fn<(toolkit: string) => void>();
  excluded = [];
  mockSearchToolkits.mockReset().mockResolvedValue([]);
  mockConnectConnector.mockReset().mockResolvedValue(null);
  // jsdom implements window.open as a no-op returning null, enough to assert the call.
  openMock = vi.spyOn(window, 'open').mockReturnValue(null);
  user = userEvent.setup();
});

afterEach(() => {
  openMock.mockRestore();
});

function renderCombobox(idToken = 'token') {
  render(
    <AddConnectorCombobox
      idToken={idToken}
      onConnected={onConnected}
      onConnecting={onConnecting}
      onConnectError={onConnectError}
      excludeToolkits={excluded}
    />,
  );
}

const toolkit = (slug: string, name: string): ToolkitCatalogEntry => ({ slug, name, logo: null });

// ---- setup callbacks ----
const returnsOne = (slug: string, name: string) => mockSearchToolkits.mockResolvedValue([toolkit(slug, name)]);
const returnsNone = () => mockSearchToolkits.mockResolvedValue([]);
const returnsTwo = (slugA: string, nameA: string, slugB: string, nameB: string) =>
  mockSearchToolkits.mockResolvedValue([toolkit(slugA, nameA), toolkit(slugB, nameB)]);
const alreadyConnected = (slug: string) => excluded.push(slug);
const connectReturns = (url: string) => mockConnectConnector.mockResolvedValue(url);
const connectFails = () => mockConnectConnector.mockRejectedValue(new Error('connect failed'));

// ---- action callbacks ----
const renderDefault = () => renderCombobox();
const renderWithToken = (idToken: string) => renderCombobox(idToken);
const typeText = async (text: string) => {
  await user.type(screen.getByRole('combobox'), text);
};
const openInput = async () => {
  await user.click(screen.getByRole('combobox'));
};
const selectOption = async (name: string) => {
  const option = await waitFor(() => screen.getByRole('option', { name }));
  await user.click(option);
};

// ---- assertion callbacks ----
const searchInputShown = () => expect(screen.getByRole('combobox')).toBeInTheDocument();
const optionShown = async (name: string) =>
  waitFor(() => expect(screen.getByRole('option', { name })).toBeInTheDocument());
const optionNotShown = (name: string) => expect(screen.queryByRole('option', { name })).not.toBeInTheDocument();
const emptyStateShown = async (text: string) => waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
const toldConnecting = async (slug: string) =>
  waitFor(() => expect(onConnecting).toHaveBeenCalledWith(expect.objectContaining({ slug })));
const connectedWith = async (toolkitSlug: string, token: string) =>
  waitFor(() => expect(mockConnectConnector).toHaveBeenCalledWith(token, toolkitSlug));
const openedNewTab = async (url: string) =>
  waitFor(() => expect(openMock).toHaveBeenCalledWith(url, '_blank', 'noopener,noreferrer'));
const toldCompleted = async () => waitFor(() => expect(onConnected).toHaveBeenCalled());
const errorShown = async (text: string) => waitFor(() => expect(screen.getByText(text)).toBeInTheDocument());
const toldFailed = async (slug: string) => waitFor(() => expect(onConnectError).toHaveBeenCalledWith(slug));
const notCompleted = () => expect(onConnected).not.toHaveBeenCalled();
const noNewTab = () => expect(openMock).not.toHaveBeenCalled();
const searchCalledWith = async (token: string, query: string) =>
  waitFor(() => expect(mockSearchToolkits).toHaveBeenCalledWith(token, query));

defineFeature(feature, (test) => {
  test('The combobox renders a search input', ({ when, then }) => {
    when(/^the combobox is rendered$/, renderDefault);
    then(/^a search input is shown$/, searchInputShown);
  });

  test('Typing shows the matching toolkits', ({ given, when, and, then }) => {
    given(/^the toolkit search returns "([^"]*)" named "([^"]*)"$/, returnsOne);
    when(/^the combobox is rendered$/, renderDefault);
    and(/^the user types "([^"]*)" into the search input$/, typeText);
    then(/^the option "([^"]*)" is shown$/, optionShown);
  });

  test('An empty state is shown when no toolkits match', ({ given, when, and, then }) => {
    given(/^the toolkit search returns no toolkits$/, returnsNone);
    when(/^the combobox is rendered$/, renderDefault);
    and(/^the user types "([^"]*)" into the search input$/, typeText);
    then(/^the empty state "([^"]*)" is shown$/, emptyStateShown);
  });

  test('Already-connected toolkits are excluded from the results', ({ given, and, when, then }) => {
    given(/^the toolkit search returns "([^"]*)" named "([^"]*)" and "([^"]*)" named "([^"]*)"$/, returnsTwo);
    and(/^the toolkit "([^"]*)" is already connected$/, alreadyConnected);
    when(/^the combobox is rendered$/, renderDefault);
    and(/^the user opens the search input$/, openInput);
    then(/^the option "([^"]*)" is shown$/, optionShown);
    and(/^the option "([^"]*)" is not shown$/, optionNotShown);
  });

  test('Selecting a toolkit connects it and opens the redirect', ({ given, and, when, then }) => {
    given(/^the toolkit search returns "([^"]*)" named "([^"]*)"$/, returnsOne);
    and(/^connecting returns the redirect URL "([^"]*)"$/, connectReturns);
    when(/^the combobox is rendered$/, renderDefault);
    and(/^the user opens the search input$/, openInput);
    and(/^the user selects the option "([^"]*)"$/, selectOption);
    then(/^the parent is told "([^"]*)" is connecting$/, toldConnecting);
    and(/^the toolkit "([^"]*)" was connected with token "([^"]*)"$/, connectedWith);
    and(/^the redirect URL "([^"]*)" was opened in a new tab$/, openedNewTab);
    and(/^the parent is told the connection completed$/, toldCompleted);
  });

  test('A failed connect shows an error and rolls back', ({ given, and, when, then }) => {
    given(/^the toolkit search returns "([^"]*)" named "([^"]*)"$/, returnsOne);
    and(/^connecting fails$/, connectFails);
    when(/^the combobox is rendered$/, renderDefault);
    and(/^the user opens the search input$/, openInput);
    and(/^the user selects the option "([^"]*)"$/, selectOption);
    then(/^the error "([^"]*)" is shown$/, errorShown);
    and(/^the parent is told connecting "([^"]*)" failed$/, toldFailed);
    and(/^the connection is not reported as completed$/, notCompleted);
    and(/^no new tab is opened$/, noNewTab);
  });

  test('Searching sends the id token as the bearer credential', ({ given, when, and, then }) => {
    given(/^the toolkit search returns no toolkits$/, returnsNone);
    when(/^the combobox is rendered with id token "([^"]*)"$/, renderWithToken);
    and(/^the user types "([^"]*)" into the search input$/, typeText);
    then(/^the toolkit search was called with token "([^"]*)" and query "([^"]*)"$/, searchCalledWith);
  });
});
