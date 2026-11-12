import { describe, expect, it } from "vitest";
import {
  activeReports,
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
  it("finds direct and transfer journeys only in covered directions", () => {
    const direct = planJourneys(initialLines, "barcelone", "ariana");
    expect(direct[0].lines.map((l) => l.id)).toEqual(["2"]);
    const transfer = planJourneys(initialLines, "marine", "ariana");
    expect(transfer[0].transfer).toBe("republique");
    expect(planJourneys(initialLines, "ariana", "barcelone")).toEqual([]);
    expect(planJourneys(initialLines, "ariana", "ariana")).toEqual([]);
  });
  it("interpolates GPS positions along the route", () => {
    const v = { ...createVehicles()[0], progress: 0 };
    const s = stopById(initialLines[0].stops[0]);
    expect(position(v, initialLines[0])).toEqual([s.lat, s.lng]);
  });
});
