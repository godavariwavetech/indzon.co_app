/* eslint-env jest */
import {startForegroundPolling} from '../services/foregroundPolling';

let stateChanged;
let remove;
let appState;
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
beforeEach(() => {
  jest.useFakeTimers();
  remove = jest.fn();
  appState = {currentState: 'active', addEventListener: jest.fn((_, handler) => {
    stateChanged = handler;
    return {remove};
  })};
});
afterEach(() => jest.useRealTimers());

test('tracking refreshes while staying on the same screen and stops after leaving', async () => {
  const load = jest.fn().mockResolvedValueOnce('Placed').mockResolvedValueOnce('Packed');
  const onSuccess = jest.fn();
  const stop = startForegroundPolling({load, onSuccess, appState, intervalMs: 5000});
  await flush();
  expect(onSuccess).toHaveBeenLastCalledWith('Placed');
  await jest.advanceTimersByTimeAsync(5000);
  expect(onSuccess).toHaveBeenLastCalledWith('Packed');
  stop();
  await jest.advanceTimersByTimeAsync(15000);
  expect(load).toHaveBeenCalledTimes(2);
  expect(remove).toHaveBeenCalledTimes(1);
});

test('background pauses requests and returning to the app refreshes immediately', async () => {
  const load = jest.fn().mockResolvedValue('Confirmed');
  const stop = startForegroundPolling({load, onSuccess: jest.fn(), appState, intervalMs: 5000});
  await flush();
  stateChanged('background');
  await jest.advanceTimersByTimeAsync(20000);
  expect(load).toHaveBeenCalledTimes(1);
  stateChanged('active');
  await flush();
  expect(load).toHaveBeenCalledTimes(2);
  stop();
});

test('slow requests do not overlap and late results after cleanup are ignored', async () => {
  let finish;
  const load = jest.fn(() => new Promise(resolve => { finish = resolve; }));
  const onSuccess = jest.fn();
  const stop = startForegroundPolling({load, onSuccess, appState, intervalMs: 5000});
  await jest.advanceTimersByTimeAsync(15000);
  expect(load).toHaveBeenCalledTimes(1);
  stop();
  finish('Delivered');
  await flush();
  expect(onSuccess).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);
});

test('a temporary API error preserves the previous status and retries', async () => {
  const load = jest.fn().mockResolvedValueOnce('Packed')
    .mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce('Out for delivery');
  const onSuccess = jest.fn();
  const stop = startForegroundPolling({load, onSuccess, appState, intervalMs: 5000});
  await flush();
  await jest.advanceTimersByTimeAsync(5000);
  expect(onSuccess).toHaveBeenLastCalledWith('Packed');
  await jest.advanceTimersByTimeAsync(5000);
  expect(onSuccess).toHaveBeenLastCalledWith('Out for delivery');
  stop();
});
