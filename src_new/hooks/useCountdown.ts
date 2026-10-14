import {useCallback, useEffect, useState} from 'react';

/**
 * Whole-second countdown that stops at 0. `restart` starts it again, e.g.
 * after an OTP is re-sent.
 */
export function useCountdown(initialSeconds: number) {
  const [endsAt, setEndsAt] = useState(
    () => Date.now() + initialSeconds * 1000,
  );
  const remainingFrom = (end: number) =>
    Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const [secondsLeft, setSecondsLeft] = useState(() => remainingFrom(endsAt));

  useEffect(() => {
    setSecondsLeft(remainingFrom(endsAt));
    const id = setInterval(() => {
      const left = remainingFrom(endsAt);
      setSecondsLeft(left);
      if (left === 0) {
        clearInterval(id);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const restart = useCallback((seconds: number) => {
    const nextSeconds = Math.max(0, Math.ceil(seconds));
    setSecondsLeft(nextSeconds);
    setEndsAt(Date.now() + nextSeconds * 1000);
  }, []);

  return {secondsLeft, restart};
}
