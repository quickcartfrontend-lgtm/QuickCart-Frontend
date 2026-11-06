import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  addCartItem, clearCart, getCart, removeCartItem, setCartItemQuantity,
} from '../api/cartApi';
import { parseApiError } from '../utils/errorMessage';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

// Contract: after O5 / after placing an order, show an empty cart locally.
export const EMPTY_CART = {
  items: [], itemCount: 0, subtotal: 0, deliveryFee: 0, total: 0, hasUnavailableItems: false,
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  // The key makes React discard ALL cart state whenever the logged-in user changes
  // (login, logout, switching accounts). User A's cart can never flash for user B.
  return <CartState key={user?.id ?? 'guest'}>{children}</CartState>;
}

function CartState({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const enabled = isAuthenticated && !isAdmin; // Mandate 7: admins never call O1-O5

  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const queue = useRef(Promise.resolve());

  const refreshCart = useCallback(async () => {
    try {
      setCart(await getCart());
      setError(null);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) refreshCart();
  }, [enabled, refreshCart]);

  const reloadCart = useCallback(() => {
    setError(null);
    setLoading(true);
    return refreshCart();
  }, [refreshCart]);

  // Every mutation goes through here, one at a time.
  const mutate = useCallback(
    (call) => {
      const task = queue.current.then(async () => {
        try {
          const next = await call();
          setCart(next); // Mandate 3: replace with the response. No merging, no arithmetic.
          return next;
        } catch (err) {
          const { code } = parseApiError(err);
          if (code === 'INSUFFICIENT_STOCK' || code === 'PRODUCT_UNAVAILABLE') {
            refreshCart(); // Mandate 4: the cart is stale, re-fetch (O1)
          }
          throw err; // the caller shows the message
        }
      });
      queue.current = task.catch(() => {}); // a failure must not block the next mutation
      return task;
    },
    [refreshCart]
  );

  const addItem = useCallback((productId, quantity) => mutate(() => addCartItem(productId, quantity)), [mutate]);
  const setQuantity = useCallback((productId, quantity) => mutate(() => setCartItemQuantity(productId, quantity)), [mutate]);
  const removeItem = useCallback((productId) => mutate(() => removeCartItem(productId)), [mutate]);
  const clear = useCallback(
    () => mutate(async () => { await clearCart(); return EMPTY_CART; }), // Mandate 3: O5 => empty locally
    [mutate]
  );
  // For Step 6: after a successful order the cart is empty. No re-fetch.
  const resetCart = useCallback(() => setCart(EMPTY_CART), []);

  const value = useMemo(
    () => ({
      cart, loading, error,
      itemCount: cart?.itemCount ?? 0,
      reloadCart, addItem, setQuantity, removeItem, clear, resetCart,
    }),
    [cart, loading, error, reloadCart, addItem, setQuantity, removeItem, clear, resetCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}