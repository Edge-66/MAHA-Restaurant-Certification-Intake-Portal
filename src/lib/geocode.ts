// Uses free OpenStreetMap Nominatim API for geocoding
// No API key needed — just respect the usage policy (1 req/sec)

interface GeoResult {
  latitude: number;
  longitude: number;
}

async function queryNominatim(query: string): Promise<GeoResult | null> {
  const email = process.env.GEOCODER_CONTACT_EMAIL;
  const contactSuffix = email ? ` (${email})` : '';
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1${
    email ? `&email=${encodeURIComponent(email)}` : ''
  }`;

  const res = await fetch(url, {
    headers: { 'User-Agent': `MAHA-FromTheFarm/1.0${contactSuffix}` },
  });
  if (!res.ok) return null;

  const data = await res.json();
  if (data && data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
    };
  }
  return null;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string | null
): Promise<GeoResult | null> {
  const trimmedAddress = address.trim();
  const trimmedCity = city.trim();
  const trimmedState = state.trim();
  const trimmedZip = zip?.trim() || '';

  const queries = [
    [trimmedAddress, trimmedCity, trimmedState, trimmedZip].filter(Boolean).join(', '),
    [trimmedAddress, trimmedCity, trimmedState].filter(Boolean).join(', '),
    [trimmedCity, trimmedState, trimmedZip].filter(Boolean).join(', '),
    [trimmedCity, trimmedState].filter(Boolean).join(', '),
  ].filter(Boolean);

  try {
    for (const q of queries) {
      const geo = await queryNominatim(q);
      if (geo) return geo;
    }
    return null;
  } catch {
    return null;
  }
}

export async function geocodeZip(zip: string): Promise<GeoResult | null> {
  const email = process.env.GEOCODER_CONTACT_EMAIL;
  const contactSuffix = email ? ` (${email})` : '';
  const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(zip)}&countrycodes=us&limit=1${
    email ? `&email=${encodeURIComponent(email)}` : ''
  }`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': `MAHA-FromTheFarm/1.0${contactSuffix}` },
    });
    if (!res.ok) return null;
    const data = await res.json();

    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Haversine distance in miles
export function distanceMiles(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
