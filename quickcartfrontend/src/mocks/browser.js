import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';
import { db, resetMockDb } from './db';

// Dev helpers to simulate "the store changed behind the customer's back".
window.mockCatalog = {
  setStock: (productId, quantity) => db.setStock(productId, quantity),
  setActive: (productId, active) => db.setProductActive(productId, active),
};
export const worker = setupWorker(...handlers);

// Dev convenience: type resetMockDb() in the browser console to restore seed data.
window.resetMockDb = () => {
  resetMockDb();
  console.info('Mock DB reset. Reload the page.');
};