# Jet El Car — implementation checklist

## Scope

Frontend prototype based on `jet l car __.pdf`. React + TypeScript, Vite, Node + Fastify static server. All transport data is fictional and local; no backend API, real GPS, authentication, or push notifications.

## Plan

- [x] 1. Set up the project, typed mock network, design tokens and app shell.
- [x] 2. Build passenger map, searchable lines/stops, line details, freshness-aware arrivals and persistent favorites.
- [x] 3. Build covered-network journey planning, crowding contributions, incident reports and in-app alerts.
- [x] 4. Build simulated driver controls and demo-gated administration (network management and moderation).
- [x] 5. Polish responsive layouts, keyboard access, empty/error states; run typecheck, build and browser interaction tests.

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
- 6 transport-rule unit tests pass.
- 9 Playwright browser tests pass, including axe checks on five main screens.
- Desktop and 390px mobile screenshots reviewed; no horizontal overflow on main mobile screens.
- Replaced the original tile provider after visual review revealed API-key-required tiles. OpenStreetMap now works without a key.
- Fastify smoke checks: home 200, SPA fallback 200, nonexistent transport API 404.
- `npm audit`: zero known vulnerabilities.

## Deliberate prototype boundaries

- Administration configures served stops from a fixed mock catalogue; new geographic stop creation is not implemented.
- No real authentication, real GPS, transport API, database, reverse-direction routing, or phone notifications.
- Map tiles and optional web fonts use external Internet resources. All application transport state is local mock data.
