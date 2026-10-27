// Shared product snapshots; cart quantities stay in Redux and are never changed here.
export function createLiveItemCache(loadItem) {
  const items = new Map();
  const pending = new Map();
  const listeners = new Set();
  const keyFor = (id, locationId) => `${locationId || 0}|${id}`;
  return {
    get: (id, locationId) => items.get(keyFor(id, locationId)),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async refresh(ids, locationId) {
      const entries = await Promise.all([...new Set(ids)].map(async id => {
        const key = keyFor(id, locationId);
        if (!pending.has(key)) {
          const request = Promise.resolve().then(() => loadItem(id, locationId))
            .then(item => {
              items.set(key, item);
              listeners.forEach(listener => listener());
              return item;
            }).finally(() => pending.delete(key));
          pending.set(key, request);
        }
        return [id, await pending.get(key)];
      }));
      return Object.fromEntries(entries);
    },
  };
}
