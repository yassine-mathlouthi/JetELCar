# Jet El Car — implementation checklist

## Scope

Frontend prototype based on `jet l car __.pdf`. React + TypeScript, Vite, Node + Fastify static server. All transport data is fictional and local; no backend API, real GPS, authentication, or push notifications.

## Plan

- [x] 1. Set up the project, typed mock network, design tokens and app shell.
- [x] 2. Build passenger map, searchable lines/stops, line details, freshness-aware arrivals and persistent favorites.
- [x] 3. Build covered-network journey planning, crowding contributions, incident reports and in-app alerts.
- [x] 4. Build simulated driver controls and demo-gated administration (network management and moderation).
- [x] 5. Polish responsive layouts, keyboard access, empty/error states; run typecheck, build and browser interaction tests.

## Multimodal network expansion

- [x] Add métro M1–M6, TGM, more bus routes and representative station sequences from the supplied references. Keep geography approximate and every operational value mocked.
- [x] Add transport modes, service statuses and bidirectional rail journeys without conflating bus 2 with métro M2.
- [x] Upgrade map to network/line views, matching mode/status/search filters, clickable routes, interchange markers, optional stations/vehicles, and expanded view.
- [x] Update arrival, journey, alerts and administration screens for métro/TGM and service availability.
- [x] Migrate existing local demo data safely, add regression tests, inspect desktop/mobile views, then commit and push.

Design extension: keep the current paper/slate/blue system and typography. Add compact mode tabs and explicit status chips; shared station rings are the map’s signature. Fit the network only in network view; fit and emphasize one route in line view. Bound the route list so adding lines cannot stretch the map indefinitely.

## Design plan

- Palette: paper #FFFFFF, canvas #F5F7FA, ink #182A3B, muted #5D6E82 (darkened after contrast review), transit blue #245BE0, signal green #218568.
- Type: Manrope for headings; Inter for UI and readable route data; tabular figures for times.
- Layout: compact rail, spacious header, route-browser panel beside a dominant Tunis map. Mobile stacks route selection and map, with a compact four-item navigation bar.
- Signature: a transit-style route strip linking arrival information, stop sequence and map in the same route color. No decorative gradients or oversized marketing hero.
- Review: this is a transport tool, not a generic SaaS dashboard. Prioritize the next departure and the actual route over KPI cards. Keep source/freshness labels close to predictions.

## Acceptance

- Search, route/stop selection, map controls, favorites, planner, reports, moderation and simulator controls work.
- GPS older than 120 seconds hides the ETA; insufficient crowd reports show unknown.
- Reports expire after 60 minutes and demo submissions persist locally.
- Demo access is explicitly not secure authentication.
- No production integrations or claims of real transit data.

## Verification completed

- TypeScript + Vite production build passes.
- 16 unit tests pass, covering transport rules, filtering, direction coverage, suspended services and legacy-storage migration.
- 16 Playwright browser tests pass, including axe checks on five main screens, a mobile rail screen and the expanded map.
- Desktop and 390px mobile screenshots reviewed; no horizontal overflow on main mobile screens.
- Replaced the original tile provider after visual review revealed API-key-required tiles. OpenStreetMap now works without a key.
- Fastify smoke checks: home 200, SPA fallback 200, nonexistent transport API 404.
- `npm audit`: zero known vulnerabilities.

## Deliberate prototype boundaries

- Administration configures served stops from a fixed mock catalogue; new geographic stop creation is not implemented.
- No real authentication, real GPS, transport API, database, journeys requiring more than one transfer, or phone notifications.
- Métro/TGM support both directions. The catalogue contains 14 lines and 90 representative stops, with approximate geometry rather than official GTFS coverage.
- Mock service statuses are distinct from GPS freshness. A suspended line is excluded from arrivals, journey planning and position updates.
- Reference artwork is not bundled; reference credits and limitations are recorded in README.md.
- Map tiles and optional web fonts use external Internet resources. All application transport state is local mock data.
