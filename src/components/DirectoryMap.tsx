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
  html: `<div style="background:#b45309;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

const farmIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background:#2d6a4f;color:white;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 9.25 3.75 6.5 6.75 6M18 9.25l2.25-2.75-3 .5M8.25 8.5h7.5A3.75 3.75 0 0 1 19.5 12.25V14a4.5 4.5 0 0 1-4.5 4.5h-6A4.5 4.5 0 0 1 4.5 14v-1.75A3.75 3.75 0 0 1 8.25 8.5Z" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="9.25" cy="12.25" r="0.85" fill="white"/>
      <circle cx="14.75" cy="12.25" r="0.85" fill="white"/>
      <path d="M10 15.25c.5.42 1.16.65 2 .65s1.5-.23 2-.65" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -20],
});

export default function DirectoryMap({ pins, center, zoom }: DirectoryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapActive, setMapActive] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    const map = L.map(mapRef.current, {
      scrollWheelZoom: !isMobile,
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
          <div style="display:inline-block;background:${pin.type === 'restaurant' ? '#b45309' : '#2d6a4f'};color:white;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:500;">
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
      <div ref={mapRef} className="w-full h-[350px] md:h-[500px] rounded-xl border border-stone-200 z-0" />
      {/* Mobile gesture overlay — tap to activate map, prevents scroll trap */}
      {!mapActive && (
        <div
          className="absolute inset-0 z-[1000] flex items-center justify-center rounded-xl md:hidden"
          style={{ background: 'rgba(0,0,0,0.15)' }}
          onTouchStart={(e) => { e.preventDefault(); setMapActive(true); }}
          onClick={() => setMapActive(true)}
        >
          <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-medium text-stone-700 shadow">
            Tap to interact with map
          </div>
        </div>
      )}
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border border-stone-200 px-4 py-3 z-[1000]">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-amber-700 border border-white shadow"></div>
            <span className="text-stone-600">Restaurant</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-[#2d6a4f] border border-white shadow"></div>
            <span className="text-stone-600">Farm</span>
          </div>
        </div>
      </div>
    </div>
  );
}
