import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {freeMaps} from '../config/freeMaps';
import {isValidPhoneNumber} from '../utils/phone';
import {STATIC_APP_FLOW} from '../config/appMode';

export function validCoordinates(coordinates) {
  return (
    Number.isFinite(coordinates?.latitude) &&
    Number.isFinite(coordinates?.longitude) &&
    Math.abs(coordinates.latitude) <= 90 &&
    Math.abs(coordinates.longitude) <= 180
  );
}

async function getCurrentLocation() {
  const permission =
    Platform.OS === 'ios'
      ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE
      : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  let status = await check(permission);
  if (status === RESULTS.DENIED) {
    status = await request(permission);
  }
  if (![RESULTS.GRANTED, RESULTS.LIMITED].includes(status)) {
    throw new Error(
      'Allow location access in Settings, or enter your delivery location manually.',
    );
  }
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        if (validCoordinates(coordinates)) {
          resolve(coordinates);
        } else {
          reject(
            new Error('Could not determine your location. Please try again.'),
          );
        }
      },
      () =>
        reject(
          new Error(
            'Turn on device location and try again, or enter your delivery location manually.',
          ),
        ),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
        showLocationDialog: true,
      },
    );
  });
}

const lookupCache = new Map();
let lookupQueue = Promise.resolve();
let lastRequestAt = 0;

async function photonRequest(path, parameters, signal) {
  const query = Object.entries({...parameters, lang: 'en'})
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');
  const url = `${freeMaps.geocoderUrl}/${path}/?${query}`;
  const cached = lookupCache.get(url);
  if (cached?.expiresAt > Date.now()) {
    return cached.body;
  }
  const operation = async () => {
    if (signal?.aborted) {
      throw new Error('Location lookup cancelled.');
    }
    const delay = Math.max(0, lastRequestAt + 1000 - Date.now());
    if (delay) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    if (signal?.aborted) {
      throw new Error('Location lookup cancelled.');
    }
    lastRequestAt = Date.now();
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    const timeout = setTimeout(abort, 12000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {'User-Agent': freeMaps.userAgent, Accept: 'application/json'},
      });
      if (!response.ok) {
        throw new Error(
          response.status === 429
            ? 'Location search is busy. Please try again in a moment.'
            : 'Could not load this location. Check your connection and try again.',
        );
      }
      const body = await response.json();
      if (!Array.isArray(body.features)) {
        throw new Error('Could not load this location. Please try again.');
      }
      lookupCache.set(url, {body, expiresAt: Date.now() + 24 * 60 * 60 * 1000});
      if (lookupCache.size > 80) {
        lookupCache.delete(lookupCache.keys().next().value);
      }
      return body;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  };
  const result = lookupQueue.then(operation, operation);
  lookupQueue = result.catch(() => {});
  return result;
}

export function parsePlace(feature) {
  const properties = feature.properties || {};
  const [longitude, latitude] = feature.geometry?.coordinates || [];
  const street = [properties.housenumber, properties.street]
    .filter(Boolean)
    .join(' ');
  const district =
    properties.district || properties.locality || properties.suburb;
  const city =
    properties.city ||
    properties.town ||
    properties.village ||
    properties.county ||
    '';
  const parts = [
    properties.name,
    street,
    district,
    city,
    properties.state,
    properties.postcode,
    properties.country,
  ].filter(Boolean);
  const unique = parts.filter(
    (value, index) =>
      parts.findIndex(part => part.toLowerCase() === value.toLowerCase()) ===
      index,
  );
  return {
    latitude,
    longitude,
    area: district || properties.name || street || city || 'Selected location',
    fullAddress: unique.join(', '),
    city,
    state: properties.state || '',
    pincode: properties.postcode || '',
  };
}

async function reverseGeocode(coordinates, signal) {
  if (!validCoordinates(coordinates)) {
    throw new Error('Choose a valid location on the map.');
  }
  const body = await photonRequest(
    'reverse',
    {
      lat: coordinates.latitude.toFixed(5),
      lon: coordinates.longitude.toFixed(5),
      limit: 1,
    },
    signal,
  );
  const selected = body.features
    .map(parsePlace)
    .find(place => validCoordinates(place) && place.fullAddress);
  if (!selected) {
    throw new Error(
      'No address found here. Move the pin to a nearby street or search for an area.',
    );
  }
  return {
    ...selected,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
  };
}

async function searchPlaces(query, coordinates, signal) {
  if (query.trim().length < 3) {
    return [];
  }
  const parameters = {q: query.trim(), limit: 5, countrycode: 'IN'};
  if (validCoordinates(coordinates)) {
    parameters.lat = coordinates.latitude.toFixed(3);
    parameters.lon = coordinates.longitude.toFixed(3);
  }
  const body = await photonRequest('api', parameters, signal);
  return body.features
    .map(feature => {
      const place = parsePlace(feature);
      return {
        place_id: `${feature.properties?.osm_type || 'place'}-${
          feature.properties?.osm_id || ''
        }-${place.latitude}-${place.longitude}`,
        description: place.fullAddress,
        place,
      };
    })
    .filter(
      result => validCoordinates(result.place) && result.place.fullAddress,
    );
}

async function getPlace(prediction) {
  const place = prediction?.place;
  if (!validCoordinates(place) || !place.fullAddress) {
    throw new Error('Please select a location from the search results.');
  }
  return place;
}

export function validateAddress(fields, place) {
  if (!validCoordinates(place) || !place.fullAddress) {
    return 'Select your delivery location on the map first.';
  }
  if (!fields.name.trim()) {
    return 'Enter your name.';
  }
  if (!isValidPhoneNumber(fields.contact)) {
    return 'Enter a valid 10-digit contact number.';
  }
  if (!fields.doorNo.trim()) {
    return 'Enter your door, flat or building number.';
  }
  if (!/^[1-9]\d{5}$/.test(fields.pincode)) {
    return 'Enter a valid 6-digit pin number.';
  }
  if (fields.type === 'Others' && !fields.customType.trim()) {
    return 'Enter a label for this address.';
  }
  return '';
}

const addressQueues = new Map();
const addressKey = customerId =>
  `amaraa-${STATIC_APP_FLOW ? 'static' : 'local'}-addresses:${
    customerId ?? 'guest'
  }`;

async function getSavedAddresses(customerId) {
  const value = await AsyncStorage.getItem(addressKey(customerId));
  if (!value) {
    return [];
  }
  try {
    const records = JSON.parse(value);
    if (!Array.isArray(records)) {
      throw new Error('Invalid addresses');
    }
    return records;
  } catch {
    throw new Error('Could not read your saved addresses. Please try again.');
  }
}

function updateAddresses(customerId, operation) {
  const key = addressKey(customerId);
  const previous = addressQueues.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      const records = await getSavedAddresses(customerId);
      const result = operation(records);
      await AsyncStorage.setItem(key, JSON.stringify(result));
      return result;
    });
  addressQueues.set(key, next);
  next.then(
    () => {
      if (addressQueues.get(key) === next) {
        addressQueues.delete(key);
      }
    },
    () => {
      if (addressQueues.get(key) === next) {
        addressQueues.delete(key);
      }
    },
  );
  return next;
}

async function saveAddress(customerId, fields, place, addressId) {
  const error = validateAddress(fields, place);
  if (error) {
    throw new Error(error);
  }
  const address = {
    id: String(addressId || '').startsWith('local-')
      ? addressId
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storage: 'local',
    customer_id: customerId ?? null,
    address_type:
      fields.type === 'Others' ? fields.customType.trim() : fields.type,
    door_no: fields.doorNo.trim(),
    street_address: place.fullAddress,
    full_address: fields.doorNo.trim().endsWith(place.fullAddress)
      ? fields.doorNo.trim()
      : [fields.doorNo.trim(), place.fullAddress].join(', '),
    customer_latitude: String(place.latitude),
    customer_longitude: String(place.longitude),
    location_id: null,
    location_name: place.area,
    customer_name: fields.name.trim(),
    customer_mobile_number: fields.contact,
    pincode: fields.pincode,
    landmark: fields.landmark.trim(),
    city: place.city,
    state: place.state,
  };
  await updateAddresses(customerId, records => [
    address,
    ...records.filter(record => record.id !== address.id),
  ]);
  return address;
}

async function deleteSavedAddress(customerId, addressId) {
  await updateAddresses(customerId, records =>
    records.filter(record => record.id !== addressId),
  );
}

export default {
  getCurrentLocation,
  reverseGeocode,
  searchPlaces,
  getPlace,
  saveAddress,
  getSavedAddresses,
  deleteSavedAddress,
};
