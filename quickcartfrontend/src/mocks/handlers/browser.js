import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { resetMockDb } from './db';

export const worker = setupWorker(...handlers);

// Dev convenience: type resetMockDb() in the browser console to restore seed data.
window.resetMockDb = () => {
  resetMockDb();
  console.info('Mock DB reset. Reload the page.');
};