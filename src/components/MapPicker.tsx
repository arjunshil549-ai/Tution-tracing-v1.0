import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Search, Crosshair, ZoomIn, ZoomOut, Check, Info } from 'lucide-react';

// Fix default leaflet marker icons in Vite bundler
const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface MapPickerProps {
  initialLat: number;
  initialLng: number;
  radius: number;
  onLocationSelect: (lat: number, lng: number, address?: string) => void;
  onClose?: () => void;
}

const DHAKA_PRESETS = [
  { name: 'Farmgate', lat: 23.7563, lng: 90.3891, address: 'Farmgate, Tejgaon, Dhaka' },
  { name: 'Malibagh', lat: 23.7480, lng: 90.4100, address: 'Malibagh Chowdhury Para, Dhaka' },
  { name: 'Dhanmondi (Rd 7/A)', lat: 23.7461, lng: 90.3742, address: 'Road 7/A, Dhanmondi, Dhaka' },
  { name: 'Mirpur 10', lat: 23.8069, lng: 90.3687, address: 'Mirpur 10 Circle, Dhaka' },
  { name: 'Gulshan 2', lat: 23.7925, lng: 90.4150, address: 'Gulshan 2 Circle, Dhaka' },
  { name: 'Uttara (Sec 3)', lat: 23.8680, lng: 90.3980, address: 'Sector 3, Uttara, Dhaka' },
];

export const MapPicker: React.FC<MapPickerProps> = ({
  initialLat,
  initialLng,
  radius,
  onLocationSelect,
  onClose,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  const [currentLat, setCurrentLat] = useState<number>(initialLat || 23.7563);
  const [currentLng, setCurrentLng] = useState<number>(initialLng || 90.3891);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationName, setLocationName] = useState('Farmgate, Dhaka');
  const [isLocating, setIsLocating] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentLat, currentLng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Marker
      const marker = L.marker([currentLat, currentLng], {
        icon: markerIcon,
        draggable: true,
      }).addTo(map);

      // Geofence Circle
      const circle = L.circle([currentLat, currentLng], {
        radius: radius,
        color: '#10b981', // emerald-500
        fillColor: '#10b981',
        fillOpacity: 0.2,
        weight: 2,
        dashArray: '4, 6',
      }).addTo(map);

      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        setCurrentLat(Number(pos.lat.toFixed(6)));
        setCurrentLng(Number(pos.lng.toFixed(6)));
        circle.setLatLng(pos);
      });

      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        const roundedLat = Number(lat.toFixed(6));
        const roundedLng = Number(lng.toFixed(6));
        setCurrentLat(roundedLat);
        setCurrentLng(roundedLng);
        marker.setLatLng([roundedLat, roundedLng]);
        circle.setLatLng([roundedLat, roundedLng]);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      circleRef.current = circle;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
  }, [radius]);

  const updateCoordinates = (lat: number, lng: number, label?: string) => {
    setCurrentLat(lat);
    setCurrentLng(lng);
    if (label) setLocationName(label);
    if (mapInstanceRef.current && markerRef.current && circleRef.current) {
      mapInstanceRef.current.setView([lat, lng], 16);
      markerRef.current.setLatLng([lat, lng]);
      circleRef.current.setLatLng([lat, lng]);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        updateCoordinates(lat, lng, 'My Current Device Location');
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        // Fallback to Dhaka preset
        alert('Could not retrieve device location. You can pick anywhere on the map.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check presets first
    const matched = DHAKA_PRESETS.find((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      updateCoordinates(matched.lat, matched.lng, matched.address);
      return;
    }

    // Try Nominatim geocoding
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ' Dhaka')}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.length > 0) {
          const first = data[0];
          const lat = Number(parseFloat(first.lat).toFixed(6));
          const lng = Number(parseFloat(first.lon).toFixed(6));
          updateCoordinates(lat, lng, first.display_name.split(',')[0]);
        } else {
          alert('Location not found. Try tapping directly on the map or choosing a preset.');
        }
      })
      .catch(() => {
        alert('Location search failed. You can drag the pin directly on the map.');
      });
  };

  return (
    <div id="location-picker-modal" className="flex flex-col h-full w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm sm:text-base">Tuition Location & Geofence</h3>
              <p className="text-xs text-slate-400">Drag the pin or tap anywhere to set center point</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition"
            title="Use current GPS"
          >
            <Crosshair className={`w-3.5 h-3.5 text-emerald-400 ${isLocating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLocating ? 'Locating...' : 'GPS'}</span>
          </button>
        </div>

        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search address or area (e.g. Farmgate, Dhanmondi)..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-20 py-2 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition"
          >
            Search
          </button>
        </form>

        {/* Quick presets */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-500 text-[11px] whitespace-nowrap">Presets:</span>
          {DHAKA_PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => updateCoordinates(p.lat, p.lng, p.address)}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 border border-slate-700/60 whitespace-nowrap transition text-[11px]"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="relative flex-1 min-h-[300px] w-full bg-slate-950">
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />

        {/* Map overlay controls */}
        <div className="absolute top-3 right-3 z-10 flex flex-col space-y-1.5 bg-slate-900/90 backdrop-blur rounded-lg p-1 border border-slate-700/80 shadow-md">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded text-xs"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="p-1.5 hover:bg-slate-800 text-slate-300 rounded text-xs"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Geofence badge info */}
        <div className="absolute top-3 left-3 z-10 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/30 text-xs shadow-lg flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-200 font-medium">Geofence Radius: <span className="text-emerald-400 font-bold">{radius}m</span></span>
        </div>
      </div>

      {/* Footer Info & Confirm */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/95 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Coordinates:</span>
            <span className="font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400 text-[11px]">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span>Tolerance applied: ~30m GPS margin</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs sm:text-sm border border-slate-700 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => onLocationSelect(currentLat, currentLng, locationName)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-950 transition"
          >
            <Check className="w-4 h-4" />
            <span>CONFIRM LOCATION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
