import { supabase } from "@/supabase/supabase";
import { STORE_SELECT } from "@/services/store-service";
import { withPostGISCoordinates } from "@/utils/location";
import type * as GeoJSON from "geojson";



export async function getStoresService() {
    try {
        const { data, error } = await supabase
            .from("stores")
            .select(STORE_SELECT)
            .eq("is_active", true)
            .eq("status", "approved");
        if (error) throw error;
        return (data ?? []).map((store) => withPostGISCoordinates(store));
    } catch (error) {
        throw error;
    }
}

export async function getSearchResultsService(query: string, language: string = 'en') {
    try {
        const res = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                query
            )}.json?limit=5&country=ph&language=${language}&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`
        );
        const data = await res.json();
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getRouteService( start: [number, number], end: [number, number]): Promise<GeoJSON.LineString | null> {
	try {
			const res = await fetch(
					`https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?geometries=geojson&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`
			);
			const json = await res.json();
			return json.routes?.[0]?.geometry ?? null;
	} catch (error) {
			throw error;
	}
}
