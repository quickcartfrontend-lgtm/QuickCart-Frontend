import { authHandlers } from './auth';

// Each later step appends its handlers here: catalog (Step 3), cart (4), ...
export const handlers = [...authHandlers];