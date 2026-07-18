// PROVIDED — do not modify.
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { resetConnectorsMock } from '@/components/connectors/mocks';
import { server } from './server';

// jsdom has no ResizeObserver implementation — cmdk (used by AddConnectorCombobox)
// observes its list element's size to expose it as a CSS variable for animations.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(async () => {
  server.resetHandlers();
  await resetConnectorsMock();
  cleanup();
});
afterAll(() => server.close());
