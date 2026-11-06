import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { parseApiError } from './errorMessage';

// Runs `fetcher(signal)` whenever `deps` change. Gives every data screen the same
// loading / error / reload behaviour (Mandate 10) without repeating it.
export default function useFetch(fetcher, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setState((s) => ({ ...s, loading: true, error: null }));

    fetcher(controller.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err) => {
        if (axios.isCancel(err)) return; // superseded request: ignore silently
        setState({ data: null, loading: false, error: parseApiError(err) });
      });

    return () => controller.abort(); // runs before the next effect and on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload };
}