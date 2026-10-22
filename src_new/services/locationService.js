import {Platform} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from 'react-native-geolocation-service';
import {check, request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {freeMaps} from '../config/freeMaps';
import {isValidPhoneNumber} from '../utils/phone';
import {STATIC_APP_FLOW, ENABLE_LIVE_DATA} from '../config/appMode';
import api from '../utils/api';
import {endpoints} from '../config/config';

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
// A slow autocomplete request must not block the selected map address.
const lookupLanes = {
  api: {queue: Promise.resolve(), lastRequestAt: 0},
  reverse: {queue: Promise.resolve(), lastRequestAt: 0},
};
let requestStartQueue = Promise.resolve();
let lastProviderRequestAt = 0;

function lookupCancelled() {
  const error = new Error('Location lookup cancelled.');
  error.name = 'AbortError';
  return error;
}

function waitForLookup(delay, signal) {
  if (signal?.aborted) return Promise.reject(lookupCancelled());
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', cancel);
      reject(lookupCancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, delay);
    signal?.addEventListener('abort', cancel);
  });
}

async function photonRequest(path, parameters, signal) {
  if (signal?.aborted) throw lookupCancelled();
  const lane = lookupLanes[path];
  const query = Object.entries({...parameters, lang: 'en'})
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
    )
    .join('&');
  const url = `${freeMaps.geocoderUrl}/${path}/?${query}`;
  const searchUrl = `${freeMaps.searchGeocoderUrl}?format=jsonv2&addressdetails=1&accept-language=en&countrycodes=in&limit=5&q=${encodeURIComponent(parameters.q || '')}`;
  const reverseUrl = `${freeMaps.reverseGeocoderUrl}?format=jsonv2&addressdetails=1&accept-language=en&lat=${parameters.lat}&lon=${parameters.lon}`;
  const cached = lookupCache.get(url);
  if (cached?.expiresAt > Date.now()) {
    return cached.body;
  }
  const operation = async (attempt = 0) => {
    if (signal?.aborted) {
      throw lookupCancelled();
    }
    // Share the provider's rate limit without waiting for other responses.
    const start = requestStartQueue.then(async () => {
      if (signal?.aborted) throw lookupCancelled();
      const delay = Math.max(0, lastProviderRequestAt + 1000 - Date.now());
      if (delay) await waitForLookup(delay, signal);
      if (signal?.aborted) throw lookupCancelled();
      lastProviderRequestAt = Date.now();
    });
    requestStartQueue = start.catch(() => {});
    await start;
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort);
    let timedOut = false;
    const timeout = setTimeout(() => {
      timedOut = true;
      abort();
    }, 10000);
    try {
      const useAddressProvider = attempt === 0;
      const response = await fetch(useAddressProvider ? (path === 'reverse' ? reverseUrl : searchUrl) : url, {
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
      const result = await response.json();
      const rows = path === 'reverse' ? [result] : result;
      const body = useAddressProvider
        ? {features: (Array.isArray(rows) ? rows : []).filter(row => row.display_name).map(row => {
            const address = row.address || {};
            return {
              geometry: {coordinates: [Number(row.lon), Number(row.lat)]},
              properties: {
                osm_type: row.osm_type,
                osm_id: row.osm_id || row.place_id,
                name: row.name,
                housenumber: address.house_number,
                street: address.road,
                district: address.suburb || address.neighbourhood || address.hamlet,
                city: address.city || address.town || address.village || address.municipality,
                county: address.county,
                state: address.state,
                postcode: address.postcode,
                country: address.country,
                display_name: row.display_name,
              },
            };
          })}
        : result;
      if (!Array.isArray(body.features)) {
        throw new Error('Could not load this location. Please try again.');
      }
      if (signal?.aborted) throw lookupCancelled();
      lookupCache.set(url, {body, expiresAt: Date.now() + 24 * 60 * 60 * 1000});
      if (lookupCache.size > 80) {
        lookupCache.delete(lookupCache.keys().next().value);
      }
      return body;
    } catch (error) {
      if (signal?.aborted) throw lookupCancelled();
      const temporaryFailure = timedOut || error.name === 'AbortError' || error instanceof TypeError;
      if (path === 'reverse' && attempt === 0) {
        clearTimeout(timeout);
        signal?.removeEventListener('abort', abort);
        return operation(1);
      }
      if (temporaryFailure) {
        throw new Error(
          'Address lookup could not connect. Check your internet connection and retry, or search for your area.',
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  };
  const result = lane.queue.then(() => operation(), () => operation());
  lane.queue = result.catch(() => {});
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
    fullAddress: properties.display_name || unique.join(', '),
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
  const parameters = {q: query.trim().replace(/\s+/g, ' ').toLowerCase(), limit: 5, countrycode: 'IN'};
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

// Real logins have a numeric backend customer_id; the static preview flow
// never has one, so local AsyncStorage stays the fallback either way.
function isLiveCustomer(customerId) {
  return ENABLE_LIVE_DATA && Number.isFinite(Number(customerId));
}

async function getSavedAddresses(customerId) {
  if (isLiveCustomer(customerId)) {
    const response = await api.post(endpoints.GET_ADDRESS_LIST, {
      customer_id: customerId,
    });
    const rows = response.data?.data;
    return Array.isArray(rows) ? rows : [];
  }
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
  const addressType =
    fields.type === 'Others' ? fields.customType.trim() : fields.type;
  const fullAddress = fields.doorNo.trim().endsWith(place.fullAddress)
    ? fields.doorNo.trim()
    : [fields.doorNo.trim(), place.fullAddress].join(', ');

  if (isLiveCustomer(customerId)) {
    const isBackendId = addressId && Number.isFinite(Number(addressId));
    const payload = {
      ...(isBackendId ? {id: addressId} : {}),
      customer_id: customerId,
      address_type: addressType,
      full_address: fullAddress,
      customer_latitude: String(place.latitude),
      customer_longitude: String(place.longitude),
      location_id: null,
      customer_name: fields.name.trim(),
      customer_mobile_number: fields.contact,
      pincode: fields.pincode,
      landmark: fields.landmark.trim(),
      city: place.city,
      state: place.state,
    };
    const response = await api.post(endpoints.SET_ADDRESS_LIST, payload);
    // post_customer_delivery_address runs INSERT/UPDATE then a nearest-location
    // lookup in one call: data = [writeResult, [{location_id, location_name}]].
    const [writeResult, locationMatches] = Array.isArray(response.data?.data)
      ? response.data.data
      : [];
    const resolvedId = isBackendId ? addressId : writeResult?.insertId ?? addressId;
    const match = Array.isArray(locationMatches) ? locationMatches[0] : null;
    return {
      ...payload,
      id: resolvedId,
      location_id: match?.location_id ?? null,
      location_name: match?.location_name ?? place.area,
    };
  }

  const address = {
    id: String(addressId || '').startsWith('local-')
      ? addressId
      : `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    storage: 'local',
    customer_id: customerId ?? null,
    address_type: addressType,
    door_no: fields.doorNo.trim(),
    street_address: place.fullAddress,
    full_address: fullAddress,
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
  if (isLiveCustomer(customerId) && !String(addressId).startsWith('local-')) {
    await api.post(endpoints.DELETE_ADDRESS_LIST, {
      id: addressId,
      customer_id: customerId,
    });
    return;
  }
  await updateAddresses(customerId, records =>
    records.filter(record => record.id !== addressId),
  );
}


const toRad = degrees => (degrees * Math.PI) / 180;
export function distanceKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.min(1, Math.sqrt(h)));
}

// The serviceable area (if any) that covers these coordinates.
async function findServiceArea(coordinates) {
  const response = await api.post(endpoints.CHECK_ADDRESS_EXISTENCE, {
    location_latitude: coordinates.latitude,
    location_longitude: coordinates.longitude,
  });
  const match = response.data?.data?.available_locations?.[0];
  return match
    ? {id: Number(match.id), name: match.location_name}
    : null;
}

// Every area we deliver to, for the "pick your area" list.
async function getServiceAreas() {
  const response = await api.get(endpoints.GET_SERVICES_LIST);
  const rows = Array.isArray(response.data?.data) ? response.data.data : [];
  return rows
    .map(row => ({
      id: Number(row.id),
      name: row.location_name,
      latitude: Number(row.location_latitude),
      longitude: Number(row.location_longitude),
    }))
    .filter(area => area.name && validCoordinates(area));
}

// An address shaped like the saved ones, for a place that is not in the address book
// (current location or a chosen service area). Never written to the server.
function makeDerivedAddress({id, type, fullAddress, coordinates, area, customer}) {
  return {
    id,
    storage: 'derived',
    customer_id: customer.customerId ?? null,
    address_type: type,
    full_address: fullAddress,
    customer_latitude: String(coordinates.latitude),
    customer_longitude: String(coordinates.longitude),
    location_id: area.id,
    location_name: area.name,
    customer_name: customer.name || '',
    customer_mobile_number: customer.mobileNumber || '',
  };
}

// Picks the delivery address after login: a saved address inside the serviceable area
// (closest to the user) when there is one, otherwise an address built from the coordinates.
async function pickAddressForArea({customer, coordinates, area, label}) {
  let saved = [];
  try {
    saved = await getSavedAddresses(customer.customerId);
  } catch {
    saved = [];
  }
  const inArea = saved
    .filter(record => Number(record.location_id) === area.id)
    .map(record => ({
      record,
      distance: distanceKm(coordinates, {
        latitude: Number(record.customer_latitude),
        longitude: Number(record.customer_longitude),
      }),
    }))
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));
  if (inArea.length) {
    return {address: inArea[0].record, source: 'saved'};
  }
  let fullAddress = label || area.name;
  if (!label) {
    try {
      fullAddress = (await reverseGeocode(coordinates)).fullAddress;
    } catch {
      fullAddress = area.name;
    }
  }
  return {
    address: makeDerivedAddress({
      id: label ? `area-${area.id}` : 'current-location',
      type: label ? 'Area' : 'Current location',
      fullAddress,
      coordinates,
      area,
      customer,
    }),
    source: label ? 'area' : 'current',
  };
}

export default {
  clearSavedAddresses: customerId => updateAddresses(customerId, () => []),
  getCurrentLocation,
  reverseGeocode,
  searchPlaces,
  getPlace,
  saveAddress,
  getSavedAddresses,
  deleteSavedAddress,
  findServiceArea,
  getServiceAreas,
  pickAddressForArea,
};
