import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  Marker,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  BusFront,
  LocateFixed,
  Minus,
  Plus,
  RotateCcw,
  Layers,
} from "lucide-react";
import { type Line, type Vehicle, stopById, position, isFresh } from "../data";

function MapController({ line, reset }: { line: Line; reset: number }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(
      L.latLngBounds(
        line.stops.map((id) => {
          const s = stopById(id);
          return [s.lat, s.lng] as [number, number];
        }),
      ),
      { padding: [65, 65], maxZoom: 14 },
    );
  }, [map, line, reset]);
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return (
    <div className="map-zoom">
      <button aria-label="Zoom avant" onClick={() => map.zoomIn()}>
        <Plus size={18} />
      </button>
      <button aria-label="Zoom arrière" onClick={() => map.zoomOut()}>
        <Minus size={18} />
      </button>
    </div>
  );
}
export default function TransitMap({
  lines,
  selected,
  vehicles,
  stopId,
  onStop,
  onVehicle,
  now,
}: {
  lines: Line[];
  selected: Line;
  vehicles: Vehicle[];
  stopId: string;
  onStop: (id: string) => void;
  onVehicle: (id: string) => void;
  now: number;
}) {
  const [reset, setReset] = useState(0);
  const [all, setAll] = useState(true);
  const [tileError, setTileError] = useState(false);
  return (
    <section className="map-panel" aria-label="Carte du réseau de Tunis">
      <MapContainer
        center={[36.824, 10.18]}
        zoom={13}
        zoomControl={false}
        scrollWheelZoom={false}
        zoomSnap={0.25}
        className="transit-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          eventHandlers={{
            tileerror: () => setTileError(true),
            tileload: () => setTileError(false),
          }}
        />
        {(all ? lines : [selected]).map((line) => (
          <Polyline
            key={line.id}
            positions={line.stops.map((id) => {
              const s = stopById(id);
              return [s.lat, s.lng];
            })}
            pathOptions={{
              color: line.color,
              weight: line.id === selected.id ? 5 : 3,
              opacity: line.id === selected.id ? 0.95 : 0.3,
            }}
          />
        ))}
        {selected.stops.map((id) => {
          const s = stopById(id);
          return (
            <CircleMarker
              key={id}
              center={[s.lat, s.lng]}
              radius={id === stopId ? 8 : 5}
              pathOptions={{
                color: selected.color,
                weight: 3,
                fillColor: "#fff",
                fillOpacity: 1,
              }}
              eventHandlers={{ click: () => onStop(id) }}
            >
              <Tooltip
                direction="top"
                permanent={id === stopId}
                className="stop-label"
              >
                {s.name}
                {id === stopId && " · Votre arrêt"}
              </Tooltip>
            </CircleMarker>
          );
        })}
        {vehicles
          .filter((v) => all || v.lineId === selected.id)
          .map((v) => {
            const line = lines.find((l) => l.id === v.lineId);
            if (!line) return null;
            const fresh = isFresh(v, now);
            const icon = L.divIcon({
              className: "vehicle-icon",
              html: `<div style="--bus-color:${fresh ? line.color : "#647183"}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v2m8-2v2M9 15h.01M15 15h.01M10 6h4"/></svg><b>${line.id.replace(/[^a-zA-Z0-9]/g, "")}</b></div>`,
              iconSize: [57, 34],
              iconAnchor: [28, 17],
            });
            return (
              <Marker
                key={v.id}
                title={`${v.id} · Ligne ${line.id} · GPS simulé`}
                alt={`${v.id} · Ligne ${line.id} · GPS simulé`}
                position={position(v, line)}
                icon={icon}
                eventHandlers={{ click: () => onVehicle(v.id) }}
              >
                <Tooltip>
                  {v.id} · {fresh ? "GPS simulé" : "Position ancienne"}
                </Tooltip>
              </Marker>
            );
          })}
        <MapController line={selected} reset={reset} />
      </MapContainer>
      <div className="map-top">
        <span className="map-pill">
          <span className="status-dot" /> Réseau Grand Tunis{" "}
          <span className="muted">· Démo</span>
        </span>
        <button
          className={`map-pill layer-toggle ${all ? "selected" : ""}`}
          onClick={() => setAll(!all)}
          aria-pressed={all}
        >
          <Layers size={16} /> Toutes les lignes
        </button>
      </div>
      {tileError && (
        <div className="map-offline" role="status">
          Fond de carte indisponible. Les parcours restent consultables.
        </div>
      )}
      <button
        className="map-locate"
        aria-label="Recentrer sur la ligne"
        onClick={() => setReset((r) => r + 1)}
      >
        <LocateFixed size={20} />
      </button>
      <div className="map-legend">
        <span>
          <BusFront size={15} /> Bus simulé
        </span>
        <span>
          <i className="legend-stop" /> Arrêt
        </span>
        <button
          onClick={() => setReset((r) => r + 1)}
          aria-label="Réinitialiser la vue"
        >
          <RotateCcw size={14} />
        </button>
      </div>
      <div className="map-location">
        TUNIS <span>36.8065° N, 10.1815° E</span>
      </div>
    </section>
  );
}
