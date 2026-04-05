// Uses free OpenStreetMap Nominatim API for geocoding
// No API key needed — just respect the usage policy (1 req/sec)

interface GeoResult {
  latitude: number;
  longitude: number;
}

export async function geocodeAddress(
  address: string,
  city: string,
  state: string,
  zip?: string | null
): Promise<GeoResult | null> {
  const query = [address, city, state, zip].filter(Boolean).join(', ');
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MAHA-FromTheFarm/1.0' },
    });
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

export async function geocodeZip(zip: string): Promise<GeoResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(zip)}&countrycodes=us&limit=1`;

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MAHA-FromTheFarm/1.0' },
    });
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
