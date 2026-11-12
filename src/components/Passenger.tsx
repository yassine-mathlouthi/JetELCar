import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  ChevronRight,
  Clock3,
  Flag,
  Heart,
  Info,
  MapPin,
  Navigation,
  Radio,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  activeReports,
  arrivalMinutes,
  crowdLevel,
  defaultFilters,
  directionStops,
  filterLines,
  isFresh,
  modeLabels,
  segmentMinutes,
  serviceFor,
  stopById,
  type Direction,
  type NetworkFilters,
  type Line,
  type Vehicle,
  type Report,
} from "../data";
import TransitMap from "./TransitMap";
import {
  CrowdBadge,
  Empty,
  LineBadge,
  ModeBadge,
  ModeIcon,
  StatusBadge,
} from "./UI";
export type PassengerProps = {
  lines: Line[];
  vehicles: Vehicle[];
  reports: Report[];
  now: number;
  selected: Line;
  direction: Direction;
  setDirection: (direction: Direction) => void;
  selectLine: (id: string) => void;
  stopId: string;
  setStopId: (id: string) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  onReport: () => void;
  onCrowd: (id: string) => void;
  onPlan: () => void;
  onAlert: (id: string) => void;
  alertLines: string[];
  favoritesOnly?: boolean;
};
export default function Passenger(p: PassengerProps) {
  const [filters, setFilters] = useState<NetworkFilters>(defaultFilters);
  const [view, setView] = useState<"network" | "line">("network");
  const search = filters.search;
  function updateFilters(patch: Partial<NetworkFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setView("network");
    setActiveVehicle(null);
  }
  const setSearch = (value: string) => updateFilters({ search: value });
  const [expanded, setExpanded] = useState(false);
  const [activeVehicle, setActiveVehicle] = useState<string | null>(null);
  const service = serviceFor(p.selected, p.reports, p.now);
  const effectiveLine = { ...p.selected, status: service.status };
  const orderedStops = directionStops(p.selected, p.direction);
  const lineVehicles = p.vehicles.filter(
    (v) => v.lineId === p.selected.id && v.direction === p.direction,
  );
  const filtered = filterLines(
    p.favoritesOnly
      ? p.lines.filter((l) => p.favorites.includes(l.id))
      : p.lines,
    p.vehicles,
    p.reports,
    p.now,
    filters,
  );
  const hasSelected = filtered.some((l) => l.id === p.selected.id);
  const firstVisibleId = !hasSelected ? filtered[0]?.id : undefined;
  useEffect(() => {
    if (firstVisibleId) p.selectLine(firstVisibleId);
  }, [firstVisibleId, p.selectLine]);
  function selectLine(id: string) {
    p.selectLine(id);
    setView("line");
    setExpanded(false);
    setActiveVehicle(null);
  }
  const arrivals = lineVehicles
    .map((v) => ({
      vehicle: v,
      eta: arrivalMinutes(
        v,
        p.selected.stops.indexOf(p.stopId),
        p.now,
        effectiveLine,
      ),
    }))
    .filter((a) => a.eta !== null)
    .sort((a, b) => a.eta! - b.eta!);
  const next = arrivals[0];
  const incidents = activeReports(p.reports, p.now).filter(
    (r) => r.lineId === p.selected.id,
  );
  const focusVehicle = p.vehicles.find((v) => v.id === activeVehicle);
  const disrupted = incidents.length > 0 || service.status !== "normal";
  return (
    <>
      <div className="workspace">
        <section className="line-browser card">
          <div className="browser-heading">
            <div>
              <h2>
                {p.favoritesOnly
                  ? "Mes lignes favorites"
                  : "Trouvez votre ligne"}
              </h2>
              <p>Un départ plus serein commence ici.</p>
            </div>
            <span className="count-badge">{filtered.length}</span>
          </div>
          <label className="search-field">
            <Search size={18} />
            <input
              aria-label="Rechercher une ligne ou un arrêt"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Une ligne, un arrêt, une destination…"
            />
            {search && (
              <button
                className="clear-search"
                onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
              >
                ×
              </button>
            )}
          </label>
          <div
            className="network-mode-tabs"
            role="group"
            aria-label="Mode de transport"
          >
            {(["all", "bus", "metro", "tgm"] as const).map((mode) => (
              <button
                key={mode}
                aria-pressed={filters.mode === mode}
                className={filters.mode === mode ? "active" : ""}
                onClick={() => updateFilters({ mode })}
              >
                {mode !== "all" && <ModeIcon mode={mode} size={14} />}
                {mode === "all" ? "Tout" : modeLabels[mode]}
              </button>
            ))}
          </div>
          <div className="network-filter-row">
            <label className="status-filter">
              <span className="sr-only">Statut du service</span>
              <select
                aria-label="Statut du service"
                value={filters.status}
                onChange={(e) =>
                  updateFilters({
                    status: e.target.value as NetworkFilters["status"],
                  })
                }
              >
                <option value="all">Tous les statuts</option>
                <option value="normal">Service normal</option>
                <option value="delayed">Perturbé</option>
                <option value="suspended">Interrompu</option>
              </select>
            </label>
            <button
              className={`gps-filter ${filters.gpsOnly ? "active" : ""}`}
              aria-pressed={filters.gpsOnly}
              onClick={() => updateFilters({ gpsOnly: !filters.gpsOnly })}
            >
              <Radio size={13} /> GPS récent
            </button>
          </div>
          <div className="filter-summary">
            <span role="status">
              {filtered.length} ligne{filtered.length !== 1 ? "s" : ""} affichée
              {filtered.length !== 1 ? "s" : ""}
            </span>
            <button
              onClick={() => setFilters(defaultFilters)}
              disabled={
                JSON.stringify(filters) === JSON.stringify(defaultFilters)
              }
            >
              Effacer les filtres
            </button>
          </div>
          <div className="line-list">
            {filtered.map((line) => {
              const chosen = line.id === p.selected.id;
              const vehicles = p.vehicles.filter((v) => v.lineId === line.id);
              const available = vehicles.some((v) => isFresh(v, p.now));
              const lineService = serviceFor(line, p.reports, p.now);
              return (
                <div
                  key={line.id}
                  className={`line-item ${chosen ? "active" : ""}`}
                >
                  <button
                    className="line-select"
                    onClick={() => selectLine(line.id)}
                    aria-pressed={chosen}
                  >
                    <LineBadge line={line} />
                    <div className="line-summary">
                      <span className="line-mode-label">
                        <ModeIcon mode={line.mode} size={11} />
                        {modeLabels[line.mode]} · {line.stops.length} arrêts
                      </span>
                      <strong>{stopById(line.stops.at(-1)!).name}</strong>
                      <span>Depuis {stopById(line.stops[0]).name}</span>
                      <span className="line-meta">
                        <StatusBadge status={lineService.status} />
                        {!available && <span>GPS ancien</span>}
                      </span>
                    </div>
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className={`favorite-button ${p.favorites.includes(line.id) ? "saved" : ""}`}
                    aria-label={`${p.favorites.includes(line.id) ? "Retirer" : "Ajouter"} la ligne ${line.id} ${p.favorites.includes(line.id) ? "des" : "aux"} favoris`}
                    aria-pressed={p.favorites.includes(line.id)}
                    onClick={() => p.toggleFavorite(line.id)}
                  >
                    <Heart
                      size={16}
                      fill={
                        p.favorites.includes(line.id) ? "currentColor" : "none"
                      }
                    />
                  </button>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <Empty
                title={
                  p.favoritesOnly && !search
                    ? "Vos lignes, à portée de main"
                    : "Aucune ligne trouvée"
                }
                text={
                  p.favoritesOnly && !search
                    ? "Touchez le cœur d’une ligne dans le réseau pour la retrouver ici."
                    : "Essayez « M2 », « Marsa », ou effacez les filtres."
                }
                action={
                  <button
                    className="secondary-button"
                    onClick={() => setFilters(defaultFilters)}
                  >
                    Effacer les filtres
                  </button>
                }
              />
            )}
          </div>
          <div className="browser-note">
            <Info size={16} />
            <p>
              Un réseau de démonstration.
              <br />
              <span>Tracés indicatifs · statuts et horaires simulés.</span>
            </p>
          </div>
        </section>
        <TransitMap
          lines={p.lines}
          visibleLines={filtered}
          reports={p.reports}
          selected={p.selected}
          view={view}
          onView={setView}
          onSelectLine={selectLine}
          vehicles={p.vehicles}
          stopId={p.stopId}
          onStop={p.setStopId}
          now={p.now}
          onVehicle={(id) => {
            const v = p.vehicles.find((v) => v.id === id)!;
            if (v.lineId !== p.selected.id) p.selectLine(v.lineId);
            p.setDirection(v.direction);
            setView("line");
            setActiveVehicle(id);
          }}
        />
      </div>
      {focusVehicle && (
        <div className="vehicle-detail card">
          <ModeIcon
            mode={p.lines.find((l) => l.id === focusVehicle.lineId)!.mode}
            size={20}
          />
          <strong>{focusVehicle.id}</strong>
          <span>
            {isFresh(focusVehicle, p.now)
              ? "Position GPS simulée"
              : "Position ancienne · estimation indisponible"}
          </span>
          <CrowdBadge level={crowdLevel(focusVehicle, p.now)} />
          <button
            className="text-button"
            onClick={() => p.onCrowd(focusVehicle.id)}
          >
            Déclarer l’affluence
          </button>
          <button
            className="icon-button"
            aria-label="Fermer les détails du véhicule"
            onClick={() => setActiveVehicle(null)}
          >
            ×
          </button>
        </div>
      )}
      {hasSelected && (
        <>
          <div className="selected-line-banner card">
            <div>
              <LineBadge line={p.selected} />
              <div>
                <span className="selected-line-kicker">
                  <ModeBadge mode={p.selected.mode} />{" "}
                  <span>Scénario de démonstration</span>
                </span>
                <h2>{p.selected.name}</h2>
              </div>
            </div>
            <StatusBadge status={service.status} />
            <p>{service.note}</p>
            {p.selected.bidirectional && (
              <label className="direction-select">
                <span>Sens de circulation</span>
                <select
                  aria-label="Sens de circulation"
                  value={p.direction}
                  onChange={(e) =>
                    p.setDirection(Number(e.target.value) as Direction)
                  }
                >
                  <option value="1">
                    Vers {stopById(p.selected.stops.at(-1)!).name}
                  </option>
                  <option value="-1">
                    Vers {stopById(p.selected.stops[0]).name}
                  </option>
                </select>
              </label>
            )}
          </div>
          <div className="below-grid">
            <section className="arrival-card card">
              <div className="section-heading">
                <div className="heading-with-icon">
                  <span className="soft-icon">
                    <Clock3 size={18} />
                  </span>
                  <h2>Votre prochain départ</h2>
                </div>
                <span className="subtle-label">
                  <Radio size={13} /> Simulation
                </span>
              </div>
              <div className="arrival-layout">
                <div className="arrival-info">
                  <label className="field-label" htmlFor="stop-select">
                    À l’arrêt
                  </label>
                  <div className="stop-select-wrap">
                    <MapPin size={17} />
                    <select
                      id="stop-select"
                      value={p.stopId}
                      onChange={(e) => p.setStopId(e.target.value)}
                    >
                      {orderedStops.map((id) => (
                        <option key={id} value={id}>
                          {stopById(id).name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                  <div className="arrival-route">
                    <LineBadge line={p.selected} small />
                    <span>
                      Direction{" "}
                      <strong>{stopById(orderedStops.at(-1)!).name}</strong>
                    </span>
                  </div>
                  <div className="arrival-time">
                    {next ? (
                      <>
                        <strong>{next.eta}</strong>
                        <span>
                          min<small>Prochain véhicule estimé</small>
                        </span>
                      </>
                    ) : (
                      <p className="unavailable">
                        Estimation indisponible
                        <small>
                          {service.status === "suspended"
                            ? "Le service est interrompu dans ce scénario."
                            : lineVehicles.some((v) => !isFresh(v, p.now))
                              ? "La dernière position GPS est trop ancienne."
                              : "Aucun véhicule suivi en approche dans ce sens."}
                        </small>
                      </p>
                    )}
                  </div>
                  {next && (
                    <>
                      <CrowdBadge level={crowdLevel(next.vehicle, p.now)} />
                      <p className="freshness">
                        GPS simulé · actualisé il y a{" "}
                        {Math.max(
                          0,
                          Math.floor((p.now - next.vehicle.updatedAt) / 1000),
                        )}{" "}
                        s<br />
                        Affluence : {next.vehicle.contributions} avis · il y a{" "}
                        {Math.max(
                          0,
                          Math.floor((p.now - next.vehicle.crowdAt) / 60000),
                        )}{" "}
                        min
                      </p>
                    </>
                  )}
                </div>
                <div className="route-preview">
                  <div className="route-preview-heading">
                    <span>PARCOURS DE LA LIGNE {p.selected.id}</span>
                    <button
                      className="icon-button"
                      aria-label={
                        expanded ? "Réduire les arrêts" : "Voir tous les arrêts"
                      }
                      onClick={() => setExpanded(!expanded)}
                    >
                      <ChevronDown
                        size={16}
                        style={{
                          transform: expanded ? "rotate(180deg)" : undefined,
                        }}
                      />
                    </button>
                  </div>
                  <div
                    className="stop-timeline"
                    style={
                      {
                        "--line-color": p.selected.color,
                      } as React.CSSProperties
                    }
                  >
                    {(expanded ? orderedStops : orderedStops.slice(0, 4)).map(
                      (id, index) => (
                        <button
                          key={id}
                          className={`timeline-stop ${id === p.stopId ? "selected" : ""}`}
                          onClick={() => p.setStopId(id)}
                        >
                          <span className="timeline-dot" />
                          <span>{stopById(id).name}</span>
                          {id === p.stopId ? (
                            <span className="here-tag">Votre arrêt</span>
                          ) : (
                            <small>
                              {index * segmentMinutes(p.selected)} min
                            </small>
                          )}
                        </button>
                      ),
                    )}
                    {!expanded && p.selected.stops.length > 4 && (
                      <button
                        className="more-stops"
                        onClick={() => setExpanded(true)}
                      >
                        + {p.selected.stops.length - 4} arrêts{" "}
                        <ChevronDown size={13} />
                      </button>
                    )}
                  </div>
                  <p className="schedule-note">
                    {p.selected.frequency
                      ? `Passage indicatif toutes les ${p.selected.frequency} min · ${p.selected.start}–${p.selected.end}`
                      : "Horaires planifiés non disponibles."}
                  </p>
                </div>
              </div>
              <div className="arrival-actions">
                <button
                  className={`text-button ${p.alertLines.includes(p.selected.id) ? "enabled" : ""}`}
                  onClick={() => p.onAlert(p.selected.id)}
                >
                  <Bell size={15} />
                  {p.alertLines.includes(p.selected.id)
                    ? "Alerte d’arrivée activée"
                    : "M’avertir à l’approche"}
                </button>
                {next && (
                  <button
                    className="text-button muted"
                    onClick={() => p.onCrowd(next.vehicle.id)}
                  >
                    Déclarer l’affluence <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </section>
            <section className="travel-card card">
              <div className="section-heading">
                <div className="heading-with-icon">
                  <span className="soft-icon green">
                    <Navigation size={18} />
                  </span>
                  <h2>Un trajet, plusieurs options.</h2>
                </div>
              </div>
              <p>
                Repérez votre correspondance et trouvez une alternative pour
                arriver à destination.
              </p>
              <div className="mini-journey">
                <span className="mini-dot" />
                <span>Votre point de départ</span>
                <ArrowRight size={17} />
                <span>Votre destination</span>
                <MapPin size={16} />
              </div>
              <button className="primary-button full" onClick={p.onPlan}>
                Planifier mon trajet <ArrowRight size={17} />
              </button>
              <div className="travel-footer">
                <ShieldCheck size={15} /> Itinéraires limités au réseau de
                démonstration
              </div>
            </section>
          </div>
          <section className="network-notice">
            <div className={`notice-icon ${disrupted ? "warn" : ""}`}>
              <Flag size={18} />
            </div>
            <div>
              <strong>
                {disrupted
                  ? `Service ${service.status === "suspended" ? "interrompu" : "perturbé"} sur la ligne ${p.selected.id}`
                  : "Un trajet plus fiable, ensemble."}
              </strong>
              <p>
                {disrupted
                  ? incidents[0]?.description || service.note
                  : "Un retard, un bus plein ? Votre signalement aide les autres voyageurs."}
              </p>
            </div>
            {disrupted && (
              <button className="text-button" onClick={p.onPlan}>
                Voir une alternative <ArrowUpRight size={15} />
              </button>
            )}
            <button className="secondary-button" onClick={p.onReport}>
              <Flag size={15} /> Signaler un incident
            </button>
          </section>
        </>
      )}
    </>
  );
}
