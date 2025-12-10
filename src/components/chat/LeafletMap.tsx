"use client";

import { useEffect, useState, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet icons in Next.js
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "/leaflet/marker-icon-2x.png",
    iconUrl: "/leaflet/marker-icon.png",
    shadowUrl: "/leaflet/marker-shadow.png",
  });
}

// Default center coordinates for Brazil
const BRAZIL_CENTER: [number, number] = [-15.7801, -47.9292];

type LeafletMapProps = {
  center?: [number, number];
  onLocationSelect: (lat: number, lng: number) => void;
  selectedLocation: { latitude: number; longitude: number } | null;
};

export default function LeafletMap({
  center,
  onLocationSelect,
  selectedLocation,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  // Try to get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
        },
        () => {
          // Silently fail - we'll use Brazil's center as fallback
        },
        {
          timeout: 5000,
          maximumAge: 60000,
        }
      );
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return; // Map already initialized

    // Determine initial center and zoom
    const initialCenter = center || 
      (selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] as [number, number] : null) ||
      userLocation || 
      BRAZIL_CENTER;

    const initialZoom = center || selectedLocation || userLocation ? 15 : 4;

    // Create map
    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      scrollWheelZoom: true,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Handle map clicks
    map.on("click", (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    });

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // Dependencies intentionally limited to prevent map re-initialization
    // Map is initialized once and then updated via other effects
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker when selectedLocation changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    // Add new marker if location is selected
    if (selectedLocation) {
      const position: [number, number] = [selectedLocation.latitude, selectedLocation.longitude];
      
      const marker = L.marker(position, {
        draggable: true,
      }).addTo(mapRef.current);

      // Handle marker drag
      marker.on("dragend", (e) => {
        const pos = e.target.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      });

      markerRef.current = marker;

      // Pan to new location
      mapRef.current.flyTo(position, mapRef.current.getZoom());
    }
  }, [selectedLocation, onLocationSelect]);

  // Update center when center prop changes
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.flyTo(center, 15);
  }, [center]);

  // Update center when user location is determined
  useEffect(() => {
    if (!mapRef.current || !userLocation || selectedLocation) return;
    mapRef.current.flyTo(userLocation, 15);
  }, [userLocation, selectedLocation]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
