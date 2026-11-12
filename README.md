# Jet El Car

A French-language, responsive frontend prototype for **Smart Transport Tunis**, based on `jet l car __.pdf`.

**React + TypeScript · Vite · Leaflet/OpenStreetMap · Node + Fastify**

The MVP includes **7 bus routes, métro M1–M6, TGM, and 90 representative stops**. Familiar rail station names are inspired by the supplied Tunis network maps; coordinates and connecting geometry are approximate. Vehicles, service statuses, schedules, reports, crowd levels and journey durations are **mock data only**. This is not a real-time or official transit service.

## Run locally

Use Node.js **22.12+** (tested with Node 24).

```sh
npm install
npm run dev
```

Open **http://localhost:5173**. The Vite development server prints a different port if 5173 is occupied.

### Serve the production build with Fastify

```sh
npm run build
npm start
```

Open **http://localhost:3000**. Set `PORT` to change the production port. Fastify only serves static files and the app shell; there is no transport API or database.

## Try the prototype

1. **Vue du réseau:** filter by Bus / Métro / TGM, service status, recent GPS, or an accent-insensitive station search. The same filters drive the list and map. Switch between **Réseau** and **Ma ligne**, toggle stations/vehicles/background, recenter, or expand the map (Escape closes it). Network view starts without vehicle markers to keep the overview readable. Terminal badges identify lines; shared station rings open interchange choices. Click a vehicle in line view for details.
2. **Mes favoris:** save a line using its heart button. Favorites survive a reload.
3. **Mes itinéraires:** try the suggested TGM trip `Tunis Marine → La Marsa Plage`, métro `Place Barcelone → El Mourouj 4`, or `Place de la République → Ben Arous` with a transfer. Filter the permitted modes, open the steps and follow a line. Rail works in both directions; following a return trip preserves its direction. Suspended lines are excluded.
4. **Signalements:** submit an incident from the network or alerts screen. It appears as unverified and expires after one hour.
5. **Affluence:** declare a crowd level for the arriving vehicle or click its map marker first. Recent contributions are aggregated, with a one-minute contribution cooldown per vehicle.
6. **Alertes & infos:** enable an in-app approach alert. On the network screen it refers to the selected stop; the alerts screen also summarizes approaches to any stop on subscribed lines. No system notification is sent.
7. **Espace conducteur:** open a demo session, start or stop simulated position updates, or report a breakdown. Closing the session stops that vehicle’s updates. No real geolocation is requested.
8. **Administration:** use the public demo code **JET2026**. Validate, dismiss or merge duplicate reports; create/edit/delete lines; configure mode, direction coverage, service status and status message; choose/reorder served stops; add, start, pause or remove vehicles. Suspending a line freezes its vehicles. Verified incident reports can override the configured service status until they expire or are dismissed.

To start again, open **Aide & à propos → Réinitialiser la démonstration**. This resets this app’s local data, not other browser storage.

## Checks

```sh
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
npm run format:check
npm audit
```

- **16 unit tests** cover transport rules, bidirectional rail, suspended services, shared filters, catalogue integrity, terminus turnaround and legacy-storage migration.
- **16 browser tests** cover passenger workflows, map layers/views, filters, persistence/migration, reporting/moderation, rail planning, driver controls, service-status administration and mobile overflow.
- Accessibility checks use axe on the main screens. They supplement, rather than replace, manual keyboard and visual review.

## Project structure

```text
src/
  App.tsx                  Navigation, local state, simulator and contribution flows
  types.ts                 Stops, modes, lines, service statuses, directions and vehicles
  network.ts               Representative stop catalogue and seeded bus/métro/TGM routes
  data.ts                  Filtering, status, simulator, arrival and journey rules
  data.test.ts             Transport-rule tests
  storage.ts               One-time v1 → v2 network migration
  storage.test.ts          Migration and persistence regression tests
  network.css              Multimodal map, filters and service-status components
  hooks.ts                 Local-storage persistence with in-memory fallback
  styles.css               Design tokens and responsive component styles
  components/
    Passenger.tsx          Search, lines, arrival panel and stop strip
    TransitMap.tsx         Leaflet map and simulated vehicle markers
    Journeys.tsx           Covered-network journey planner
    Alerts.tsx             Incidents and approach-alert subscriptions
    Operations.tsx         Driver simulator and demo administration
    UI.tsx                 Shared badges, empty states and native dialog
server/index.ts            Fastify static host
e2e/app.spec.ts            Original interaction regression tests
e2e/network.spec.ts        Multimodal network and migration browser tests
CONTEXT.md                 Transport-domain glossary
TODO.md                    Implementation plan and completion record
```

## Prototype rules and limitations

- Vehicles advance every **5 seconds** while running. Bidirectional vehicles turn around at the terminus; one-way bus routes loop. Suspended services do not advance or produce arrivals.
- GPS older than **120 seconds** never produces an ETA. Only vehicles approaching the selected stop in the selected direction can produce arrivals. Service status and GPS freshness are distinct.
- Crowd estimates require at least **two contributions** and become unknown after **15 minutes** without a new contribution. Aggregation uses a simple weighted crowd category, not a passenger count.
- Reports expire after **60 minutes**. Demo admin moderation is local to the browser.
- Journey planning finds direct or one-transfer journeys. Métro/TGM support both directions; bus routes are one-way unless configured otherwise. The fastest shared stop per line pair is used, with up to six results. Durations use **4 min/bus segment, 2 min/métro segment, 3 min/TGM segment**, plus 3 min initial walking and 5 min for a transfer. A delayed line adds 6 fictional minutes. These are not live traffic or real timetable calculations.
- Favorites, subscriptions, vehicles, lines and reports use `localStorage`. The one-time v2 migration preserves existing bus edits, favorites and reports while adding the new network. Subsequent reloads do not resurrect deleted v2 routes. There is no cross-device sync; if storage is unavailable, the app continues in memory.
- The stop catalogue is fixed in `src/network.ts`; administration manages how those stops are served by each line. It is representative, not a complete or surveyed station inventory.
- OpenStreetMap tiles and Google Fonts need Internet. System-font fallbacks are provided; route overlays remain usable when tiles fail. No offline tile cache is shipped. Follow [OpenStreetMap’s tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before deployment at scale.
- The admin code is a **demonstration gate, not secure authentication**. No real accounts, authorization, backend integrations, push notifications or analytics are implemented.

## Network references

The supplied **Transtu rail-network map** and [Tunis Rapid Transit Map on Wikimedia/Wikipedia](https://fr.wikipedia.org/wiki/Fichier:Tunis_Rapid_Transit_Map.png) informed the representative rail sequences. The latter artwork is by **Maximilian Dörrbecker (Chumwa)**, published under [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/). The supplied artwork is **not bundled or modified** in this repository. The app draws its own approximate routes over attributed OpenStreetMap tiles; it does not claim to reproduce current official infrastructure or service.

See [TODO.md](./TODO.md) for the build sequence and design direction, and [CONTEXT.md](./CONTEXT.md) for the transport vocabulary.
