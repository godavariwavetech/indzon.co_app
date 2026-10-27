// One request at a time; stop polling on blur/unmount or while the app is inactive.
export function startForegroundPolling({load, onSuccess, onSettled, intervalMs, appState}) {
  let stopped = false;
  let inFlight = false;
  let timer;
  let foreground = !appState.currentState || appState.currentState === 'active';
  const clearTimer = () => { clearTimeout(timer); timer = undefined; };
  const run = async () => {
    if (stopped || inFlight || !foreground) { return; }
    clearTimer();
    inFlight = true;
    try {
      const result = await load();
      if (!stopped) { onSuccess(result); }
    } catch (_) {
      // Preserve the last known tracking state and retry on the next interval.
    } finally {
      inFlight = false;
      if (!stopped) {
        onSettled?.();
        if (foreground && intervalMs > 0) { timer = setTimeout(run, intervalMs); }
      }
    }
  };
  const subscription = appState.addEventListener('change', state => {
    const wasForeground = foreground;
    foreground = state === 'active';
    clearTimer();
    if (foreground && !wasForeground) { run(); }
  });
  run();
  return () => {
    stopped = true;
    clearTimer();
    subscription.remove();
  };
}
