import {
  createVehicles,
  initialLines,
  stops,
  type Line,
  type Vehicle,
} from "./data";

// One-time, non-destructive upgrade: preserve v1 edits, favorites and reports.
// Once v2 exists, never seed again (deleted lines must stay deleted).
export function migrateNetworkStorage(
  storage: Pick<Storage, "getItem" | "setItem">,
) {
  const read = (key: string): unknown[] => {
    try {
      const data: unknown = JSON.parse(storage.getItem(key) ?? "[]");
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  };
  if (!storage.getItem("jec-lines-v2")) {
    const legacy = read("jec-lines-v1").filter((item): item is Line => {
      if (!item || typeof item !== "object") return false;
      const line = item as Partial<Line>;
      return (
        typeof line.id === "string" &&
        typeof line.name === "string" &&
        Array.isArray(line.stops) &&
        line.stops.length >= 2 &&
        line.stops.every((id) => stops.some((s) => s.id === id))
      );
    });
    const upgraded = legacy.map((line) => ({
      ...initialLines.find((seed) => seed.id === line.id),
      ...line,
      mode: line.mode ?? "bus",
      status:
        line.status ??
        initialLines.find((seed) => seed.id === line.id)?.status ??
        "normal",
      statusNote:
        line.statusNote ??
        initialLines.find((seed) => seed.id === line.id)?.statusNote ??
        "Service régulier dans ce scénario de démonstration.",
      bidirectional: line.bidirectional ?? false,
    }));
    storage.setItem(
      "jec-lines-v2",
      JSON.stringify([
        ...upgraded,
        ...initialLines.filter(
          (line) => !legacy.some((old) => old.id === line.id),
        ),
      ]),
    );
  }
  if (!storage.getItem("jec-vehicles-v2")) {
    const lines = read("jec-lines-v2") as Line[];
    const legacy = read("jec-vehicles-v1").filter(
      (item): item is Vehicle =>
        !!item &&
        typeof item === "object" &&
        typeof (item as Vehicle).id === "string" &&
        lines.some((l) => l.id === (item as Vehicle).lineId),
    );
    const vehicles = [
      ...legacy.map((v) => ({ ...v, direction: v.direction === -1 ? -1 : 1 })),
      ...createVehicles().filter(
        (seed) =>
          !legacy.some((v) => v.id === seed.id) &&
          lines.some((l) => l.id === seed.lineId),
      ),
    ];
    storage.setItem("jec-vehicles-v2", JSON.stringify(vehicles));
  }
}
