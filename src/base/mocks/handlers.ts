// PROVIDED — do not modify.
import { http, HttpResponse } from 'msw';
import { backendUrl } from '@/base/config';
import { connectorsHandlers } from '@/components/connectors/mocks';

// Mirrors the response shape of playbook-backend's src/base/handlers/health.ts.
const baseHandlers = [
  http.get(`${backendUrl}/health`, () => {
    return HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
  }),
];

export const handlers = [...baseHandlers, ...connectorsHandlers];
