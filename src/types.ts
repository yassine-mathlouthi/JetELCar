export type Stop = { id: string; name: string; lat: number; lng: number };
export type Crowd = "low" | "medium" | "high" | "unknown";
export type Mode = "bus" | "metro" | "tgm";
export type ServiceStatus = "normal" | "delayed" | "suspended";
export type Direction = 1 | -1;
export type Line = {
  id: string;
  name: string;
  color: string;
  mode: Mode;
  status: ServiceStatus;
  statusNote: string;
  bidirectional: boolean;
  stops: string[];
  frequency: number | null;
  start: string;
  end: string;
};
export type Vehicle = {
  id: string;
  lineId: string;
  direction: Direction;
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
