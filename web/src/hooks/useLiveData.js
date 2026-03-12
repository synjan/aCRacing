import { useState, useEffect } from "react";

// Module-level cache shared across all hook instances
const cache = {};
const subscribers = {};

function subscribe(instance, callback) {
  if (!subscribers[instance]) subscribers[instance] = new Set();
  subscribers[instance].add(callback);

  // Start polling if first subscriber
  if (subscribers[instance].size === 1) {
    poll(instance);
  }

  return () => {
    subscribers[instance].delete(callback);
    // Stop polling if no subscribers
    if (subscribers[instance].size === 0) {
      clearTimeout(cache[instance]?.timer);
    }
  };
}

async function poll(instance) {
  if (!subscribers[instance]?.size) return;
  try {
    const r = await fetch(`/api/live/${instance}`, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      cache[instance] = { ...(cache[instance] || {}), data: await r.json(), error: null };
    }
  } catch (e) {
    cache[instance] = { ...(cache[instance] || {}), error: e.message };
  }
  subscribers[instance]?.forEach(cb => cb(cache[instance]));

  // Schedule next poll (pause if tab hidden)
  const delay = document.hidden ? 30000 : 5000;
  cache[instance].timer = setTimeout(() => poll(instance), delay);
}

export function useLiveData(instance) {
  const [state, setState] = useState(() => ({
    data: cache[instance]?.data || null,
    loading: !cache[instance]?.data,
    error: cache[instance]?.error || null,
  }));

  useEffect(() => {
    const unsub = subscribe(instance, (entry) => {
      setState({ data: entry.data, loading: false, error: entry.error });
    });
    return unsub;
  }, [instance]);

  return state;
}
