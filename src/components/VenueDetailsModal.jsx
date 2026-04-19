import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, X } from 'lucide-react';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

export function VenueDetailsModal({ isOpen, onClose, venue }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const latitude = Number(venue?.latitude);
  const longitude = Number(venue?.longitude);
  const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  useEffect(() => {
    if (!isOpen || !hasCoordinates || !containerRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [longitude, latitude],
        zoom: 13
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    } else {
      mapRef.current.resize();
      mapRef.current.setCenter([longitude, latitude]);
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#0f766e' }).setLngLat([longitude, latitude]).addTo(mapRef.current);
    } else {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [isOpen, hasCoordinates, latitude, longitude]);

  useEffect(() => {
    if (isOpen) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Venue Details</h3>
            <p className="text-sm text-slate-500">Location shown for this fixture.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MapPin size={14} />
              {venue?.name || 'Venue not set'}
            </p>
            <p className="text-xs text-slate-500 mt-1">{venue?.address || 'No address details available.'}</p>
            {hasCoordinates ? (
              <p className="text-[11px] text-slate-500 mt-1">{latitude.toFixed(5)}, {longitude.toFixed(5)}</p>
            ) : null}
          </div>

          {hasCoordinates ? (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div ref={containerRef} className="h-90 w-full" />
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm p-4">
              This fixture has no map coordinates yet. Admins can set coordinates from the venue picker.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
