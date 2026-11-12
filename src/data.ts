import { initialLines, stops } from "./network";
import type {
  Crowd,
  Direction,
  Line,
  Mode,
  Report,
  ServiceStatus,
  Vehicle,
} from "./types";
export { initialLines, stops } from "./network";
export type {
  Stop,
  Crowd,
  Direction,
  Line,
  Mode,
  Report,
  ServiceStatus,
  Vehicle,
} from "./types";

export const modeLabels: Record<Mode, string> = {
  bus: "Bus",
  metro: "Métro",
  tgm: "TGM",
};
export const statusLabels: Record<ServiceStatus, string> = {
  normal: "Service normal",
  delayed: "Perturbé",
  suspended: "Interrompu",
};
export const directionStops = (line: Line, direction: Direction) =>
  direction === -1 ? [...line.stops].reverse() : line.stops;
export const segmentMinutes = (line: Line) =>
  line.mode === "metro" ? 2 : line.mode === "tgm" ? 3 : 4;
export const stopById = (id: string) => stops.find((s) => s.id === id)!;
export const isFresh = (vehicle: Vehicle, now: number) =>
  now - vehicle.updatedAt <= 120_000;
export const activeReports = (reports: Report[], now: number) =>
  reports.filter(
    (r) => r.status !== "dismissed" && now - r.createdAt < 3_600_000,
  );

export function serviceFor(
  line: Line,
  reports: Report[],
  now: number,
): { status: ServiceStatus; note: string } {
  const verified = activeReports(reports, now).filter(
    (r) => r.lineId === line.id && r.status === "verified",
  );
  const interruption = verified.find((r) => r.type === "Trajet interrompu");
  if (interruption)
    return {
      status: "suspended",
      note:
        interruption.description || "Interruption confirmée en démonstration.",
    };
  const delay = verified.find((r) => /panne|retard/i.test(r.type));
  if (line.status === "normal" && delay)
    return {
      status: "delayed",
      note: delay.description || "Circulation perturbée dans ce scénario.",
    };
  return { status: line.status, note: line.statusNote };
}

export type NetworkFilters = {
  mode: Mode | "all";
  status: ServiceStatus | "all";
  gpsOnly: boolean;
  search: string;
};
export const defaultFilters: NetworkFilters = {
  mode: "all",
  status: "all",
  gpsOnly: false,
  search: "",
};
export const normalizeSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
export function filterLines(
  lines: Line[],
  vehicles: Vehicle[],
  reports: Report[],
  now: number,
  filters: NetworkFilters,
): Line[] {
  const query = normalizeSearch(filters.search);
  return lines.filter(
    (line) =>
      (filters.mode === "all" || line.mode === filters.mode) &&
      (filters.status === "all" ||
        serviceFor(line, reports, now).status === filters.status) &&
      (!filters.gpsOnly ||
        vehicles.some((v) => v.lineId === line.id && isFresh(v, now))) &&
      normalizeSearch(
        `${line.id} ${modeLabels[line.mode]} ${line.name} ${line.stops.map((id) => stopById(id).name).join(" ")}`,
      ).includes(query),
  );
}
export function interchangeLines(lines: Line[], stopId: string) {
  return lines.filter((l) => l.stops.includes(stopId));
}

export function createVehicles(): Vehicle[] {
  const now = Date.now();
  const vehicle = (
    id: string,
    lineId: string,
    progress: number,
    crowd: Crowd,
    contributions: number,
    direction: Direction = 1,
    running = true,
  ): Vehicle => ({
    id,
    lineId,
    progress,
    direction,
    crowd,
    contributions,
    running,
    updatedAt: running ? now : now - 180_000,
    crowdAt: now,
  });
  return [
    vehicle("BUS-201", "2", 0.55, "low", 8),
    vehicle("BUS-202", "2", 2.35, "medium", 5),
    vehicle("BUS-203", "2", 4.4, "low", 3),
    vehicle("BUS-2001", "20", 1.4, "medium", 4),
    vehicle("BUS-3201", "32", 1.2, "unknown", 1, 1, false),
    vehicle("BUS-4701", "47", 2.6, "high", 6),
    ...initialLines
      .filter((l) => !["2", "20", "32", "47"].includes(l.id))
      .flatMap((line) => {
        const prefix =
          line.mode === "bus" ? "BUS" : line.mode === "metro" ? "METRO" : "TGM";
        const running = line.status !== "suspended";
        const vehicles = [
          vehicle(
            `${prefix}-${line.id}-01`,
            line.id,
            0.6,
            line.id === "M4" ? "high" : "low",
            6,
            1,
            running,
          ),
        ];
        if (line.bidirectional)
          vehicles.push(
            vehicle(
              `${prefix}-${line.id}-02`,
              line.id,
              line.stops.length - 1.65,
              "medium",
              4,
              -1,
              running,
            ),
          );
        return vehicles;
      }),
  ];
}
export function advanceVehicle(
  vehicle: Vehicle,
  line: Line,
  now: number,
): Vehicle {
  if (!vehicle.running || line.status === "suspended") return vehicle;
  const delta = 0.025 * (4 / segmentMinutes(line));
  const next = vehicle.progress + delta * vehicle.direction;
  if (next >= line.stops.length - 1 || next <= 0) {
    return {
      ...vehicle,
      progress: line.bidirectional
        ? Math.max(0, Math.min(next, line.stops.length - 1))
        : 0,
      direction: line.bidirectional ? (vehicle.direction === 1 ? -1 : 1) : 1,
      updatedAt: now,
    };
  }
  return { ...vehicle, progress: next, updatedAt: now };
}
export function createReports(): Report[] {
  const now = Date.now();
  return [
    {
      id: "r1",
      lineId: "32",
      type: "Bus en panne",
      description:
        "Un véhicule immobilisé à proximité de Bab Saadoun. Prévoyez un autre trajet.",
      createdAt: now - 8 * 60_000,
      status: "verified",
    },
    {
      id: "r2",
      lineId: "47",
      type: "Bus saturé",
      description: "Forte affluence en direction de La Manouba.",
      createdAt: now - 4 * 60_000,
      status: "pending",
    },
    {
      id: "r3",
      lineId: "M4",
      type: "Véhicule en retard",
      description: "Scénario démo : circulation ralentie à proximité du Bardo.",
      createdAt: now - 6 * 60_000,
      status: "verified",
    },
    {
      id: "r4",
      lineId: "M5",
      type: "Trajet interrompu",
      description:
        "Scénario démo : service M5 interrompu. M3 dessert le tronçon commun jusqu’aux Jasmins.",
      createdAt: now - 3 * 60_000,
      status: "verified",
    },
  ];
}
export const crowdLabels: Record<Crowd, string> = {
  low: "Places disponibles",
  medium: "Affluence modérée",
  high: "Véhicule saturé",
  unknown: "Affluence inconnue",
};
export const reportTypes = [
  "Bus en retard",
  "Bus en panne",
  "Véhicule en retard",
  "Véhicule en panne",
  "Trajet interrompu",
  "Bus saturé",
  "Véhicule saturé",
  "Autre",
];
export function crowdLevel(vehicle: Vehicle, now: number): Crowd {
  return vehicle.contributions >= 2 && now - vehicle.crowdAt < 900_000
    ? vehicle.crowd
    : "unknown";
}
export function position(vehicle: Vehicle, line: Line): [number, number] {
  const p = Math.max(0, Math.min(vehicle.progress, line.stops.length - 1));
  const a = stopById(line.stops[Math.floor(p)]);
  const b = stopById(
    line.stops[Math.min(Math.floor(p) + 1, line.stops.length - 1)],
  );
  const fraction = p % 1;
  return [
    a.lat + (b.lat - a.lat) * fraction,
    a.lng + (b.lng - a.lng) * fraction,
  ];
}
export function arrivalMinutes(
  vehicle: Vehicle,
  stopIndex: number,
  now: number,
  line?: Line,
): number | null {
  if (!isFresh(vehicle, now) || stopIndex < 0 || line?.status === "suspended")
    return null;
  const distance = (stopIndex - vehicle.progress) * vehicle.direction;
  if (distance < 0) return null;
  return (
    Math.max(1, Math.ceil(distance * (line ? segmentMinutes(line) : 4))) +
    (line?.status === "delayed" ? 6 : 0)
  );
}
export type Journey = {
  lines: Line[];
  transfer?: string;
  minutes: number;
  segments: { line: Line; from: string; to: string; direction: Direction }[];
};
export function planJourneys(
  lines: Line[],
  from: string,
  to: string,
): Journey[] {
  if (from === to) return [];
  const available = lines.filter((l) => l.status !== "suspended");
  const result: Journey[] = [];
  const canRide = (line: Line, a: string, b: string) => {
    const i = line.stops.indexOf(a),
      j = line.stops.indexOf(b);
    return i >= 0 && j >= 0 && i !== j && (j > i || line.bidirectional);
  };
  const segment = (
    line: Line,
    a: string,
    b: string,
  ): Journey["segments"][number] => ({
    line,
    from: a,
    to: b,
    direction: line.stops.indexOf(b) > line.stops.indexOf(a) ? 1 : -1,
  });
  const duration = (line: Line, a: string, b: string) =>
    Math.abs(line.stops.indexOf(b) - line.stops.indexOf(a)) *
      segmentMinutes(line) +
    (line.status === "delayed" ? 6 : 0);
  for (const line of available) {
    if (canRide(line, from, to))
      result.push({
        lines: [line],
        minutes: duration(line, from, to) + 3,
        segments: [segment(line, from, to)],
      });
  }
  for (const first of available.filter((l) => l.stops.includes(from))) {
    for (const second of available.filter(
      (l) => l.id !== first.id && l.stops.includes(to),
    )) {
      const candidates = first.stops
        .filter(
          (transfer) =>
            canRide(first, from, transfer) && canRide(second, transfer, to),
        )
        .map((transfer) => ({
          lines: [first, second],
          transfer,
          minutes:
            duration(first, from, transfer) +
            duration(second, transfer, to) +
            8,
          segments: [
            segment(first, from, transfer),
            segment(second, transfer, to),
          ],
        }));
      // Keep the fastest interchange for a given line pair instead of near-duplicate cards.
      const best = candidates.sort((a, b) => a.minutes - b.minutes)[0];
      if (best) result.push(best);
    }
  }
  return result
    .sort((a, b) => a.minutes - b.minutes || a.lines.length - b.lines.length)
    .slice(0, 6);
}
