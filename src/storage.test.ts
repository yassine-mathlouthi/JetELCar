import { describe, expect, it } from "vitest";
import { migrateNetworkStorage } from "./storage";
import { createVehicles, initialLines } from "./data";
function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
describe("multimodal storage upgrade", () => {
  it("seeds all routes on a fresh installation", () => {
    const storage = memoryStorage();
    migrateNetworkStorage(storage);
    expect(JSON.parse(storage.getItem("jec-lines-v2")!)).toHaveLength(14);
    expect(JSON.parse(storage.getItem("jec-vehicles-v2")!)).toHaveLength(
      createVehicles().length,
    );
  });
  it("preserves legacy edits and IDs while adding new modes and directions", () => {
    const storage = memoryStorage();
    const {
      mode: _mode,
      status: _status,
      statusNote: _note,
      bidirectional: _both,
      ...oldLine
    } = initialLines[0];
    storage.setItem(
      "jec-lines-v1",
      JSON.stringify([{ ...oldLine, name: "Mon parcours personnalisé" }]),
    );
    const { direction: _direction, ...oldVehicle } = createVehicles()[0];
    storage.setItem(
      "jec-vehicles-v1",
      JSON.stringify([{ ...oldVehicle, running: false }]),
    );
    storage.setItem("jec-favorites-v1", JSON.stringify(["2"]));
    migrateNetworkStorage(storage);
    const lines = JSON.parse(storage.getItem("jec-lines-v2")!);
    expect(lines.find((l: { id: string }) => l.id === "2").name).toBe(
      "Mon parcours personnalisé",
    );
    expect(lines.find((l: { id: string }) => l.id === "2").mode).toBe("bus");
    expect(lines.find((l: { id: string }) => l.id === "M2").mode).toBe("metro");
    const vehicles = JSON.parse(storage.getItem("jec-vehicles-v2")!);
    expect(
      vehicles.find((v: { id: string }) => v.id === oldVehicle.id),
    ).toMatchObject({ direction: 1, running: false });
    expect(storage.getItem("jec-favorites-v1")).toBe('["2"]');
  });
  it("runs only once and does not resurrect subsequently deleted routes", () => {
    const storage = memoryStorage();
    migrateNetworkStorage(storage);
    storage.setItem("jec-lines-v2", JSON.stringify([initialLines[0]]));
    storage.setItem("jec-vehicles-v2", "[]");
    migrateNetworkStorage(storage);
    expect(JSON.parse(storage.getItem("jec-lines-v2")!)).toHaveLength(1);
    expect(storage.getItem("jec-vehicles-v2")).toBe("[]");
  });
  it("recovers from invalid legacy JSON", () => {
    const storage = memoryStorage();
    storage.setItem("jec-lines-v1", "{invalid");
    migrateNetworkStorage(storage);
    expect(JSON.parse(storage.getItem("jec-lines-v2")!)).toHaveLength(14);
  });
});
