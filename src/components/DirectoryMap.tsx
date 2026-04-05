'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPin {
  id: string;
  name: string;
  type: 'restaurant' | 'farm';
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  description?: string | null;
  onClick?: () => void;
  href?: string;
}

interface DirectoryMapProps {
  pins: MapPin[];
  center?: [number, number];
  zoom?: number;
}

// Custom marker icons
const restaurantIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:#2d6a4f;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">R</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const farmIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:#b45309;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">F</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

export default function DirectoryMap({ pins, center, zoom }: DirectoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: true,
      zoomControl: true,
    }).setView(center || [39.8283, -98.5795], zoom || 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    markersRef.current = L.layerGroup().addTo(map);
    mapInstance.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current = null;
      setMapReady(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update markers when pins change
  useEffect(() => {
    if (!mapReady || !markersRef.current || !mapInstance.current) return;

    markersRef.current.clearLayers();

    const validPins = pins.filter((p) => p.latitude && p.longitude);

    validPins.forEach((pin) => {
      const icon = pin.type === 'restaurant' ? restaurantIcon : farmIcon;
      const marker = L.marker([pin.latitude, pin.longitude], { icon });

      const popupContent = `
        <div style="min-width:180px">
          <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${pin.name}</div>
          <div style="color:#78716c;font-size:12px;margin-bottom:6px;">${pin.city}, ${pin.state}</div>
          <div style="display:inline-block;background:${pin.type === 'restaurant' ? '#2d6a4f' : '#b45309'};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;">
            ${pin.type === 'restaurant' ? 'Restaurant' : 'Farm'}
          </div>
          ${pin.href ? `<div style="margin-top:8px;"><a href="${pin.href}" style="color:#2d6a4f;font-size:12px;font-weight:500;text-decoration:underline;">View Profile →</a></div>` : ''}
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current!.addLayer(marker);
    });

    // Fit bounds if we have pins
    if (validPins.length > 0) {
      const bounds = L.latLngBounds(validPins.map((p) => [p.latitude, p.longitude]));
      mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [pins, mapReady]);

  // Update center/zoom when changed (zip search)
  useEffect(() => {
    if (!mapInstance.current || !center) return;
    mapInstance.current.setView(center, zoom || 10, { animate: true });
  }, [center, zoom]);

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[500px] rounded-xl border border-stone-200 z-0" />
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-stone-200 px-4 py-3 z-[1000]">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#2d6a4f] border border-white shadow"></div>
            <span className="text-stone-600">Restaurant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-700 border border-white shadow"></div>
            <span className="text-stone-600">Farm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
