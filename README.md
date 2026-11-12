# Jet El Car

A French-language, responsive frontend prototype for **Smart Transport Tunis**, based on `jet l car __.pdf`.

**React + TypeScript · Vite · Leaflet/OpenStreetMap · Node + Fastify**

All routes, vehicles, schedules, reports, crowd levels and journey durations are fictional. This is not a real-time transit service.

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

1. **Vue du réseau:** search for a line number, destination or stop. Select a line, then select an arrival stop from the dropdown, route strip or map. Click a bus for vehicle details. Zoom, recenter or toggle the other lines on the map.
2. **Mes favoris:** save a line using its heart button. Favorites survive a reload.
3. **Mes itinéraires:** try `Place Barcelone → Ariana Centre` for a direct route or `Tunis Marine → Ariana Centre` for a transfer. Open the steps and follow a line on the network map. Only the displayed direction of each mock line is covered.
4. **Signalements:** submit an incident from the network or alerts screen. It appears as unverified and expires after one hour.
5. **Affluence:** declare a crowd level for the arriving bus or click a bus marker first. Recent contributions are aggregated, with a one-minute contribution cooldown per vehicle.
6. **Alertes & infos:** enable an in-app approach alert. On the network screen it refers to the selected stop; the alerts screen also summarizes approaches to any stop on subscribed lines. No system notification is sent.
7. **Espace conducteur:** open a demo session, start or stop simulated position updates, or report a breakdown. Closing the session stops that vehicle’s updates. No real geolocation is requested.
8. **Administration:** use the public demo code **JET2026**. Validate, dismiss or merge duplicate reports; create/edit/delete lines; choose and reorder served stops from the fixed mock stop catalogue; add, start, pause or remove vehicles.

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

- Unit tests cover stale GPS, passed stops, crowd confidence/expiry, report expiry, route planning and coordinate interpolation.
- Browser tests cover passenger workflows, local persistence, reporting/moderation, planning, driver controls, route/vehicle administration, responsive overflow and dialog keyboard dismissal.
- Accessibility checks use axe on the main screens. They supplement, rather than replace, manual keyboard and visual review.

## Project structure

```text
src/
  App.tsx                  Navigation, local state, simulator and contribution flows
  data.ts                  Typed mock catalogue and pure transport rules
  data.test.ts             Transport-rule tests
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
 e2e/app.spec.ts            Browser interaction tests
TODO.md                    Implementation plan and completion record
```

## Prototype rules and limitations

- Vehicles advance every **5 seconds** while running and loop at the terminus.
- GPS older than **120 seconds** never produces an ETA. A bus already past the selected stop also has no arrival prediction there.
- Crowd estimates require at least **two contributions** and become unknown after **15 minutes** without a new contribution. Aggregation uses a simple weighted crowd category, not a passenger count.
- Reports expire after **60 minutes**. Demo admin moderation is local to the browser.
- Journey planning finds direct or one-transfer journeys, in the recorded direction only. Durations use fictional segment times, not live traffic or a real timetable.
- Favorites, subscriptions, vehicles, lines and reports use `localStorage`. There is no cross-device sync. If browser storage is unavailable, the app continues in memory.
- The stop catalogue is fixed in `src/data.ts`; administration manages how those stops are served by each line.
- OpenStreetMap tiles and Google Fonts need Internet. System-font fallbacks are provided; route overlays remain usable when tiles fail. No offline tile cache is shipped. Follow [OpenStreetMap’s tile usage policy](https://operations.osmfoundation.org/policies/tiles/) before deployment at scale.
- The admin code is a **demonstration gate, not secure authentication**. No real accounts, authorization, backend integrations, push notifications or analytics are implemented.

See [TODO.md](./TODO.md) for the build sequence and design direction.
