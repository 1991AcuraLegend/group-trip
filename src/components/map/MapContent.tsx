'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import type { MappableEntry } from '@/types';
import { useEntryColors } from '@/hooks/useEntryColors';

function createColoredIcon(color: string, isSelected: boolean = false) {
  const size = isSelected ? 32 : 24;
  const height = isSelected ? 48 : 36;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="${size}" height="${height}">
    ${isSelected ? '<filter id="glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' : ''}
    <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24C24 5.4 18.6 0 12 0z" fill="${color}" ${isSelected ? 'filter="url(#glow)" opacity="1"' : ''} stroke="${isSelected ? 'white' : 'none'}" stroke-width="${isSelected ? '2' : '0'}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`;
  return L.divIcon({
    html: svg,
    className: isSelected ? 'custom-marker-selected' : 'custom-marker',
    iconSize: [size, height],
    iconAnchor: [size / 2, height],
    popupAnchor: [0, -height],
  });
}

function AutoZoom({ entries, visible }: { entries: MappableEntry[]; visible?: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (visible === false) return; // skip when container is hidden
    map.invalidateSize();

    if (entries.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    if (entries.length === 1) {
      map.setView([entries[0].lat, entries[0].lng], 14);
      return;
    }
    const bounds = L.latLngBounds(entries.map((e) => [e.lat, e.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [entries, map, visible]);

  return null;
}

type Props = {
  entries: MappableEntry[];
  onPinClick?: (entry: MappableEntry) => void;
  visible?: boolean;
  selectedEntryId?: string | null;
};

export default function MapContent({ entries, onPinClick, visible, selectedEntryId }: Props) {
  const entryColors = useEntryColors();

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="w-full h-full"
      style={{ minHeight: '300px', zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <AutoZoom entries={entries} visible={visible} />
      {entries.map((entry) => (
        <Marker
          key={entry.id}
          position={[entry.lat, entry.lng]}
          icon={createColoredIcon(entryColors[entry.type], selectedEntryId === entry.id)}
          eventHandlers={{ click: () => onPinClick?.(entry) }}
        >
          <Popup>
            <div>
              <strong>{entry.name}</strong>
              <br />
              <span className="text-sm text-gray-500">{entry.address}</span>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
