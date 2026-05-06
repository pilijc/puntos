export type PostGISLocation = string | { type: 'Point', coordinates: [number, number] };

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
  isPostGIS?: boolean;
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

function parseHexPoint(hex: string): Coordinates | null {
  const normalized = hex.startsWith("\\x") ? hex.slice(2) : hex;
  if (!/^[0-9a-f]+$/i.test(normalized) || normalized.length < 42 || normalized.length % 2 !== 0) {
    return null;
  }

  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }

  const view = new DataView(bytes.buffer);
  const byteOrder = view.getUint8(0);
  if (byteOrder !== 0 && byteOrder !== 1) return null;

  const littleEndian = byteOrder === 1;
  const type = view.getUint32(1, littleEndian);
  const hasZ = (type & 0x80000000) !== 0;
  const hasM = (type & 0x40000000) !== 0;
  const hasSrid = (type & 0x20000000) !== 0;
  const geometryType = (type & 0x0fffffff) % 1000;
  if (geometryType !== 1) return null;

  let offset = 5;
  if (hasSrid) offset += 4;

  const coordinateByteLength = 16 + (hasZ ? 8 : 0) + (hasM ? 8 : 0);
  if (bytes.length < offset + coordinateByteLength) return null;

  const longitude = view.getFloat64(offset, littleEndian);
  const latitude = view.getFloat64(offset + 8, littleEndian);
  return validCoordinates(latitude, longitude);
}

/**
 * Parses PostGIS geography/geometry data into frontend-friendly coordinates.
 * PostgREST typically returns either GeoJSON or a WKT/EWKT string like
 * 'POINT(lon lat)' or 'SRID=4326;POINT(lon lat)'. Some Supabase/PostgREST
 * setups return EWKB hex strings for geography columns.
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
    const match = location.match(/POINT\s*\(\s*([-+]?\d*\.?\d+(?:e[-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:e[-+]?\d+)?)(?:\s+[-+]?\d*\.?\d+(?:e[-+]?\d+)?)?\s*\)/i);
    if (match) {
      return validCoordinates(match[2], match[1]) ?? { latitude: null, longitude: null };
    }

    const parsedHex = parseHexPoint(location);
    if (parsedHex) return parsedHex;
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

export function withPostGISCoordinates<T extends { location?: unknown }>(
  row: T
): T & Coordinates {
  const parsed = parsePostGISLocation(row.location);
  const locationCoords = validCoordinates(parsed.latitude, parsed.longitude);
  const coords = locationCoords ?? { latitude: null, longitude: null };

  return {
    ...row,
    latitude: coords.latitude,
    longitude: coords.longitude,
    isPostGIS: !!locationCoords,
  };
}
