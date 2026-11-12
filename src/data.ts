export type Stop = { id: string; name: string; lat: number; lng: number };
export type Crowd = "low" | "medium" | "high" | "unknown";
export type Line = {
  id: string;
  name: string;
  color: string;
  stops: string[];
  frequency: number | null;
  start: string;
  end: string;
};
export type Vehicle = {
  id: string;
  lineId: string;
  progress: number;
  updatedAt: number;
  crowd: Crowd;
  contributions: number;
  crowdAt: number;
  running: boolean;
};
export type Report = {
  id: string;
  lineId: string;
  type: string;
  description: string;
  createdAt: number;
  status: "pending" | "verified" | "dismissed";
};
export const stops: Stop[] = [
  { id: "barcelone", name: "Place Barcelone", lat: 36.7946, lng: 10.1802 },
  {
    id: "republique",
    name: "Place de la République",
    lat: 36.8065,
    lng: 10.1818,
  },
  { id: "passage", name: "Le Passage", lat: 36.8095, lng: 10.1801 },
  { id: "belvedere", name: "Belvédère", lat: 36.8236, lng: 10.1776 },
  { id: "menzah", name: "El Menzah 1", lat: 36.8374, lng: 10.1812 },
  { id: "ariana", name: "Ariana Centre", lat: 36.8602, lng: 10.1934 },
  { id: "marine", name: "Tunis Marine", lat: 36.8001, lng: 10.1916 },
  { id: "mohamedv", name: "Avenue Mohamed V", lat: 36.817, lng: 10.1846 },
  { id: "charguia", name: "La Charguia", lat: 36.8397, lng: 10.2068 },
  { id: "lac", name: "Les Berges du Lac", lat: 36.8373, lng: 10.2357 },
  { id: "bardo", name: "Le Bardo", lat: 36.8092, lng: 10.1406 },
  { id: "babsaadoun", name: "Bab Saadoun", lat: 36.8093, lng: 10.1605 },
  { id: "manar", name: "El Manar", lat: 36.8421, lng: 10.155 },
  { id: "manouba", name: "La Manouba", lat: 36.8083, lng: 10.0985 },
];
export const initialLines: Line[] = [
  {
    id: "2",
    name: "Tunis Centre → Ariana",
    color: "#245be0",
    stops: [
      "barcelone",
      "republique",
      "passage",
      "belvedere",
      "menzah",
      "ariana",
    ],
    frequency: 15,
    start: "05:30",
    end: "22:00",
  },
  {
    id: "20",
    name: "Tunis Marine → Le Lac",
    color: "#207b69",
    stops: ["marine", "republique", "mohamedv", "charguia", "lac"],
    frequency: 20,
    start: "05:45",
    end: "21:30",
  },
  {
    id: "32",
    name: "Le Passage → El Manar",
    color: "#8c60b8",
    stops: ["passage", "babsaadoun", "bardo", "manar"],
    frequency: 25,
    start: "06:00",
    end: "21:00",
  },
  {
    id: "47",
    name: "Place Barcelone → La Manouba",
    color: "#a25e23",
    stops: ["barcelone", "passage", "babsaadoun", "bardo", "manouba"],
    frequency: null,
    start: "06:00",
    end: "20:30",
  },
];
export function createVehicles(): Vehicle[] {
  const now = Date.now();
  return [
    {
      id: "BUS-201",
      lineId: "2",
      progress: 0.55,
      updatedAt: now,
      crowd: "low",
      contributions: 8,
      crowdAt: now,
      running: true,
    },
    {
      id: "BUS-202",
      lineId: "2",
      progress: 2.35,
      updatedAt: now,
      crowd: "medium",
      contributions: 5,
      crowdAt: now,
      running: true,
    },
    {
      id: "BUS-203",
      lineId: "2",
      progress: 4.4,
      updatedAt: now,
      crowd: "low",
      contributions: 3,
      crowdAt: now,
      running: true,
    },
    {
      id: "BUS-2001",
      lineId: "20",
      progress: 1.4,
      updatedAt: now,
      crowd: "medium",
      contributions: 4,
      crowdAt: now,
      running: true,
    },
    {
      id: "BUS-3201",
      lineId: "32",
      progress: 1.2,
      updatedAt: now - 180_000,
      crowd: "unknown",
      contributions: 1,
      crowdAt: now,
      running: false,
    },
    {
      id: "BUS-4701",
      lineId: "47",
      progress: 2.6,
      updatedAt: now,
      crowd: "high",
      contributions: 6,
      crowdAt: now,
      running: true,
    },
  ];
}
export function createReports(): Report[] {
  return [
    {
      id: "r1",
      lineId: "32",
      type: "Bus en panne",
      description:
        "Un véhicule immobilisé à proximité de Bab Saadoun. Prévoyez un autre trajet.",
      createdAt: Date.now() - 8 * 60_000,
      status: "verified",
    },
    {
      id: "r2",
      lineId: "47",
      type: "Bus saturé",
      description: "Forte affluence en direction de La Manouba.",
      createdAt: Date.now() - 4 * 60_000,
      status: "pending",
    },
  ];
}
export const crowdLabels: Record<Crowd, string> = {
  low: "Places disponibles",
  medium: "Affluence modérée",
  high: "Bus saturé",
  unknown: "Affluence inconnue",
};
export const reportTypes = [
  "Bus en retard",
  "Bus en panne",
  "Trajet interrompu",
  "Bus saturé",
  "Autre",
];
export const stopById = (id: string) => stops.find((s) => s.id === id)!;
export const isFresh = (vehicle: Vehicle, now: number) =>
  now - vehicle.updatedAt <= 120_000;
export const activeReports = (reports: Report[], now: number) =>
  reports.filter(
    (r) => r.status !== "dismissed" && now - r.createdAt < 3_600_000,
  );
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
): number | null {
  if (!isFresh(vehicle, now) || vehicle.progress > stopIndex) return null;
  return Math.max(1, Math.ceil((stopIndex - vehicle.progress) * 4));
}
export type Journey = {
  lines: Line[];
  transfer?: string;
  minutes: number;
  segments: { line: Line; from: string; to: string }[];
};
export function planJourneys(
  lines: Line[],
  from: string,
  to: string,
): Journey[] {
  if (from === to) return [];
  const result: Journey[] = [];
  for (const line of lines) {
    const a = line.stops.indexOf(from),
      b = line.stops.indexOf(to);
    if (a >= 0 && b > a)
      result.push({
        lines: [line],
        minutes: (b - a) * 4 + 3,
        segments: [{ line, from, to }],
      });
  }
  for (const first of lines.filter((l) => l.stops.includes(from))) {
    for (const second of lines.filter(
      (l) => l.id !== first.id && l.stops.includes(to),
    )) {
      for (const transfer of first.stops) {
        if (
          first.stops.indexOf(transfer) > first.stops.indexOf(from) &&
          second.stops.includes(transfer) &&
          second.stops.indexOf(to) > second.stops.indexOf(transfer)
        ) {
          result.push({
            lines: [first, second],
            transfer,
            minutes:
              (first.stops.indexOf(transfer) -
                first.stops.indexOf(from) +
                second.stops.indexOf(to) -
                second.stops.indexOf(transfer)) *
                4 +
              8,
            segments: [
              { line: first, from, to: transfer },
              { line: second, from: transfer, to },
            ],
          });
        }
      }
    }
  }
  return result.sort((a, b) => a.minutes - b.minutes).slice(0, 4);
}
