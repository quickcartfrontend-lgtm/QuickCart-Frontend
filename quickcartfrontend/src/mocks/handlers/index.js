// handlers/index.js
import { authHandlers } from './auth';
import { catalogHandlers } from './catalog';
import { cartHandlers } from './cart';

export const handlers = [...authHandlers, ...catalogHandlers, ...cartHandlers];