"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

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

type LocationMarkerProps = {
  position: [number, number] | null;
  onPositionChange: (lat: number, lng: number) => void;
};

function LocationMarker({ position, onPositionChange }: LocationMarkerProps) {
  const map = useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  // Pan to position when it changes
  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onPositionChange(pos.lat, pos.lng);
        },
      }}
    />
  ) : null;
}

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

  // Determine initial center and zoom
  const initialCenter = center || 
    (selectedLocation ? [selectedLocation.latitude, selectedLocation.longitude] as [number, number] : null) ||
    userLocation || 
    [-15.7801, -47.9292] as [number, number]; // Center of Brazil

  const initialZoom = center || selectedLocation || userLocation ? 15 : 4;

  const position = selectedLocation
    ? ([selectedLocation.latitude, selectedLocation.longitude] as [number, number])
    : null;

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker position={position} onPositionChange={onLocationSelect} />
    </MapContainer>
  );
}
