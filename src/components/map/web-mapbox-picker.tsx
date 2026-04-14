import React, { useEffect, useMemo, useRef } from "react";
import { Platform } from "react-native";

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (next: { latitude: number; longitude: number }) => void;
  height?: number;
  isDark?: boolean;
  markerColor?: string;
<<<<<<< Updated upstream
};

export function WebMapboxPicker({ latitude, longitude, onChange, height = 280, isDark, markerColor }: Props) {
=======
  radiusMeters?: number | null;
};

export function WebMapboxPicker({
  latitude,
  longitude,
  onChange,
  height = 280,
  isDark,
  markerColor,
  radiusMeters,
}: Props) {
>>>>>>> Stashed changes
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const token = process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN;
  const hasCoords = Number.isFinite(latitude ?? NaN) && Number.isFinite(longitude ?? NaN);
  const center = useMemo<[number, number]>(() => {
    if (hasCoords) return [Number(longitude), Number(latitude)];
    return [123.8854, 10.3157];
  }, [hasCoords, latitude, longitude]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    if (!containerRef.current) return;
    if (!token) return;

    require("mapbox-gl/dist/mapbox-gl.css");
    const mapboxgl = require("mapbox-gl");
    mapboxgl.accessToken = token;

    const styleUrl = isDark ? "mapbox://styles/mapbox/navigation-night-v1" : "mapbox://styles/mapbox/streets-v12";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: styleUrl,
      center,
      zoom: hasCoords ? 14 : 12,
    });

    mapRef.current = map;

    const marker = new mapboxgl.Marker({ draggable: true, color: markerColor ?? "#FF6600" })
      .setLngLat(center)
      .addTo(map);

    markerRef.current = marker;

    const emit = (lngLat: { lng: number; lat: number }) => {
      onChange({ latitude: lngLat.lat, longitude: lngLat.lng });
    };

    marker.on("dragend", () => emit(marker.getLngLat()));
    map.on("click", (e: any) => {
      marker.setLngLat(e.lngLat);
      emit(e.lngLat);
    });

    return () => {
      try {
        marker.remove();
      } catch {}
      try {
        map.remove();
      } catch {}
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    if (!hasCoords) return;
    const next: [number, number] = [Number(longitude), Number(latitude)];
    marker.setLngLat(next);
    map.easeTo({ center: next, duration: 250 });
  }, [hasCoords, latitude, longitude]);

<<<<<<< Updated upstream
=======
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const map = mapRef.current;
    if (!map) return;

    const fillColor = markerColor ?? "#FF6600";

    const updateRadiusCircle = () => {
      if (!map.isStyleLoaded()) return;

      const r = radiusMeters != null ? Number(radiusMeters) : NaN;
      const show =
        hasCoords &&
        Number.isFinite(r) &&
        r > 0 &&
        Number.isFinite(Number(latitude)) &&
        Number.isFinite(Number(longitude));

      const removeCircle = () => {
        if (map.getLayer("puntos-radius-fill")) map.removeLayer("puntos-radius-fill");
        if (map.getSource("puntos-radius")) map.removeSource("puntos-radius");
      };

      if (!show) {
        removeCircle();
        return;
      }

      const turf = require("@turf/turf");
      const lng = Number(longitude);
      const lat = Number(latitude);
      const km = r / 1000;
      const circle = turf.circle([lng, lat], km, { steps: 64, units: "kilometers" });

      const existing = map.getSource("puntos-radius") as { setData?: (d: unknown) => void } | undefined;
      if (existing?.setData) {
        existing.setData(circle);
        return;
      }

      removeCircle();
      map.addSource("puntos-radius", { type: "geojson", data: circle });
      map.addLayer({
        id: "puntos-radius-fill",
        type: "fill",
        source: "puntos-radius",
        paint: {
          "fill-color": fillColor,
          "fill-opacity": 0.14,
        },
      });
    };

    if (map.isStyleLoaded()) {
      updateRadiusCircle();
    } else {
      map.once("load", updateRadiusCircle);
    }
  }, [hasCoords, latitude, longitude, radiusMeters, markerColor]);

>>>>>>> Stashed changes
  if (Platform.OS !== "web") return null;

  if (!token) {
    return (
      <div
        style={{
          height,
          width: "100%",
          borderRadius: 12,
          border: "1px solid rgba(148,163,184,0.35)",
          background: "rgba(241,245,249,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 12,
          fontSize: 12,
          color: "#64748B",
          textAlign: "center",
        }}
      >
        Missing `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.
      </div>
    );
  }

  return <div ref={containerRef} style={{ height, width: "100%", borderRadius: 12, overflow: "hidden" }} />;
}

