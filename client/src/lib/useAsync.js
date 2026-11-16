import { useCallback, useEffect, useState } from 'react';

/** Run an async loader on mount (and when deps change); expose reload(). */
export default function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);

  const reload = useCallback(async () => {
    try {
      const data = await run();
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((s) => ({ ...s, error, loading: false }));
    }
  }, [run]);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true }));
    run()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error) => active && setState((s) => ({ ...s, error, loading: false })));
    return () => { active = false; };
  }, [run]);

  return { ...state, reload, setData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })) };
}
