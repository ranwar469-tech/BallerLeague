import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, Search, X } from 'lucide-react';
import api from '../lib/api';

const DEFAULT_CENTER = { lng: -0.1276, lat: 51.5072 }; // London
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

function toVenueSelection(place) {
  if (!place) {
    return null;
  }

  return {
    name: place.name || '',
    address: place.address || '',
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    place_id: place.place_id || null
  };
}

export function VenuePickerModal({ isOpen, onClose, onSelect, initialVenue = null }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(initialVenue);

  const initialCenter = useMemo(() => {
    const latitude = Number(initialVenue?.latitude);
    const longitude = Number(initialVenue?.longitude);
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      return { lng: longitude, lat: latitude };
    }

    return DEFAULT_CENTER;
  }, [initialVenue]);

  function updateMarker(longitude, latitude) {
    if (!mapRef.current) {
      return;
    }

    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: '#1d4ed8' }).setLngLat([longitude, latitude]).addTo(mapRef.current);
      return;
    }

    markerRef.current.setLngLat([longitude, latitude]);
  }

  async function reverseGeocode(latitude, longitude) {
    try {
      const { data } = await api.get('/matches/geocode/reverse', {
        params: {
          lat: latitude,
          lon: longitude
        }
      });

      const nextVenue = toVenueSelection(data);
      if (!nextVenue) {
        return;
      }

      setSelectedVenue(nextVenue);
      updateMarker(nextVenue.longitude, nextVenue.latitude);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Unable to fetch venue details for this location');
    }
  }

  async function handleSearch(event) {
    event.preventDefault();

    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setErrorMessage('');

    try {
      const { data } = await api.get('/matches/geocode/search', {
        params: {
          q: query.trim(),
          limit: 8
        }
      });
      setResults(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Venue search failed');
    } finally {
      setIsSearching(false);
    }
  }

  function handlePickSearchResult(item) {
    const nextVenue = toVenueSelection(item);
    if (!nextVenue) {
      return;
    }

    setSelectedVenue(nextVenue);
    if (mapRef.current) {
      mapRef.current.flyTo({ center: [nextVenue.longitude, nextVenue.latitude], zoom: 14, essential: true });
    }
    updateMarker(nextVenue.longitude, nextVenue.latitude);
  }

  function handleConfirm() {
    if (!selectedVenue) {
      return;
    }

    onSelect(selectedVenue);
    onClose();
  }

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    if (!mapRef.current) {
      mapRef.current = new maplibregl.Map({
        container: containerRef.current,
        style: MAP_STYLE,
        center: [initialCenter.lng, initialCenter.lat],
        zoom: 11
      });

      mapRef.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

      mapRef.current.on('click', (event) => {
        const longitude = Number(event.lngLat.lng);
        const latitude = Number(event.lngLat.lat);
        updateMarker(longitude, latitude);
        reverseGeocode(latitude, longitude);
      });
    } else {
      mapRef.current.resize();
      mapRef.current.setCenter([initialCenter.lng, initialCenter.lat]);
    }

    if (selectedVenue?.latitude && selectedVenue?.longitude) {
      updateMarker(selectedVenue.longitude, selectedVenue.latitude);
    }
  }, [isOpen, initialCenter]);

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedVenue(initialVenue || null);
    setQuery('');
    setResults([]);
    setErrorMessage('');
  }, [isOpen, initialVenue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm p-4 md:p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Select Venue Location</h3>
            <p className="text-sm text-slate-500">Search by name or click directly on the map.</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4 p-4">
          <aside className="space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search stadium, pitch, or address"
                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
              <button type="submit" disabled={isSearching} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-2 text-sm font-semibold">
                <Search size={14} />
                Search
              </button>
            </form>

            {errorMessage ? (
              <p className="text-xs text-rose-600 dark:text-rose-300 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 px-3 py-2">
                {errorMessage}
              </p>
            ) : null}

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-xs text-slate-500">No search results yet. Use search or click map.</div>
              ) : (
                results.map((item) => (
                  <button
                    key={`${item.place_id || item.address}-${item.latitude}-${item.longitude}`}
                    type="button"
                    onClick={() => handlePickSearchResult(item)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.name || 'Unnamed location'}</p>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.address}</p>
                  </button>
                ))
              )}
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs uppercase tracking-wide text-slate-500">Selected Venue</p>
              {selectedVenue ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedVenue.name || 'Picked map location'}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{selectedVenue.address || 'No address available'}</p>
                  <p className="text-[11px] text-slate-500">
                    {Number(selectedVenue.latitude).toFixed(5)}, {Number(selectedVenue.longitude).toFixed(5)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-2">No venue selected.</p>
              )}
            </div>
          </aside>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-95">
            <div ref={containerRef} className="h-105 w-full" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-semibold">
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedVenue}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold"
          >
            <MapPin size={14} />
            Use This Venue
          </button>
        </div>
      </div>
    </div>
  );
}
