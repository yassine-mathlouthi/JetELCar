import { describe, expect, it } from "vitest";
import {
  activeReports,
  advanceVehicle,
  defaultFilters,
  filterLines,
  interchangeLines,
  serviceFor,
  stops,
  arrivalMinutes,
  createVehicles,
  crowdLevel,
  initialLines,
  isFresh,
  planJourneys,
  position,
  stopById,
  type Report,
} from "./data";
describe("mock transport rules", () => {
  it("never estimates an arrival from stale GPS", () => {
    const v = createVehicles()[0];
    expect(arrivalMinutes(v, 2, v.updatedAt + 120001)).toBeNull();
    expect(isFresh(v, v.updatedAt + 120000)).toBe(true);
  });
  it("does not predict a bus that has already passed the stop", () => {
    const v = createVehicles()[0];
    expect(arrivalMinutes(v, 0, v.updatedAt)).toBeNull();
    expect(arrivalMinutes(v, 2, v.updatedAt)).toBe(6);
  });
  it("requires enough recent crowd reports", () => {
    const v = createVehicles()[0];
    expect(crowdLevel({ ...v, contributions: 1 }, v.crowdAt)).toBe("unknown");
    expect(crowdLevel(v, v.crowdAt + 900001)).toBe("unknown");
    expect(crowdLevel(v, v.crowdAt)).toBe("low");
  });
  it("expires reports after an hour and hides dismissed reports", () => {
    const r: Report = {
      id: "r",
      lineId: "2",
      type: "Autre",
      description: "",
      createdAt: 0,
      status: "pending",
    };
    expect(activeReports([r], 3599999)).toHaveLength(1);
    expect(activeReports([r], 3600000)).toHaveLength(0);
    expect(activeReports([{ ...r, status: "dismissed" }], 10)).toHaveLength(0);
  });
  it("finds direct and transfer journeys with bidirectional rail coverage", () => {
    const direct = planJourneys(initialLines, "barcelone", "ariana");
    expect(direct[0].lines.map((l) => l.id)).toEqual(["2"]);
    const transfer = planJourneys(initialLines, "marine", "ariana");
    expect(transfer[0].transfer).toBe("republique");
    const reverse = planJourneys(initialLines, "ariana", "barcelone");
    expect(reverse[0].segments.every((s) => s.direction === -1)).toBe(true);
    expect(
      planJourneys(
        initialLines.filter((l) => l.mode === "bus"),
        "ariana",
        "barcelone",
      ),
    ).toEqual([]);
    expect(planJourneys(initialLines, "ariana", "ariana")).toEqual([]);
  });
  it("contains six distinct métro lines, TGM and a valid expanded stop catalogue", () => {
    expect(
      initialLines.filter((l) => l.mode === "metro").map((l) => l.id),
    ).toEqual(["M1", "M2", "M3", "M4", "M5", "M6"]);
    expect(initialLines.filter((l) => l.mode === "bus")).toHaveLength(7);
    expect(initialLines.find((l) => l.id === "TGM")?.stops.at(-1)).toBe(
      "marsa",
    );
    expect(new Set(stops.map((s) => s.id)).size).toBe(stops.length);
    for (const line of initialLines) {
      expect(new Set(line.stops).size).toBe(line.stops.length);
      expect(line.stops.every((id) => stops.some((s) => s.id === id))).toBe(
        true,
      );
    }
    expect(
      createVehicles().every((v) =>
        initialLines.some((l) => l.id === v.lineId),
      ),
    ).toBe(true);
    expect(interchangeLines(initialLines, "marine").map((l) => l.id)).toContain(
      "TGM",
    );
    expect(interchangeLines(initialLines, "marine").map((l) => l.id)).toContain(
      "M6",
    );
  });
  it("filters by mode, service status, freshness and accent-insensitive station names together", () => {
    const now = Date.now();
    const vehicles = createVehicles();
    const metro = filterLines(initialLines, vehicles, [], now, {
      ...defaultFilters,
      mode: "metro",
    });
    expect(metro).toHaveLength(6);
    expect(
      filterLines(initialLines, vehicles, [], now, {
        ...defaultFilters,
        mode: "metro",
        status: "suspended",
      }).map((l) => l.id),
    ).toEqual(["M5"]);
    expect(
      filterLines(initialLines, vehicles, [], now, {
        ...defaultFilters,
        mode: "metro",
        status: "suspended",
        gpsOnly: true,
      }),
    ).toEqual([]);
    expect(
      filterLines(initialLines, vehicles, [], now, {
        ...defaultFilters,
        search: "sidi bou said",
      }).map((l) => l.id),
    ).toEqual(["TGM"]);
  });
  it("does not offer suspended lines or arrivals even with a fresh GPS position", () => {
    const line = initialLines.find((l) => l.id === "M5")!;
    const v = { ...createVehicles()[0], lineId: line.id, progress: 0 };
    expect(arrivalMinutes(v, 2, v.updatedAt, line)).toBeNull();
    expect(planJourneys(initialLines, "intilaka", "barcelone")).toEqual([]);
    expect(
      planJourneys(initialLines, "barcelone", "ibnkhaldoun").every(
        (j) => !j.lines.some((l) => l.id === "M5"),
      ),
    ).toBe(true);
  });
  it("calculates reverse rail arrivals and does not predict passed stops in that direction", () => {
    const line = initialLines.find((l) => l.id === "M2")!;
    const v = { ...createVehicles()[0], progress: 5.5, direction: -1 as const };
    expect(arrivalMinutes(v, 4, v.updatedAt, line)).toBe(3);
    expect(arrivalMinutes(v, 6, v.updatedAt, line)).toBeNull();
    const tgm = initialLines.find((l) => l.id === "TGM")!;
    expect(
      planJourneys([tgm], "marsa", "marine")[0].segments[0].direction,
    ).toBe(-1);
  });
  it("keeps declared service separate from unverified or expired passenger reports", () => {
    const line = initialLines[0];
    const now = Date.now();
    const r: Report = {
      id: "s",
      lineId: line.id,
      type: "Trajet interrompu",
      description: "Test",
      createdAt: now,
      status: "pending",
    };
    expect(serviceFor(line, [r], now).status).toBe("normal");
    expect(serviceFor(line, [{ ...r, status: "verified" }], now).status).toBe(
      "suspended",
    );
    expect(
      serviceFor(line, [{ ...r, status: "verified" }], now + 3600000).status,
    ).toBe("normal");
  });
  it("turns rail vehicles around at a terminus and freezes suspended services", () => {
    const line = initialLines.find((l) => l.id === "M2")!;
    const v = { ...createVehicles()[0], progress: line.stops.length - 1.01 };
    const turned = advanceVehicle(v, line, v.updatedAt + 5000);
    expect(turned.direction).toBe(-1);
    expect(turned.progress).toBe(line.stops.length - 1);
    expect(
      advanceVehicle(v, { ...line, status: "suspended" }, v.updatedAt + 5000),
    ).toEqual(v);
  });
  it("interpolates GPS positions along the route", () => {
    const v = { ...createVehicles()[0], progress: 0 };
    const s = stopById(initialLines[0].stops[0]);
    expect(position(v, initialLines[0])).toEqual([s.lat, s.lng]);
  });
});
