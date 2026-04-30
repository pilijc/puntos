export type PostGISLocation = string | { type: 'Point', coordinates: [number, number] };

export interface Coordinates {
  latitude: number | null;
  longitude: number | null;
}

/**
 * Parses PostGIS geography/geometry data into frontend-friendly coordinates.
 * PostgREST typically returns either GeoJSON or a WKT string like 'POINT(lon lat)'.
 */
export function parsePostGISLocation(location: unknown): Coordinates {
  if (!location) {
    return { latitude: null, longitude: null };
  }
  
  // GeoJSON format
  if (typeof location === 'object' && (location as any).type === 'Point' && Array.isArray((location as any).coordinates)) {
    const coords = (location as any).coordinates;
    return {
      longitude: coords[0],
      latitude: coords[1]
    };
  }
  
  // WKT format
  if (typeof location === 'string') {
    const match = location.match(/POINT\s*\(\s*([-.\d]+)\s+([-.\d]+)\s*\)/i);
    if (match) {
      return {
        longitude: parseFloat(match[1]),
        latitude: parseFloat(match[2])
      };
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
