import { useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Tooltip,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import {
  Expand,
  Minimize,
  LocateFixed,
  Minus,
  Plus,
  Layers,
  MapPin,
  Radio,
  Route,
  Network,
} from "lucide-react";
import {
  type Line,
  type Report,
  type Vehicle,
  stopById,
  position,
  isFresh,
  interchangeLines,
  serviceFor,
  modeLabels,
  statusLabels,
} from "../data";
import { LineBadge, StatusBadge } from "./UI";

export type MapView = "network" | "line";
function MapController({
  lines,
  reset,
  focusedStop,
}: {
  lines: Line[];
  reset: number;
  focusedStop: string;
}) {
  const map = useMap();
  // Fit only when coverage/view changes, not on every vehicle tick or user pan.
  const boundsKey = lines.map((l) => `${l.id}:${l.stops.join(",")}`).join("|");
  useEffect(() => {
    const points = lines.flatMap((line) =>
      line.stops.map((id) => {
        const s = stopById(id);
        return [s.lat, s.lng] as [number, number];
      }),
    );
    if (points.length)
      map.fitBounds(L.latLngBounds(points), {
        paddingTopLeft: [45, 90],
        paddingBottomRight: [45, 105],
        maxZoom: 14,
        animate: false,
      });
    // Lines are represented by the coverage key to avoid refitting for status-only changes.
  }, [map, boundsKey, reset]);
  useEffect(() => {
    if (!focusedStop) return;
    const stop = stopById(focusedStop);
    if (!map.getBounds().pad(-0.15).contains([stop.lat, stop.lng]))
      map.panTo([stop.lat, stop.lng], { animate: false });
  }, [focusedStop, map]);
  useEffect(() => {
    const observer = new ResizeObserver(() =>
      map.invalidateSize({ pan: false }),
    );
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
  visibleLines,
  reports,
  selected,
  vehicles,
  stopId,
  onStop,
  onVehicle,
  onSelectLine,
  view,
  onView,
  now,
}: {
  lines: Line[];
  visibleLines: Line[];
  reports: Report[];
  selected: Line;
  vehicles: Vehicle[];
  stopId: string;
  onStop: (id: string) => void;
  onVehicle: (id: string) => void;
  onSelectLine: (id: string) => void;
  view: MapView;
  onView: (view: MapView) => void;
  now: number;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const [reset, setReset] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [showStations, setShowStations] = useState(true);
  const [vehicleLayer, setVehicleLayer] = useState<boolean | null>(null);
  const showVehicles = vehicleLayer ?? view === "line";
  const [showTiles, setShowTiles] = useState(true);
  const [tileError, setTileError] = useState(false);
  const selectedVisible = visibleLines.some((l) => l.id === selected.id);
  const displayed = useMemo(
    () =>
      view === "line"
        ? visibleLines.filter((l) => l.id === selected.id)
        : visibleLines,
    [view, visibleLines, selected.id],
  );
  const ids = new Set(displayed.map((l) => l.id));
  const stationIds = [...new Set(displayed.flatMap((l) => l.stops))];
  const currentService = serviceFor(selected, reports, now);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    const previousFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current
      ?.querySelector<HTMLButtonElement>(".map-expand-button")
      ?.focus();
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") setExpanded(false);
      if (e.key === "Tab") {
        const focusable = [
          ...(panelRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ) ?? []),
        ].filter((node) => node.getClientRects().length > 0);
        const first = focusable[0],
          last = focusable.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", close);
      previousFocus?.focus();
    };
  }, [expanded]);
  return (
    <section
      ref={panelRef}
      role={expanded ? "dialog" : "region"}
      aria-modal={expanded || undefined}
      className={`map-panel multimodal-map ${expanded ? "expanded-map" : ""}`}
      aria-label="Carte du réseau de Tunis"
    >
      <div className="map-toolbar">
        <div
          className="map-view-tabs"
          role="group"
          aria-label="Vue de la carte"
        >
          <button
            className={view === "network" ? "active" : ""}
            aria-pressed={view === "network"}
            onClick={() => onView("network")}
          >
            <Network size={15} />
            Réseau
          </button>
          <button
            className={view === "line" ? "active" : ""}
            aria-pressed={view === "line"}
            onClick={() => onView("line")}
          >
            <Route size={15} />
            Ma ligne
          </button>
        </div>
        <span className="map-demo-label">
          <span className="status-dot" /> Simulation
        </span>
        <button
          className="map-expand-button"
          aria-label={expanded ? "Réduire la carte" : "Agrandir la carte"}
          aria-pressed={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <Minimize size={17} /> : <Expand size={17} />}
        </button>
      </div>
      <MapContainer
        center={[36.824, 10.18]}
        zoom={12}
        zoomControl={false}
        scrollWheelZoom={false}
        zoomSnap={0.25}
        className="transit-map"
      >
        {showTiles && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              tileerror: () => setTileError(true),
              tileload: () => setTileError(false),
            }}
          />
        )}
        {displayed.map((line) => {
          const status = serviceFor(line, reports, now).status;
          return (
            <Polyline
              key={line.id}
              positions={line.stops.map((id) => {
                const s = stopById(id);
                return [s.lat, s.lng];
              })}
              pathOptions={{
                color: line.color,
                weight: line.id === selected.id ? 5 : 3,
                opacity: line.id === selected.id ? 1 : 0.65,
                dashArray:
                  status === "suspended"
                    ? "2 8"
                    : status === "delayed"
                      ? "9 6"
                      : undefined,
              }}
              eventHandlers={{ click: () => onSelectLine(line.id) }}
            >
              <Tooltip sticky>
                {modeLabels[line.mode]} {line.id} · {statusLabels[status]} ·
                Démo
              </Tooltip>
            </Polyline>
          );
        })}
        {showStations &&
          stationIds.map((id) => {
            const s = stopById(id);
            const served = interchangeLines(lines, id).filter((l) =>
              ids.has(l.id),
            );
            const interchange = interchangeLines(lines, id).length > 1;
            const chosen = selectedVisible && id === stopId;
            const terminating = displayed.filter(
              (line) => line.stops.at(-1) === id,
            );
            if (
              view === "network" &&
              !interchange &&
              !selected.stops.includes(id) &&
              !terminating.length
            )
              return null;
            return (
              <CircleMarker
                key={id}
                center={[s.lat, s.lng]}
                radius={chosen ? 8 : interchange ? 5.5 : 3.5}
                pathOptions={{
                  color: chosen
                    ? selected.color
                    : interchange
                      ? "#425b75"
                      : "#7b8da2",
                  weight: interchange ? 2.5 : 1.5,
                  fillColor: "#fff",
                  fillOpacity: 1,
                }}
              >
                {view === "network" && terminating.length ? (
                  <Tooltip
                    direction="right"
                    permanent
                    className="terminal-label"
                  >
                    <span className="terminal-routes">
                      {terminating.map((line) => (
                        <LineBadge key={line.id} line={line} small />
                      ))}
                    </span>
                  </Tooltip>
                ) : (
                  <Tooltip
                    direction="top"
                    permanent={view === "line" && chosen}
                    className="stop-label"
                  >
                    {s.name}
                    {chosen
                      ? " · Votre arrêt"
                      : interchange
                        ? " · Correspondance"
                        : ""}
                  </Tooltip>
                )}
                <Popup>
                  <div className="station-popup">
                    <strong>{s.name}</strong>
                    <p>
                      {interchange
                        ? "Correspondances dans ce réseau démo"
                        : "Arrêt du réseau démo"}
                    </p>
                    {served.map((line) => (
                      <button
                        key={line.id}
                        onClick={() => {
                          onSelectLine(line.id);
                          onStop(id);
                        }}
                      >
                        <LineBadge line={line} small />
                        <span>{modeLabels[line.mode]} · Choisir cet arrêt</span>
                      </button>
                    ))}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        {showVehicles &&
          vehicles
            .filter(
              (v) =>
                ids.has(v.lineId) &&
                serviceFor(
                  lines.find((l) => l.id === v.lineId)!,
                  reports,
                  now,
                ).status !== "suspended",
            )
            .map((v) => {
              const line = lines.find((l) => l.id === v.lineId)!;
              const fresh = isFresh(v, now);
              const symbol =
                line.mode === "bus"
                  ? '<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v2m8-2v2M9 15h.01M15 15h.01M10 6h4"/>'
                  : '<rect x="6" y="3" width="12" height="15" rx="4"/><path d="M6 10h12M9 18l-3 3m9-3 3 3M9 14h.01M15 14h.01M12 3V1"/>';
              const icon = L.divIcon({
                className: "vehicle-icon",
                html: `<div style="--bus-color:${fresh ? line.color : "#647183"}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">${symbol}</svg><b>${line.id.replace(/[^a-zA-Z0-9]/g, "")}</b></div>`,
                iconSize: [line.id.length > 2 ? 66 : 57, 34],
                iconAnchor: [28, 17],
              });
              const destination = stopById(
                v.direction === 1 ? line.stops.at(-1)! : line.stops[0],
              ).name;
              return (
                <Marker
                  key={v.id}
                  title={`${v.id} · ${modeLabels[line.mode]} ${line.id} · GPS simulé`}
                  alt={`${v.id} · ${modeLabels[line.mode]} ${line.id} · GPS simulé`}
                  position={position(v, line)}
                  icon={icon}
                  eventHandlers={{ click: () => onVehicle(v.id) }}
                >
                  <Tooltip>
                    {v.id} · Vers {destination}
                    <br />
                    {fresh
                      ? "GPS simulé récent"
                      : "Position ancienne · sans estimation"}
                  </Tooltip>
                </Marker>
              );
            })}
        <MapController
          lines={displayed}
          reset={reset}
          focusedStop={view === "line" && selectedVisible ? stopId : ""}
        />
      </MapContainer>
      <div
        className="map-layer-controls"
        role="group"
        aria-label="Éléments de la carte"
      >
        <button
          aria-pressed={showStations}
          onClick={() => setShowStations(!showStations)}
        >
          <MapPin size={14} />
          Stations
        </button>
        <button
          aria-pressed={showVehicles}
          onClick={() => setVehicleLayer(!showVehicles)}
        >
          <Radio size={14} />
          Véhicules
        </button>
        <button
          aria-pressed={showTiles}
          onClick={() => setShowTiles(!showTiles)}
        >
          <Layers size={14} />
          Fond de carte
        </button>
      </div>
      {showTiles && tileError && (
        <div className="map-offline" role="status">
          Fond de carte indisponible. Désactivez-le pour une vue épurée des
          parcours.
        </div>
      )}
      {!displayed.length && (
        <div className="map-empty" role="status">
          <MapPin size={26} />
          <strong>Aucune ligne à afficher</strong>
          <span>Modifiez les filtres dans la liste.</span>
        </div>
      )}
      <button
        className="map-locate"
        aria-label={
          view === "network"
            ? "Recentrer le réseau filtré"
            : "Recentrer sur la ligne"
        }
        onClick={() => setReset((r) => r + 1)}
      >
        <LocateFixed size={20} />
      </button>
      <div className="map-network-caption">
        {view === "line" && selectedVisible ? (
          <>
            <LineBadge line={selected} small />
            <span>
              {modeLabels[selected.mode]} · {selected.stops.length} arrêts
            </span>
            <StatusBadge status={currentService.status} />
          </>
        ) : (
          <>
            <Network size={15} />
            <strong>
              {displayed.length} ligne{displayed.length !== 1 ? "s" : ""}
            </strong>
            <span>· {stationIds.length} arrêts · tracés indicatifs</span>
          </>
        )}
      </div>
      <div className="map-service-legend">
        <span>
          <i />
          Normal
        </span>
        <span>
          <i />
          Perturbé
        </span>
        <span>
          <i />
          Interrompu
        </span>
        <span>
          <i />
          Correspondance
        </span>
      </div>
    </section>
  );
}
