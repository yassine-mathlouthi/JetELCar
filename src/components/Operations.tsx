import { useState, type Dispatch, type SetStateAction } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BusFront,
  Check,
  CirclePause,
  Flag,
  LockKeyhole,
  LogOut,
  MapPin,
  Pencil,
  Play,
  Plus,
  Radio,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import {
  activeReports,
  isFresh,
  modeLabels,
  serviceFor,
  stops,
  type Mode,
  type ServiceStatus,
  type Line,
  type Vehicle,
  type Report,
} from "../data";
import { Empty, LineBadge, Modal, ModeIcon, StatusBadge } from "./UI";
type Props = {
  lines: Line[];
  setLines: Dispatch<SetStateAction<Line[]>>;
  vehicles: Vehicle[];
  setVehicles: Dispatch<SetStateAction<Vehicle[]>>;
  reports: Report[];
  setReports: Dispatch<SetStateAction<Report[]>>;
  now: number;
  toast: (message: string) => void;
};
export function Driver({
  lines,
  vehicles,
  setVehicles,
  setReports,
  reports,
  now,
  toast,
}: Props) {
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id ?? "");
  const [connected, setConnected] = useState(false);
  const [breakdown, setBreakdown] = useState(false);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const line = lines.find((l) => l.id === vehicle?.lineId);
  const suspended = line
    ? serviceFor(line, reports, now).status === "suspended"
    : false;
  return (
    <div className="driver-layout">
      <section className="card driver-console">
        <div className="section-heading">
          <span className="large-soft-icon">
            <BusFront size={26} />
          </span>
          <span className="demo-tag">SIMULATEUR</span>
        </div>
        <h2>Espace conducteur</h2>
        <p>
          Testez l’envoi des positions d’un véhicule. Aucun accès à votre GPS
          réel.
        </p>
        <label className="field-label" htmlFor="driver-vehicle">
          Véhicule de démonstration
        </label>
        <select
          id="driver-vehicle"
          value={vehicleId}
          disabled={connected}
          onChange={(e) => setVehicleId(e.target.value)}
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.id} · Ligne {v.lineId}
            </option>
          ))}
        </select>
        {!connected ? (
          <button
            className="primary-button full"
            disabled={!vehicle}
            onClick={() => {
              setConnected(true);
              toast("Session de démonstration ouverte");
            }}
          >
            <Radio size={17} /> Ouvrir la session démo
          </button>
        ) : (
          <>
            <div className="driver-status">
              <span
                className={`status-dot ${vehicle?.running ? "" : "paused"}`}
              />
              <strong>
                {suspended
                  ? "Service interrompu · simulation arrêtée"
                  : vehicle?.running
                    ? "Simulation en cours"
                    : "Envoi des positions arrêté"}
              </strong>
              <span>Connexion locale</span>
            </div>
            <div className="driver-buttons">
              <button
                disabled={suspended && !vehicle?.running}
                className={
                  vehicle?.running ? "secondary-button" : "primary-button"
                }
                onClick={() => {
                  setVehicles((vs) =>
                    vs.map((v) =>
                      v.id === vehicleId
                        ? {
                            ...v,
                            running: !v.running,
                            updatedAt: !v.running ? Date.now() : v.updatedAt,
                          }
                        : v,
                    ),
                  );
                  toast(
                    vehicle?.running
                      ? "Envoi simulé arrêté"
                      : "Envoi simulé démarré",
                  );
                }}
              >
                {vehicle?.running ? (
                  <CirclePause size={18} />
                ) : (
                  <Play size={18} />
                )}
                {vehicle?.running ? "Arrêter l’envoi" : "Démarrer l’envoi"}
              </button>
              <button
                className="secondary-button danger-text"
                onClick={() => setBreakdown(true)}
              >
                <Flag size={17} /> Signaler une panne
              </button>
            </div>
            <button
              className="text-button"
              onClick={() => {
                setConnected(false);
                setVehicles((vs) =>
                  vs.map((v) =>
                    v.id === vehicleId ? { ...v, running: false } : v,
                  ),
                );
                toast("Session fermée et envoi arrêté");
              }}
            >
              <LogOut size={15} /> Fermer la session
            </button>
          </>
        )}
      </section>
      <section className="card driver-telemetry">
        <div className="section-heading">
          <h2>État du véhicule</h2>
          <Activity size={18} />
        </div>
        {vehicle && line ? (
          <>
            <div className="telemetry-vehicle">
              <ModeIcon mode={line.mode} size={45} />
              <div>
                <strong>{vehicle.id}</strong>
                <p>
                  Ligne <LineBadge line={line} small /> {line.name}
                </p>
              </div>
            </div>
            <dl className="telemetry-list">
              <div>
                <dt>Sens de circulation</dt>
                <dd>
                  Vers{" "}
                  {
                    stops.find(
                      (s) =>
                        s.id ===
                        (vehicle.direction === 1
                          ? line.stops.at(-1)
                          : line.stops[0]),
                    )?.name
                  }
                </dd>
              </div>
              <div>
                <dt>Service (démo)</dt>
                <dd>
                  <StatusBadge status={serviceFor(line, reports, now).status} />
                </dd>
              </div>
              <div>
                <dt>Source de position</dt>
                <dd>Simulée</dd>
              </div>
              <div>
                <dt>Fraîcheur GPS</dt>
                <dd>
                  {isFresh(vehicle, now)
                    ? "Position récente"
                    : "Position ancienne"}
                </dd>
              </div>
              <div>
                <dt>Dernière mise à jour</dt>
                <dd>
                  Il y a{" "}
                  {Math.max(0, Math.floor((now - vehicle.updatedAt) / 1000))} s
                </dd>
              </div>
              <div>
                <dt>Progression sur la ligne</dt>
                <dd>
                  {Math.round(
                    (vehicle.progress / (line.stops.length - 1)) * 100,
                  )}{" "}
                  %
                </dd>
              </div>
              <div>
                <dt>Prochain arrêt</dt>
                <dd>
                  {
                    stops.find(
                      (s) =>
                        s.id ===
                        line.stops[
                          Math.min(
                            vehicle.direction === 1
                              ? Math.ceil(vehicle.progress)
                              : Math.floor(vehicle.progress),
                            line.stops.length - 1,
                          )
                        ],
                    )?.name
                  }
                </dd>
              </div>
            </dl>
            <div className="info-note">
              Les véhicules actifs avancent toutes les 5 secondes. Après 2
              minutes sans mise à jour, les estimations d’arrivée sont masquées.
            </div>
          </>
        ) : (
          <Empty
            title="Aucun véhicule"
            text="Ajoutez un véhicule depuis l’administration pour commencer."
          />
        )}
      </section>
      {breakdown && vehicle && (
        <Modal title="Signaler une panne" onClose={() => setBreakdown(false)}>
          <p>
            Le véhicule {vehicle.id} sera arrêté dans le simulateur et un
            signalement sera créé pour la ligne {vehicle.lineId}.
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setBreakdown(false)}
            >
              Annuler
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setVehicles((vs) =>
                  vs.map((v) =>
                    v.id === vehicleId ? { ...v, running: false } : v,
                  ),
                );
                setReports((rs) => [
                  {
                    id: crypto.randomUUID(),
                    lineId: vehicle.lineId,
                    type:
                      line?.mode === "bus"
                        ? "Bus en panne"
                        : "Véhicule en panne",
                    description: `Panne déclarée depuis le simulateur conducteur (${vehicle.id}).`,
                    createdAt: Date.now(),
                    status: "pending",
                  },
                  ...rs,
                ]);
                setBreakdown(false);
                toast("Panne signalée · en attente de vérification");
              }}
            >
              Confirmer la panne
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function Admin(p: Props) {
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"reports" | "network" | "vehicles">("reports");
  const [editing, setEditing] = useState<Line | null>(null);
  const [addingVehicle, setAddingVehicle] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    kind: "line" | "vehicle";
    id: string;
  } | null>(null);
  const [newVehicleId, setNewVehicleId] = useState("");
  const [newVehicleLine, setNewVehicleLine] = useState(p.lines[0]?.id ?? "");
  if (!authenticated)
    return (
      <section className="card admin-login">
        <span className="large-soft-icon">
          <LockKeyhole size={26} />
        </span>
        <h2>Administration du réseau</h2>
        <p>Un espace pour tester la supervision et la modération.</p>
        <div className="info-note">
          Accès de démonstration uniquement. Ce code public ne constitue pas une
          authentification sécurisée.
          <br />
          <strong>Code : JET2026</strong>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (code === "JET2026") {
              setAuthenticated(true);
              setError("");
            } else
              setError(
                "Code incorrect. Utilisez JET2026 pour la démonstration.",
              );
          }}
        >
          <label className="field-label" htmlFor="admin-code">
            Code de démonstration
          </label>
          <input
            id="admin-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            required
            aria-describedby={error ? "code-error" : undefined}
            aria-invalid={!!error}
          />
          {error && (
            <p id="code-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          <button className="primary-button full">
            Ouvrir l’administration
          </button>
        </form>
      </section>
    );
  const active = activeReports(p.reports, p.now);
  function moderate(id: string, status: Report["status"]) {
    p.setReports((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    p.toast(
      status === "verified" ? "Signalement validé" : "Signalement écarté",
    );
  }
  return (
    <div className="admin-page">
      <div className="admin-overview">
        <div className="card">
          <BusFront />
          <strong>{p.vehicles.length}</strong>
          <span>Véhicules simulés</span>
        </div>
        <div className="card">
          <Radio />
          <strong>{p.vehicles.filter((v) => isFresh(v, p.now)).length}</strong>
          <span>Positions récentes</span>
        </div>
        <div className="card">
          <Flag />
          <strong>{active.filter((r) => r.status === "pending").length}</strong>
          <span>Signalements à vérifier</span>
        </div>
        <div className="card">
          <MapPin />
          <strong>{p.lines.length}</strong>
          <span>Lignes enregistrées</span>
        </div>
      </div>
      <section className="card admin-table">
        <div className="admin-toolbar">
          <div className="tabs" role="tablist" aria-label="Administration">
            {(
              [
                ["reports", "Modération"],
                ["network", "Lignes & arrêts"],
                ["vehicles", "Véhicules"],
              ] as const
            ).map(([id, label]) => (
              <button
                role="tab"
                aria-selected={tab === id}
                key={id}
                className={tab === id ? "active" : ""}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            className="text-button"
            onClick={() => setAuthenticated(false)}
          >
            <LogOut size={15} /> Quitter
          </button>
        </div>
        {tab === "reports" && (
          <>
            <div className="table-caption">
              <h2>Signalements actifs</h2>
              <span>Expiration automatique après 60 min</span>
            </div>
            {active.length === 0 ? (
              <Empty
                title="Tout est à jour"
                text="Aucun signalement à modérer."
              />
            ) : (
              active.map((r) => (
                <div className="moderation-row" key={r.id}>
                  <div>
                    <span className="eyebrow">
                      LIGNE {r.lineId} ·{" "}
                      {r.status === "verified" ? "VÉRIFIÉ" : "À VÉRIFIER"}
                    </span>
                    <h3>{r.type}</h3>
                    <p>{r.description || "Sans description"}</p>
                  </div>
                  <div className="row-actions">
                    {r.status !== "verified" && (
                      <button
                        className="secondary-button"
                        onClick={() => moderate(r.id, "verified")}
                      >
                        <ShieldCheck size={15} /> Valider
                      </button>
                    )}
                    <button
                      className="icon-button danger-text"
                      aria-label={`Écarter ${r.type} ligne ${r.lineId}`}
                      onClick={() => moderate(r.id, "dismissed")}
                    >
                      <X size={18} />
                    </button>
                    <button
                      className="text-button"
                      disabled={
                        !active.some(
                          (other) =>
                            other.id !== r.id &&
                            other.lineId === r.lineId &&
                            other.type === r.type,
                        )
                      }
                      onClick={() => {
                        p.setReports((rs) =>
                          rs.map((other) =>
                            other.id !== r.id &&
                            other.lineId === r.lineId &&
                            other.type === r.type
                              ? { ...other, status: "dismissed" }
                              : other,
                          ),
                        );
                        p.toast("Doublons regroupés sous ce signalement");
                      }}
                    >
                      Regrouper les doublons
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}
        {tab === "network" && (
          <>
            <div className="table-caption">
              <div>
                <h2>Lignes et arrêts desservis</h2>
                <p>
                  Définissez le parcours et l’ordre des arrêts de chaque ligne.
                </p>
              </div>
              <button
                className="primary-button"
                onClick={() =>
                  setEditing({
                    id: "",
                    name: "",
                    color: "#245be0",
                    mode: "bus",
                    status: "normal",
                    statusNote:
                      "Service régulier dans ce scénario de démonstration.",
                    bidirectional: false,
                    stops: ["barcelone", "ariana"],
                    frequency: 15,
                    start: "06:00",
                    end: "22:00",
                  })
                }
              >
                <Plus size={16} /> Ajouter une ligne
              </button>
            </div>
            {p.lines.map((line) => (
              <div className="network-row" key={line.id}>
                <LineBadge line={line} />
                <div>
                  <h3>{line.name}</h3>
                  <p>
                    {modeLabels[line.mode]} · {line.stops.length} arrêts ·{" "}
                    {line.frequency
                      ? `Toutes les ${line.frequency} min`
                      : "Horaires indisponibles"}
                  </p>
                </div>
                <StatusBadge
                  status={serviceFor(line, p.reports, p.now).status}
                />
                <button
                  className="icon-button"
                  aria-label={`Modifier la ligne ${line.id}`}
                  onClick={() =>
                    setEditing({ ...line, stops: [...line.stops] })
                  }
                >
                  <Pencil size={17} />
                </button>
                <button
                  className="icon-button danger-text"
                  disabled={p.lines.length <= 1}
                  aria-label={`Supprimer la ligne ${line.id}`}
                  onClick={() => setDeleteTarget({ kind: "line", id: line.id })}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </>
        )}
        {tab === "vehicles" && (
          <>
            <div className="table-caption">
              <h2>Véhicules autorisés</h2>
              <button
                className="primary-button"
                onClick={() => {
                  setNewVehicleId("");
                  setNewVehicleLine(p.lines[0].id);
                  setError("");
                  setAddingVehicle(true);
                }}
              >
                <Plus size={16} /> Ajouter un véhicule
              </button>
            </div>
            {p.vehicles.map((v) => (
              <div className="network-row" key={v.id}>
                <span className="soft-icon">
                  <ModeIcon
                    mode={p.lines.find((l) => l.id === v.lineId)!.mode}
                    size={20}
                  />
                </span>
                <div>
                  <h3>{v.id}</h3>
                  <p>
                    Ligne {v.lineId} · GPS simulé ·{" "}
                    {isFresh(v, p.now)
                      ? "Position récente"
                      : "Position ancienne"}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  disabled={
                    !v.running &&
                    serviceFor(
                      p.lines.find((l) => l.id === v.lineId)!,
                      p.reports,
                      p.now,
                    ).status === "suspended"
                  }
                  onClick={() =>
                    p.setVehicles((vs) =>
                      vs.map((item) =>
                        item.id === v.id
                          ? {
                              ...item,
                              running: !item.running,
                              updatedAt: !item.running
                                ? Date.now()
                                : item.updatedAt,
                            }
                          : item,
                      ),
                    )
                  }
                >
                  {v.running ? "Suspendre" : "Démarrer"}
                </button>
                <button
                  className="icon-button danger-text"
                  aria-label={`Supprimer ${v.id}`}
                  onClick={() => setDeleteTarget({ kind: "vehicle", id: v.id })}
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
            {p.vehicles.length === 0 && (
              <Empty
                title="Aucun véhicule"
                text="Ajoutez un véhicule pour tester la simulation."
              />
            )}
          </>
        )}
      </section>
      {editing && (
        <LineEditor
          line={editing}
          lines={p.lines}
          onClose={() => setEditing(null)}
          onSave={(line) => {
            const oldId = editing.id;
            p.setLines((ls) =>
              ls.some((l) => l.id === oldId)
                ? ls.map((l) => (l.id === oldId ? line : l))
                : [...ls, line],
            );
            p.setVehicles((vs) =>
              vs.map((v) =>
                v.lineId === oldId
                  ? {
                      ...v,
                      lineId: line.id,
                      direction: line.bidirectional ? v.direction : 1,
                      running: line.status === "suspended" ? false : v.running,
                      progress: Math.min(v.progress, line.stops.length - 1),
                    }
                  : v,
              ),
            );
            setEditing(null);
            p.toast("Ligne et parcours enregistrés");
          }}
        />
      )}
      {addingVehicle && (
        <Modal
          title="Ajouter un véhicule"
          onClose={() => setAddingVehicle(false)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = newVehicleId.trim().toUpperCase();
              if (p.vehicles.some((v) => v.id === id)) {
                setError(
                  "Ce véhicule existe déjà. Choisissez un identifiant unique.",
                );
                return;
              }
              p.setVehicles((vs) => [
                ...vs,
                {
                  id,
                  lineId: newVehicleLine,
                  direction: 1,
                  progress: 0,
                  updatedAt: Date.now(),
                  running: false,
                  crowd: "unknown",
                  contributions: 0,
                  crowdAt: Date.now(),
                },
              ]);
              setAddingVehicle(false);
              p.toast("Véhicule ajouté");
            }}
          >
            <label className="field-label" htmlFor="vehicle-id">
              Identifiant
            </label>
            <input
              id="vehicle-id"
              required
              maxLength={20}
              pattern="[A-Za-z0-9-]+"
              title="Lettres, chiffres et tirets uniquement"
              placeholder="BUS-204"
              value={newVehicleId}
              onChange={(e) => setNewVehicleId(e.target.value)}
            />
            <label className="field-label" htmlFor="vehicle-line">
              Ligne
            </label>
            <select
              id="vehicle-line"
              value={newVehicleLine}
              onChange={(e) => setNewVehicleLine(e.target.value)}
            >
              {p.lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.name}
                </option>
              ))}
            </select>
            {error && (
              <p role="alert" className="form-error">
                {error}
              </p>
            )}
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAddingVehicle(false)}
              >
                Annuler
              </button>
              <button className="primary-button">Ajouter le véhicule</button>
            </div>
          </form>
        </Modal>
      )}
      {deleteTarget && (
        <Modal
          title="Confirmer la suppression"
          onClose={() => setDeleteTarget(null)}
        >
          <p>
            Supprimer{" "}
            {deleteTarget.kind === "line" ? "la ligne" : "le véhicule"}{" "}
            {deleteTarget.id} ?{" "}
            {deleteTarget.kind === "line" &&
              "Les véhicules et signalements associés seront également supprimés."}
          </p>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => setDeleteTarget(null)}
            >
              Annuler
            </button>
            <button
              className="danger-button"
              onClick={() => {
                if (deleteTarget.kind === "line") {
                  p.setLines((ls) =>
                    ls.filter((l) => l.id !== deleteTarget.id),
                  );
                  p.setVehicles((vs) =>
                    vs.filter((v) => v.lineId !== deleteTarget.id),
                  );
                  p.setReports((rs) =>
                    rs.filter((r) => r.lineId !== deleteTarget.id),
                  );
                } else
                  p.setVehicles((vs) =>
                    vs.filter((v) => v.id !== deleteTarget.id),
                  );
                setDeleteTarget(null);
                p.toast("Suppression effectuée");
              }}
            >
              Supprimer
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function LineEditor({
  line,
  lines,
  onSave,
  onClose,
}: {
  line: Line;
  lines: Line[];
  onSave: (line: Line) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(line);
  const [error, setError] = useState("");
  const [addStop, setAddStop] = useState("");
  function move(index: number, offset: number) {
    const ids = [...draft.stops];
    [ids[index], ids[index + offset]] = [ids[index + offset], ids[index]];
    setDraft({ ...draft, stops: ids });
  }
  return (
    <Modal
      title={line.id ? `Modifier la ligne ${line.id}` : "Ajouter une ligne"}
      onClose={onClose}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (lines.some((l) => l.id === draft.id && l.id !== line.id)) {
            setError("Ce numéro de ligne existe déjà.");
            return;
          }
          if (draft.stops.length < 2) {
            setError("Choisissez au moins deux arrêts.");
            return;
          }
          if (draft.start >= draft.end) {
            setError("La fin du service doit être après le début.");
            return;
          }
          onSave({ ...draft, name: draft.name.trim() });
        }}
      >
        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="line-number">
              Numéro
            </label>
            <input
              id="line-number"
              value={draft.id}
              readOnly={!!line.id}
              maxLength={4}
              pattern="[A-Za-z0-9]+"
              required
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="line-color">
              Couleur
            </label>
            <input
              id="line-color"
              type="color"
              value={draft.color}
              onChange={(e) => setDraft({ ...draft, color: e.target.value })}
            />
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="line-mode">
              Mode de transport
            </label>
            <select
              id="line-mode"
              value={draft.mode}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  mode: e.target.value as Mode,
                  bidirectional: e.target.value !== "bus",
                })
              }
            >
              <option value="bus">Bus</option>
              <option value="metro">Métro</option>
              <option value="tgm">TGM</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="line-status">
              Statut du service
            </label>
            <select
              id="line-status"
              value={draft.status}
              onChange={(e) =>
                setDraft({ ...draft, status: e.target.value as ServiceStatus })
              }
            >
              <option value="normal">Service normal</option>
              <option value="delayed">Perturbé</option>
              <option value="suspended">Interrompu</option>
            </select>
          </div>
        </div>
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={draft.bidirectional}
            onChange={(e) =>
              setDraft({ ...draft, bidirectional: e.target.checked })
            }
          />
          Service dans les deux sens
        </label>
        <label className="field-label" htmlFor="line-status-note">
          Message du statut (démo)
        </label>
        <textarea
          id="line-status-note"
          rows={2}
          required
          maxLength={300}
          value={draft.statusNote}
          onChange={(e) => setDraft({ ...draft, statusNote: e.target.value })}
        />
        <label className="field-label" htmlFor="line-name">
          Nom du parcours
        </label>
        <input
          id="line-name"
          value={draft.name}
          required
          pattern=".*\S.*"
          maxLength={80}
          placeholder="Départ → Destination"
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
        <div className="form-grid">
          <div>
            <label className="field-label" htmlFor="line-start">
              Début de service
            </label>
            <input
              id="line-start"
              type="time"
              required
              value={draft.start}
              onChange={(e) => setDraft({ ...draft, start: e.target.value })}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="line-end">
              Fin de service
            </label>
            <input
              id="line-end"
              type="time"
              required
              value={draft.end}
              onChange={(e) => setDraft({ ...draft, end: e.target.value })}
            />
          </div>
        </div>
        <label className="field-label" htmlFor="line-frequency">
          Fréquence indicative (minutes, vide si inconnue)
        </label>
        <input
          id="line-frequency"
          type="number"
          min="1"
          max="180"
          value={draft.frequency ?? ""}
          onChange={(e) =>
            setDraft({
              ...draft,
              frequency: e.target.value ? Number(e.target.value) : null,
            })
          }
        />
        <label className="field-label" htmlFor="add-stop">
          Arrêts desservis · dans l’ordre du trajet
        </label>
        <div className="stop-editor">
          {draft.stops.map((id, i) => (
            <div key={id}>
              <span>
                {i + 1}. {stops.find((s) => s.id === id)?.name}
              </span>
              <button
                type="button"
                className="icon-button"
                disabled={i === 0}
                aria-label={`Monter ${id}`}
                onClick={() => move(i, -1)}
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                disabled={i === draft.stops.length - 1}
                aria-label={`Descendre ${id}`}
                onClick={() => move(i, 1)}
              >
                <ArrowDown size={14} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Retirer ${id}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    stops: draft.stops.filter((s) => s !== id),
                  })
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="add-stop-row">
          <select
            id="add-stop"
            value={addStop}
            onChange={(e) => setAddStop(e.target.value)}
          >
            <option value="">Choisir un arrêt…</option>
            {stops
              .filter((s) => !draft.stops.includes(s.id))
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            className="secondary-button"
            disabled={!addStop}
            onClick={() => {
              setDraft({ ...draft, stops: [...draft.stops, addStop] });
              setAddStop("");
            }}
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Annuler
          </button>
          <button className="primary-button">
            <Check size={16} /> Enregistrer
          </button>
        </div>
      </form>
    </Modal>
  );
}
