import AsyncStorage from '@react-native-async-storage/async-storage';
import {freeMaps} from '../config/freeMaps';

const week = 7 * 24 * 60 * 60 * 1000;
const memory = new Map();
const pending = new Map();
const queue = [];
let active = 0;

export const tileUrl = tile =>
  freeMaps.tileUrl
    .replace('{z}', tile.z)
    .replace('{x}', tile.x)
    .replace('{y}', tile.y);

function networkSlot(operation) {
  return new Promise((resolve, reject) => {
    queue.push({operation, resolve, reject});
    pump();
  });
}

function pump() {
  while (active < 4 && queue.length) {
    const task = queue.shift();
    active++;
    task
      .operation()
      .then(task.resolve, task.reject)
      .finally(() => {
        active--;
        pump();
      });
  }
}

function blobToDataUri(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read this map tile.'));
    reader.readAsDataURL(blob);
  });
}

async function load(uri) {
  const storageKey = `amaraa-map-tile:${uri}`;
  let cached = memory.get(uri);
  if (!cached) {
    try {
      cached = JSON.parse(await AsyncStorage.getItem(storageKey));
    } catch {
      /* A cache miss never prevents a fresh tile request. */
    }
  }
  if (cached?.expiresAt > Date.now()) {
    memory.set(uri, cached);
    return cached.dataUri;
  }
  try {
    const record = await networkSlot(async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(uri, {
          headers: {'User-Agent': freeMaps.userAgent},
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(
            'Could not load the map. Check your connection and retry.',
          );
        }
        const dataUri = await blobToDataUri(await response.blob());
        const maxAge = response.headers
          ?.get('cache-control')
          ?.match(/max-age=(\d+)/i);
        return {
          dataUri,
          expiresAt: Date.now() + (maxAge ? Number(maxAge[1]) * 1000 : week),
        };
      } finally {
        clearTimeout(timeout);
      }
    });
    memory.set(uri, record);
    if (memory.size > 128) {
      memory.delete(memory.keys().next().value);
    }
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(record));
    } catch {
      /* Native image loading can continue when disk storage is full. */
    }
    return record.dataUri;
  } catch (error) {
    if (cached?.dataUri) {
      return cached.dataUri;
    }
    throw error;
  }
}

export function getMapTile(tile) {
  const uri = tileUrl(tile);
  if (!pending.has(uri)) {
    pending.set(
      uri,
      load(uri).finally(() => pending.delete(uri)),
    );
  }
  return pending.get(uri);
}
