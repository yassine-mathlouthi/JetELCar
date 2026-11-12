import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowRight,
  Bell,
  BusFront,
  Check,
  CircleHelp,
  Compass,
  Flag,
  Heart,
  LayoutDashboard,
  MapPin,
  Navigation,
  Radio,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import {
  activeReports,
  arrivalMinutes,
  createReports,
  createVehicles,
  crowdLabels,
  initialLines,
  reportTypes,
  type Crowd,
  type Line,
  type Report,
  type Vehicle,
} from "./data";
import { useLocalStorage } from "./hooks";
import Passenger from "./components/Passenger";
import Journeys from "./components/Journeys";
import Alerts from "./components/Alerts";
import { Admin, Driver } from "./components/Operations";
import { Modal } from "./components/UI";
import "./styles.css";
type Page =
  "network" | "journeys" | "favorites" | "alerts" | "driver" | "admin";
const pages: Record<Page, { title: string; subtitle: string }> = {
  network: {
    title: "Moins d’attente. Plus de repères.",
    subtitle: "Retrouvez votre ligne et préparez votre prochain départ.",
  },
  journeys: {
    title: "Votre destination. Vos options.",
    subtitle:
      "Trouvez un trajet direct ou une correspondance dans le Grand Tunis.",
  },
  favorites: {
    title: "Vos lignes, tout simplement.",
    subtitle: "Retrouvez les trajets qui font partie de votre quotidien.",
  },
  alerts: {
    title: "Gardez le fil de votre trajet.",
    subtitle: "Les perturbations du réseau et vos alertes, au même endroit.",
  },
  driver: {
    title: "À bord du réseau.",
    subtitle: "Un espace de simulation pour les conducteurs.",
  },
  admin: {
    title: "Un réseau bien accompagné.",
    subtitle: "Supervisez les lignes, les véhicules et les contributions.",
  },
};
const navItems = [
  { id: "network", label: "Vue du réseau", icon: LayoutDashboard },
  { id: "journeys", label: "Mes itinéraires", icon: Navigation },
  { id: "favorites", label: "Mes favoris", icon: Heart },
  { id: "alerts", label: "Alertes & infos", icon: Bell },
] as const;
function pageFromHash(): Page {
  const id = location.hash.slice(1);
  return Object.hasOwn(pages, id) ? (id as Page) : "network";
}
export default function App() {
  const [page, setPage] = useState<Page>(pageFromHash);
  const [lines, setLines] = useLocalStorage<Line[]>(
    "jec-lines-v1",
    initialLines,
  );
  const [vehicles, setVehicles] = useLocalStorage<Vehicle[]>(
    "jec-vehicles-v1",
    createVehicles,
  );
  const [reports, setReports] = useLocalStorage<Report[]>(
    "jec-reports-v1",
    createReports,
  );
  const [favorites, setFavorites] = useLocalStorage<string[]>(
    "jec-favorites-v1",
    [],
  );
  const [alertLines, setAlertLines] = useLocalStorage<string[]>(
    "jec-alerts-v1",
    [],
  );
  const [selectedId, setSelectedId] = useState("2");
  const selected = lines.find((l) => l.id === selectedId) ?? lines[0];
  const [stop, setStop] = useState("passage");
  const stopId = selected.stops.includes(stop)
    ? stop
    : selected.stops[Math.min(2, selected.stops.length - 1)];
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const [modal, setModal] = useState<
    "report" | "help" | "reset" | "crowd" | null
  >(null);
  const [crowdVehicle, setCrowdVehicle] = useState("");
  const [reportLine, setReportLine] = useState(selected.id);
  const [reportType, setReportType] = useState(reportTypes[0]);
  const [description, setDescription] = useState("");
  const [crowd, setCrowd] = useState<Crowd>("low");
  const [crowdVotes, setCrowdVotes] = useLocalStorage<Record<string, number>>(
    "jec-votes-v1",
    {},
  );
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const onHash = () => setPage(pageFromHash());
    const onOnline = () => setOnline(navigator.onLine);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const timer = setInterval(
      () =>
        setVehicles((vs) =>
          vs.map((v) => {
            const line = lines.find((l) => l.id === v.lineId);
            return v.running && line
              ? {
                  ...v,
                  progress:
                    v.progress + 0.025 >= line.stops.length - 1
                      ? 0
                      : v.progress + 0.025,
                  updatedAt: Date.now(),
                }
              : v;
          }),
        ),
      5000,
    );
    return () => clearInterval(timer);
  }, [lines, setVehicles]);
  useEffect(() => () => clearTimeout(toastTimeout.current), []);
  function toast(text: string) {
    setMessage(text);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setMessage(""), 4500);
  }
  function navigate(id: Page) {
    location.hash = id;
    setPage(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function selectLine(id: string) {
    setSelectedId(id);
    const line = lines.find((l) => l.id === id)!;
    setStop(line.stops[Math.min(2, line.stops.length - 1)]);
  }
  function toggleFavorite(id: string) {
    setFavorites((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
    toast(
      favorites.includes(id)
        ? "Ligne retirée des favoris"
        : "Ligne ajoutée aux favoris",
    );
  }
  function toggleAlert(id: string) {
    setAlertLines((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
    toast(
      alertLines.includes(id)
        ? "Alerte d’approche désactivée"
        : "Alerte d’approche activée dans l’application",
    );
  }
  function openReport() {
    setReportLine(selected.id);
    setReportType(reportTypes[0]);
    setDescription("");
    setModal("report");
  }
  function submitReport(e: FormEvent) {
    e.preventDefault();
    setReports((rs) => [
      {
        id: crypto.randomUUID(),
        lineId: reportLine,
        type: reportType,
        description: description.trim(),
        createdAt: Date.now(),
        status: "pending",
      },
      ...rs,
    ]);
    setModal(null);
    toast("Signalement envoyé · en attente de vérification");
  }
  function submitCrowd(e: FormEvent) {
    e.preventDefault();
    if (Date.now() - (crowdVotes[crowdVehicle] ?? 0) < 60_000) {
      toast("Vous avez déjà contribué. Réessayez dans une minute.");
      return;
    }
    setVehicles((vs) =>
      vs.map((v) => {
        if (v.id !== crowdVehicle) return v;
        const levels: Crowd[] = ["low", "medium", "high"];
        const oldVotes = now - v.crowdAt < 900_000 ? v.contributions : 0;
        const oldScore = Math.max(0, levels.indexOf(v.crowd));
        const average = Math.round(
          (oldScore * oldVotes + levels.indexOf(crowd)) / (oldVotes + 1),
        );
        return {
          ...v,
          crowd: levels[average],
          contributions: oldVotes + 1,
          crowdAt: Date.now(),
        };
      }),
    );
    setCrowdVotes((vs) => ({ ...vs, [crowdVehicle]: Date.now() }));
    setModal(null);
    toast("Affluence enregistrée. Merci pour votre contribution.");
  }
  const active = activeReports(reports, now);
  const near =
    alertLines.includes(selected.id) &&
    vehicles.some((v) => {
      const eta =
        v.lineId === selected.id
          ? arrivalMinutes(v, selected.stops.indexOf(stopId), now)
          : null;
      return eta !== null && eta <= 3;
    });
  const operations = {
    lines,
    setLines,
    vehicles,
    setVehicles,
    reports,
    setReports,
    now,
    toast,
  };
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        Aller au contenu
      </a>
      <aside
        className="sidebar"
        aria-label="Navigation et espaces de démonstration"
      >
        <a
          href="#network"
          className="brand"
          onClick={() => navigate("network")}
        >
          <span className="brand-symbol">
            <BusFront size={25} strokeWidth={2} />
          </span>
          <span>
            jet el car<span className="brand-period">.</span>
            <small>LE GRAND TUNIS, EN MOUVEMENT</small>
          </span>
        </a>
        <div className="nav-label">VOTRE QUOTIDIEN</div>
        <nav className="main-nav" aria-label="Navigation principale">
          {navItems.map(({ id, label, icon: Icon }) => (
            <a
              href={`#${id}`}
              key={id}
              className={page === id ? "active" : ""}
              aria-current={page === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "alerts" && active.length > 0 && (
                <span className="nav-count">{active.length}</span>
              )}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-icon">
              <Radio size={19} />
            </span>
            <strong>Un aperçu du prochain départ.</strong>
            <p>Explorez le réseau avec des données de démonstration.</p>
            <span className="demo-live">
              <span
                className={`status-dot ${vehicles.some((v) => v.running) ? "" : "paused"}`}
              />
              {vehicles.some((v) => v.running)
                ? "Simulation active"
                : "Simulation en pause"}
            </span>
          </div>
          <div className="nav-label">ESPACES DE DÉMONSTRATION</div>
          <nav className="secondary-nav" aria-label="Espaces de démonstration">
            <a
              href="#driver"
              className={page === "driver" ? "active" : ""}
              onClick={() => navigate("driver")}
            >
              <BusFront size={17} /> Espace conducteur
            </a>
            <a
              href="#admin"
              className={page === "admin" ? "active" : ""}
              onClick={() => navigate("admin")}
            >
              <Settings2 size={17} /> Administration
            </a>
            <button onClick={() => setModal("help")}>
              <CircleHelp size={17} /> Aide & à propos
            </button>
          </nav>
          <div className="sidebar-footer">
            <span className="tunisia-dot" /> Pensé pour Tunis <span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            Mobilité urbaine <span>/</span>
            <strong>
              {page === "network"
                ? "Vue du réseau"
                : page === "driver"
                  ? "Conducteur"
                  : page === "admin"
                    ? "Administration"
                    : navItems.find((n) => n.id === page)?.label}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="region">
              <MapPin size={15} /> Grand Tunis
            </span>
            <span className="topbar-divider" />
            <button
              className="notification-button icon-button"
              aria-label="Consulter les alertes"
              onClick={() => navigate("alerts")}
            >
              <Bell size={19} />
              {active.length > 0 && <i />}
            </button>
            <button
              className="avatar"
              aria-label="À propos de ce profil voyageur démo"
              onClick={() => setModal("help")}
            >
              V
            </button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1}>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="small-line" />{" "}
                {page === "network" || page === "favorites"
                  ? "BOUGEZ L’ESPRIT TRANQUILLE"
                  : "JET EL CAR · GRAND TUNIS"}
              </div>
              <h1>{pages[page].title}</h1>
              <p>{pages[page].subtitle}</p>
            </div>
            <div className="heading-tag">
              <span className="status-dot" /> Données simulées{" "}
              <span className="tag-divider" />{" "}
              <time>
                {new Intl.DateTimeFormat("fr-TN", {
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(now)}
              </time>
            </div>
          </div>
          {!online && (
            <div role="status" className="offline-banner">
              Vous êtes hors connexion. Les données de démonstration restent
              disponibles ; le fond de carte peut manquer.
            </div>
          )}
          {near && (page === "network" || page === "favorites") && (
            <div className="approach-banner" role="status">
              <Bell size={17} /> Un bus de la ligne {selected.id} approche de
              votre arrêt · estimation simulée inférieure à 4 min.
            </div>
          )}
          {(page === "network" || page === "favorites") && (
            <Passenger
              lines={lines}
              vehicles={vehicles}
              reports={reports}
              now={now}
              selected={selected}
              selectLine={selectLine}
              stopId={stopId}
              setStopId={setStop}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onReport={openReport}
              onCrowd={(id) => {
                setCrowdVehicle(id);
                setCrowd("low");
                setModal("crowd");
              }}
              onPlan={() => navigate("journeys")}
              onAlert={toggleAlert}
              alertLines={alertLines}
              favoritesOnly={page === "favorites"}
            />
          )}
          {page === "journeys" && (
            <Journeys
              lines={lines}
              reports={reports}
              now={now}
              onFollow={(id, stop) => {
                selectLine(id);
                setStop(stop);
                navigate("network");
              }}
            />
          )}
          {page === "alerts" && (
            <Alerts
              lines={lines}
              reports={reports}
              now={now}
              alertLines={alertLines}
              vehicles={vehicles}
              onToggle={toggleAlert}
              onLine={(id) => {
                selectLine(id);
                navigate("network");
              }}
              onReport={openReport}
            />
          )}
          {page === "driver" && <Driver {...operations} />}
          {page === "admin" && <Admin {...operations} />}
          <footer className="page-footer">
            <span>
              © {new Date(now).getFullYear()} Jet El Car <span>·</span> Votre
              trajet, simplement.
            </span>
            <button onClick={() => setModal("help")}>
              Prototype indépendant <ArrowRight size={12} />
            </button>
          </footer>
        </main>
      </div>
      <div className="toast-region" role="status" aria-live="polite">
        {message && (
          <div className="toast">
            <Check size={17} />
            <span>{message}</span>
            <button
              aria-label="Fermer le message"
              onClick={() => setMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
      {modal === "report" && (
        <Modal title="Signaler un incident" onClose={() => setModal(null)}>
          <p>
            Partagez une information utile aux voyageurs. Elle restera visible
            pendant une heure, sauf modération.
          </p>
          <form onSubmit={submitReport}>
            <label className="field-label" htmlFor="report-line">
              Ligne concernée
            </label>
            <select
              id="report-line"
              value={reportLine}
              onChange={(e) => setReportLine(e.target.value)}
            >
              {lines.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.id} · {l.name}
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="report-type">
              Type d’incident
            </label>
            <select
              id="report-type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypes.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <label className="field-label" htmlFor="report-description">
              Description <span className="muted">(facultatif)</span>
            </label>
            <textarea
              id="report-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="Précisez le lieu et ce que vous avez constaté. Évitez toute donnée personnelle."
            />
            <div className="info-note">
              <ShieldCheck size={16} /> Votre signalement sera affiché comme « À
              vérifier ».
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button className="primary-button">
                <Flag size={16} /> Envoyer le signalement
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "crowd" && (
        <Modal title="Comment est votre bus ?" onClose={() => setModal(null)}>
          <p>
            Votre estimation aide les autres voyageurs à préparer leur trajet.
            Véhicule : <strong>{crowdVehicle}</strong>.
          </p>
          <form onSubmit={submitCrowd}>
            <fieldset className="crowd-options">
              <legend className="field-label">Affluence observée</legend>
              {(["low", "medium", "high"] as const).map((level) => (
                <label
                  key={level}
                  className={crowd === level ? "selected" : ""}
                >
                  <input
                    type="radio"
                    name="crowd"
                    value={level}
                    checked={crowd === level}
                    onChange={() => setCrowd(level)}
                  />
                  <Users size={21} />
                  <span>{crowdLabels[level]}</span>
                </label>
              ))}
            </fieldset>
            <p className="info-note">
              Les avis récents sont regroupés. En dessous de deux contributions,
              l’affluence reste inconnue. Un avis par véhicule et par minute.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setModal(null)}
              >
                Annuler
              </button>
              <button
                className="primary-button"
                disabled={now - (crowdVotes[crowdVehicle] ?? 0) < 60_000}
              >
                {now - (crowdVotes[crowdVehicle] ?? 0) < 60_000
                  ? `Réessayer dans ${Math.ceil((60_000 - now + crowdVotes[crowdVehicle]) / 1000)} s`
                  : "Partager l’affluence"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Bienvenue dans Jet El Car" onClose={() => setModal(null)}>
          <p>
            Une exploration de Smart Transport Tunis : moins d’incertitude dans
            les transports du Grand Tunis.
          </p>
          <div className="help-list">
            <div>
              <Compass size={22} />
              <p>
                <strong>Explorez, puis préparez votre trajet.</strong>
                <br />
                Choisissez une ligne et un arrêt, consultez les positions
                simulées ou cherchez une correspondance.
              </p>
            </div>
            <div>
              <Radio size={22} />
              <p>
                <strong>
                  Une démonstration, pas un service en temps réel.
                </strong>
                <br />
                Lignes, horaires, GPS et durées sont fictifs. La carte nécessite
                Internet. Aucune position personnelle n’est collectée.
              </p>
            </div>
            <div>
              <ShieldCheck size={22} />
              <p>
                <strong>Vos essais restent dans ce navigateur.</strong>
                <br />
                Favoris, signalements et modifications sont conservés
                localement. Aucun compte réel, aucune API transport.
              </p>
            </div>
          </div>
          <button
            className="secondary-button"
            onClick={() => setModal("reset")}
          >
            <RotateCcw size={16} /> Réinitialiser la démonstration
          </button>
        </Modal>
      )}
      {modal === "reset" && (
        <Modal
          title="Recommencer la démonstration ?"
          onClose={() => setModal(null)}
        >
          <p>
            Cette action efface les favoris, alertes, contributions et
            modifications locales du réseau.
          </p>
          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setModal(null)}>
              Annuler
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setLines(initialLines);
                setVehicles(createVehicles());
                setReports(createReports());
                setFavorites([]);
                setAlertLines([]);
                setCrowdVotes({});
                setSelectedId("2");
                setStop("passage");
                setModal(null);
                navigate("network");
                toast("Démonstration réinitialisée");
              }}
            >
              Réinitialiser
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
