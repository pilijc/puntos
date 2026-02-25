import { supabase } from "@/supabase/supabase";

export async function getStoresService() {
    try {
        const { data, error } = await supabase.from("stores").select("*");
        if (error) throw error;
        return data;
    } catch (error) {
        throw error;
    }
}

export async function getSearchResultsService(query: string) {
    try {
    const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
        )}.json?limit=5&country=ph&access_token=${process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}`
        );
        const data = await res.json();
        return data;
    } catch (error) {
        throw error;
    }
}