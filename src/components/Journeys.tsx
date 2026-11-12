import { useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Check,
  Clock3,
  Footprints,
  MapPin,
  Navigation,
  TriangleAlert,
} from "lucide-react";
import {
  activeReports,
  modeLabels,
  serviceFor,
  planJourneys,
  type Direction,
  type Mode,
  stops,
  stopById,
  type Line,
  type Report,
} from "../data";
import { Empty, LineBadge, ModeIcon, StatusBadge } from "./UI";
export default function Journeys({
  lines,
  reports,
  now,
  onFollow,
}: {
  lines: Line[];
  reports: Report[];
  now: number;
  onFollow: (id: string, stop: string, direction: Direction) => void;
}) {
  const [from, setFrom] = useState("barcelone");
  const [to, setTo] = useState("ariana");
  const [query, setQuery] = useState<{ from: string; to: string } | null>(null);
  const [chosen, setChosen] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode | "all">("all");
  const availableLines = lines
    .filter((l) => mode === "all" || l.mode === mode)
    .map((l) => ({ ...l, status: serviceFor(l, reports, now).status }));
  const journeys = query
    ? planJourneys(availableLines, query.from, query.to)
    : [];
  const suggestions = [
    {
      from: "marine",
      to: "marsa",
      label: "Tunis Marine → La Marsa",
      mode: "TGM",
    },
    {
      from: "barcelone",
      to: "mourouj4",
      label: "Barcelone → El Mourouj 4",
      mode: "M6",
    },
    {
      from: "republique",
      to: "benarous",
      label: "République → Ben Arous",
      mode: "Correspondance",
    },
  ];
  return (
    <div className="journeys-layout">
      <section className="card planner-form">
        <span className="large-soft-icon">
          <Navigation size={26} />
        </span>
        <h2>Où allez-vous ?</h2>
        <p>
          Comparez les trajets du réseau et choisissez celui qui vous convient.
        </p>
        <div
          className="planner-mode-tabs network-mode-tabs"
          role="group"
          aria-label="Modes du trajet"
        >
          {(["all", "bus", "metro", "tgm"] as const).map((value) => (
            <button
              key={value}
              aria-pressed={mode === value}
              className={mode === value ? "active" : ""}
              onClick={() => {
                setMode(value);
                setChosen(null);
              }}
            >
              {value === "all" ? (
                "Tous"
              ) : (
                <>
                  <ModeIcon mode={value} size={13} />
                  {modeLabels[value]}
                </>
              )}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setQuery({ from, to });
            setChosen(null);
          }}
        >
          <label className="field-label" htmlFor="journey-from">
            Départ
          </label>
          <div className="input-with-icon">
            <span className="origin-dot" />
            <select
              id="journey-from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="swap-row">
            <button
              type="button"
              className="icon-button"
              aria-label="Inverser le départ et la destination"
              onClick={() => {
                setFrom(to);
                setTo(from);
                setQuery(null);
              }}
            >
              <ArrowDownUp size={17} />
            </button>
          </div>
          <label className="field-label" htmlFor="journey-to">
            Destination
          </label>
          <div className="input-with-icon">
            <MapPin size={18} />
            <select
              id="journey-to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {stops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <button className="primary-button full" type="submit">
            Rechercher un trajet <ArrowRight size={17} />
          </button>
        </form>
        <div className="info-note">
          Trajets et durées simulés, hors trafic réel. Métro et TGM sont
          couverts dans les deux sens. Les lignes interrompues sont exclues ; un
          retard ajoute 6 min fictives.
        </div>
      </section>
      <section className="journey-results">
        <div className="section-heading">
          <h2>
            {query
              ? "Vos possibilités"
              : "Voyagez avec un peu plus de visibilité."}
          </h2>
          {query && (
            <span className="count-badge">
              {journeys.length} trajet{journeys.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {!query ? (
          <div className="planner-intro card">
            <div className="journey-art">
              <div>
                <span />
                <span />
                <span />
                <span />
              </div>
              <BusIllustration />
            </div>
            <h3>Le bon chemin, sans détour.</h3>
            <p>
              Une ligne directe ou une correspondance : commencez par choisir
              vos deux arrêts.
            </p>
            <div className="journey-suggestions" aria-label="Idées de trajets">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.to}
                  onClick={() => {
                    setFrom(suggestion.from);
                    setTo(suggestion.to);
                    setMode("all");
                    setQuery({ from: suggestion.from, to: suggestion.to });
                    setChosen(null);
                  }}
                >
                  <span>{suggestion.mode}</span>
                  {suggestion.label}
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
            <div className="intro-features">
              <span>
                <Clock3 size={17} /> Durées indicatives
              </span>
              <span>
                <Navigation size={17} /> Correspondances
              </span>
              <span>
                <TriangleAlert size={17} /> Perturbations visibles
              </span>
            </div>
          </div>
        ) : journeys.length === 0 ? (
          <div className="card">
            <Empty
              title={
                query.from === query.to
                  ? "Vous êtes déjà à destination"
                  : "Aucun trajet couvert"
              }
              text={
                query.from === query.to
                  ? "Choisissez deux arrêts différents."
                  : "Aucune liaison disponible avec ces modes et statuts. Essayez Tous les modes ou Tunis Marine → La Marsa Plage."
              }
            />
          </div>
        ) : (
          journeys.map((journey, index) => {
            const affected = activeReports(reports, now).filter((r) =>
              journey.lines.some((l) => l.id === r.lineId),
            );
            return (
              <article
                className={`journey-card card ${chosen === index ? "chosen" : ""}`}
                key={index}
              >
                <div className="section-heading">
                  <span className="journey-label">
                    {index === 0 ? "Le plus rapide" : "Autre possibilité"}
                  </span>
                  <span className="journey-duration">
                    {journey.minutes} <small>min</small>
                  </span>
                </div>
                <div className="journey-lines">
                  <Footprints size={18} /> <span>3 min</span>
                  <Chevron />
                  {journey.lines.map((line, i) => (
                    <span key={line.id} className="inline-route">
                      <ModeIcon mode={line.mode} size={16} />
                      <LineBadge line={line} />
                      {i < journey.lines.length - 1 && <Chevron />}
                    </span>
                  ))}
                  <ArrowRight size={18} />
                  <MapPin size={18} />
                </div>
                <h3>
                  {journey.transfer
                    ? `Correspondance à ${stopById(journey.transfer).name}`
                    : "Trajet direct, sans correspondance"}
                </h3>
                <p>
                  {stopById(query.from).name} → {stopById(query.to).name}
                </p>
                <div className="journey-service-status">
                  {journey.lines.map((line) => (
                    <span key={line.id}>
                      {line.id} <StatusBadge status={line.status} />
                    </span>
                  ))}
                </div>
                {affected.length > 0 && (
                  <div className="inline-warning">
                    <TriangleAlert size={15} /> {affected.length} signalement
                    {affected.length > 1 ? "s" : ""} sur ce trajet ·{" "}
                    {affected[0].type}
                  </div>
                )}
                <button
                  className="secondary-button"
                  onClick={() => setChosen(chosen === index ? null : index)}
                >
                  {chosen === index ? (
                    <Check size={16} />
                  ) : (
                    <Navigation size={16} />
                  )}
                  {chosen === index ? "Masquer les étapes" : "Voir les étapes"}
                </button>
                {chosen === index && (
                  <div className="journey-steps">
                    {journey.segments.map((segment, i) => (
                      <div key={i}>
                        <LineBadge line={segment.line} small />
                        <p>
                          Montez à{" "}
                          <strong>{stopById(segment.from).name}</strong>
                          <br />
                          Descendez à{" "}
                          <strong>{stopById(segment.to).name}</strong>
                        </p>
                        <button
                          className="text-button"
                          onClick={() =>
                            onFollow(
                              segment.line.id,
                              segment.from,
                              segment.direction,
                            )
                          }
                        >
                          Suivre la ligne <ArrowRight size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
function Chevron() {
  return <ArrowRight size={15} className="muted" />;
}
function BusIllustration() {
  return (
    <svg
      width="160"
      height="85"
      viewBox="0 0 160 85"
      fill="none"
      aria-hidden="true"
    >
      <rect x="20" y="15" width="120" height="54" rx="10" fill="#245be0" />
      <path d="M30 27h96v23H30z" fill="#dce8ff" />
      <path d="M62 27v23m31-23v23" stroke="#245be0" strokeWidth="4" />
      <circle cx="46" cy="69" r="9" fill="#182a3b" />
      <circle cx="116" cy="69" r="9" fill="#182a3b" />
      <path
        d="M128 57h5M26 57h6"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
