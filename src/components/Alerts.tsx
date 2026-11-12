import {
  Bell,
  Check,
  Clock3,
  Flag,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import {
  activeReports,
  arrivalMinutes,
  type Line,
  type Report,
  type Vehicle,
} from "../data";
import { Empty, LineBadge } from "./UI";
export default function Alerts({
  lines,
  reports,
  now,
  alertLines,
  vehicles,
  onToggle,
  onLine,
  onReport,
}: {
  lines: Line[];
  reports: Report[];
  now: number;
  alertLines: string[];
  vehicles: Vehicle[];
  onToggle: (id: string) => void;
  onLine: (id: string) => void;
  onReport: () => void;
}) {
  const active = activeReports(reports, now);
  return (
    <div className="alerts-layout">
      <section>
        <div className="section-heading">
          <h2>Sur le réseau</h2>
          <button className="secondary-button" onClick={onReport}>
            <Flag size={16} /> Signaler
          </button>
        </div>
        {active.length === 0 && (
          <div className="card">
            <Empty
              title="Aucun signalement actif"
              text="Les signalements disparaissent au bout d’une heure pour garder l’information à jour."
            />
          </div>
        )}
        {active.map((report) => {
          const line = lines.find((l) => l.id === report.lineId);
          return (
            <article key={report.id} className="card alert-card">
              <div className="alert-symbol">
                <TriangleAlert size={21} />
              </div>
              <div className="alert-body">
                <div className="alert-title">
                  <h3>{report.type}</h3>
                  <span className={`verification ${report.status}`}>
                    {report.status === "verified" ? (
                      <ShieldCheck size={13} />
                    ) : (
                      <Clock3 size={13} />
                    )}
                    {report.status === "verified"
                      ? "Vérifié en démo"
                      : "À vérifier"}
                  </span>
                </div>
                <p>
                  {report.description ||
                    "Un voyageur a signalé une perturbation sur cette ligne."}
                </p>
                <div className="alert-meta">
                  {line && (
                    <button
                      className="inline-route text-button"
                      onClick={() => onLine(line.id)}
                    >
                      <LineBadge line={line} small />
                      {line.name}
                    </button>
                  )}
                  <span>
                    Il y a{" "}
                    {Math.max(0, Math.floor((now - report.createdAt) / 60000))}{" "}
                    min · expire dans{" "}
                    {Math.ceil((3_600_000 - now + report.createdAt) / 60000)}{" "}
                    min
                  </span>
                </div>
              </div>
            </article>
          );
        })}
        <p className="data-disclaimer">
          Signalements de démonstration. Une déclaration en attente n’est pas
          une information confirmée.
        </p>
      </section>
      <aside
        className="card subscriptions"
        aria-label="Alertes d’approche par ligne"
      >
        <span className="large-soft-icon">
          <Bell size={25} />
        </span>
        <h2>Gardez une longueur d’avance.</h2>
        <p>
          Activez une alerte d’approche sur vos lignes. Elle s’affiche
          uniquement dans cette application.
        </p>
        {lines.map((line) => {
          const enabled = alertLines.includes(line.id);
          const near = vehicles.some(
            (v) =>
              v.lineId === line.id &&
              line.stops.some((_, index) => {
                const eta = arrivalMinutes(v, index, now);
                return eta !== null && eta <= 3;
              }),
          );
          return (
            <div key={line.id} className="subscription-row">
              <LineBadge line={line} small />
              <div>
                <strong>{line.name.split(" → ")[1]}</strong>
                <small>
                  {enabled && near
                    ? "Un bus approche d’un arrêt (simulation)"
                    : enabled
                      ? "Alerte d’approche activée"
                      : "Alerte désactivée"}
                </small>
              </div>
              <button
                role="switch"
                aria-checked={enabled}
                aria-label={`Alerte ligne ${line.id}`}
                className={`switch ${enabled ? "on" : ""}`}
                onClick={() => onToggle(line.id)}
              >
                <span>{enabled && <Check size={10} />}</span>
              </button>
            </div>
          );
        })}
        <div className="info-note">
          Aucune notification système ni SMS ne sera envoyé.
        </div>
      </aside>
    </div>
  );
}
