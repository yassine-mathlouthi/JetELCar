import React from "react";
import ReactDOM from "react-dom/client";
import "leaflet/dist/leaflet.css";
import App from "./App";
import { migrateNetworkStorage } from "./storage";
try {
  migrateNetworkStorage(localStorage);
} catch {
  /* Continue in memory if browser storage is unavailable. */
}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
