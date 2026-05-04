export type PostGISLocation = string | { type: 'Point', coordinates: [number, number] };

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function validCoordinates(latitude: unknown, longitude: unknown): Coordinates | null {
  const lat = toFiniteNumber(latitude);
  const lon = toFiniteNumber(longitude);

  if (lat == null || lon == null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { latitude: lat, longitude: lon };
}

/**
 * Parses PostGIS geography/geometry data into frontend-friendly coordinates.
 * PostgREST typically returns either GeoJSON or a WKT/EWKT string like
 * 'POINT(lon lat)' or 'SRID=4326;POINT(lon lat)'.
 */
export function parsePostGISLocation(location: unknown): Coordinates {
  if (!location) {
    return { latitude: null, longitude: null };
  }
  
  // GeoJSON format
  if (typeof location === 'object' && (location as any).type === 'Point' && Array.isArray((location as any).coordinates)) {
    const coords = (location as any).coordinates;
    return validCoordinates(coords[1], coords[0]) ?? { latitude: null, longitude: null };
  }
  
  // WKT/EWKT format
  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s*\)/i);
    if (match) {
      return validCoordinates(match[2], match[1]) ?? { latitude: null, longitude: null };
    }
  }

  return { latitude: null, longitude: null };
}

/**
 * Formats coordinates into a PostGIS-compatible WKT string.
 * Note: PostGIS expects longitude first, then latitude: POINT(lon lat)
 */
export function formatPostGISLocation(latitude: number, longitude: number): string {
  return `POINT(${longitude} ${latitude})`;
}

export function toMapboxCoordinates(coords: Coordinates): [number, number] | null {
  const valid = validCoordinates(coords.latitude, coords.longitude);
  return valid ? [valid.longitude!, valid.latitude!] : null;
}

export function withPostGISCoordinates<T extends { location?: unknown; latitude?: unknown; longitude?: unknown }>(
  row: T
): T & Coordinates {
  const parsed = parsePostGISLocation(row.location);
  const locationCoords = validCoordinates(parsed.latitude, parsed.longitude);
  const fallbackCoords = validCoordinates(row.latitude, row.longitude);
  const coords = locationCoords ?? fallbackCoords ?? { latitude: null, longitude: null };

  return {
    ...row,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };
}
