import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const modeButtons = (page: import("@playwright/test").Page) =>
  page.getByRole("group", { name: "Mode de transport", exact: true });

test("mode, status and search filters drive both the list and network map", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".line-item")).toHaveCount(14);
  await expect(page.locator(".map-network-caption")).toContainText("14 lignes");
  await modeButtons(page)
    .getByRole("button", { name: "Métro", exact: true })
    .click();
  await expect(page.locator(".line-item")).toHaveCount(6);
  await expect(page.locator(".map-network-caption")).toContainText("6 lignes");
  await page
    .getByLabel("Statut du service", { exact: true })
    .selectOption("delayed");
  await expect(page.locator(".line-item")).toHaveCount(1);
  await expect(page.locator(".line-item")).toContainText("M4");
  await expect(page.locator(".map-network-caption")).toContainText("1 ligne");
  await page
    .getByLabel("Statut du service", { exact: true })
    .selectOption("suspended");
  await expect(page.locator(".line-item")).toContainText("M5");
  await page.locator(".line-select").click();
  await expect(page.locator(".arrival-time")).toContainText(
    "Estimation indisponible",
  );
  await expect(page.locator(".arrival-time")).toContainText(
    "service est interrompu",
  );
  await page.getByRole("button", { name: "GPS récent", exact: true }).click();
  await expect(page.locator(".line-item")).toHaveCount(0);
  await expect(page.locator(".map-empty")).toBeVisible();
  await page
    .locator(".filter-summary")
    .getByRole("button", { name: "Effacer les filtres" })
    .click();
  await expect(page.locator(".line-item")).toHaveCount(14);
  await page
    .getByLabel("Rechercher une ligne ou un arrêt")
    .fill("sidi bou said");
  await expect(page.locator(".line-item")).toHaveCount(1);
  await expect(page.locator(".line-item")).toContainText("TGM");
});

test("métro arrival direction follows the selected destination and excludes passed vehicles", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Rechercher une ligne ou un arrêt").fill("M2");
  await page.locator(".line-select").click();
  await expect(page.locator(".map-network-caption")).toContainText("Métro");
  await page.getByLabel("Sens de circulation").selectOption("-1");
  await page.getByLabel("À l’arrêt").selectOption("mohamedv");
  await expect(page.locator(".arrival-route")).toContainText(
    "Place de la République",
  );
  await expect(page.locator(".arrival-time")).toContainText("17");
  await page.getByLabel("À l’arrêt").selectOption("ariana");
  await expect(page.locator(".arrival-time")).toContainText(
    "Estimation indisponible",
  );
});

test("TGM journeys work in reverse and following the journey preserves direction", async ({
  page,
}) => {
  await page.goto("/#journeys");
  await page.getByLabel("Départ", { exact: true }).selectOption("marsa");
  await page.getByLabel("Destination", { exact: true }).selectOption("marine");
  await page
    .getByRole("group", { name: "Modes du trajet" })
    .getByRole("button", { name: "TGM", exact: true })
    .click();
  await page.getByRole("button", { name: "Rechercher un trajet" }).click();
  await expect(page.locator(".journey-card")).toHaveCount(1);
  await expect(page.locator(".journey-card")).toContainText("TGM");
  await page.getByRole("button", { name: "Voir les étapes" }).click();
  await page.getByRole("button", { name: "Suivre la ligne" }).click();
  await expect(page.getByLabel("Sens de circulation")).toHaveValue("-1");
  await expect(page.getByLabel("À l’arrêt")).toHaveValue("marsa");
  await expect(page.locator(".arrival-route")).toContainText("Tunis Marine");
});

test("map layers, expanded view, empty filters and keyboard exit work", async ({
  page,
}) => {
  await page.goto("/");
  const map = page.getByRole("region", { name: "Carte du réseau de Tunis" });
  await expect(
    map.getByRole("button", { name: "Véhicules", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await map.getByRole("button", { name: "Véhicules", exact: true }).click();
  await expect(page.locator(".vehicle-icon").first()).toBeVisible();
  await map.getByRole("button", { name: "Véhicules", exact: true }).click();
  await expect(page.locator(".vehicle-icon")).toHaveCount(0);
  await map.getByRole("button", { name: "Stations", exact: true }).click();
  await expect(
    map.getByRole("button", { name: "Stations", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await map.getByRole("button", { name: "Fond de carte", exact: true }).click();
  await expect(page.locator(".leaflet-tile")).toHaveCount(0);
  await map.getByRole("button", { name: "Agrandir la carte" }).click();
  await expect(page.locator(".expanded-map")).toBeVisible();
  for (let i = 0; i < 18; i++) await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => !!document.activeElement?.closest(".expanded-map"),
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator(".expanded-map")).toHaveCount(0);
  await page
    .getByLabel("Rechercher une ligne ou un arrêt")
    .fill("no such route");
  await expect(page.locator(".map-empty")).toBeVisible();
  await expect(page.locator(".arrival-card")).toHaveCount(0);
});

test("admin can suspend a métro line and the map and arrival panel respect it", async ({
  page,
}) => {
  await page.goto("/#admin");
  await page.getByLabel("Code de démonstration").fill("JET2026");
  await page.getByRole("button", { name: "Ouvrir l’administration" }).click();
  await page.getByRole("tab", { name: "Lignes & arrêts" }).click();
  await page
    .getByRole("button", { name: "Modifier la ligne M1", exact: true })
    .click();
  await expect(
    page.getByLabel("Mode de transport", { exact: true }),
  ).toHaveValue("metro");
  await page
    .getByLabel("Statut du service", { exact: true })
    .selectOption("suspended");
  await page
    .getByLabel("Message du statut (démo)")
    .fill("Interruption métro de test");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await page.getByRole("link", { name: "Vue du réseau" }).click();
  await page.getByLabel("Rechercher une ligne ou un arrêt").fill("M1");
  await page.locator(".line-select").click();
  await expect(page.locator(".selected-line-banner")).toContainText(
    "Interruption métro de test",
  );
  await expect(page.locator(".arrival-time")).toContainText(
    "Estimation indisponible",
  );
  await expect(page.locator(".vehicle-icon")).toHaveCount(0);
  const running = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("jec-vehicles-v2")!)
      .filter((v: { lineId: string }) => v.lineId === "M1")
      .some((v: { running: boolean }) => v.running),
  );
  expect(running).toBe(false);
  await page.reload();
  await page.getByLabel("Rechercher une ligne ou un arrêt").fill("M1");
  await page.locator(".line-select").click();
  await expect(page.locator(".selected-line-banner")).toContainText(
    "Interruption métro de test",
  );
});

test("upgrading a browser preserves v1 favorites and custom bus names", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("legacy-seeded")) return;
    localStorage.setItem(
      "jec-lines-v1",
      JSON.stringify([
        {
          id: "2",
          name: "Mon bus quotidien",
          color: "#245be0",
          stops: ["barcelone", "republique", "ariana"],
          frequency: 15,
          start: "06:00",
          end: "22:00",
        },
      ]),
    );
    localStorage.setItem("jec-favorites-v1", '["2"]');
    localStorage.setItem("legacy-seeded", "yes");
  });
  await page.goto("/");
  await expect(page.locator(".line-item")).toHaveCount(14);
  await expect(page.locator(".selected-line-banner")).toContainText(
    "Mon bus quotidien",
  );
  await page.getByRole("link", { name: "Mes favoris" }).click();
  await expect(page.locator(".line-item")).toHaveCount(1);
  await expect(
    page.getByRole("button", {
      name: "Retirer la ligne 2 des favoris",
      exact: true,
    }),
  ).toBeVisible();
});

test("mobile rail filters, service cards and expanded map remain accessible", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await modeButtons(page)
    .getByRole("button", { name: "Métro", exact: true })
    .click();
  await page
    .getByLabel("Statut du service", { exact: true })
    .selectOption("suspended");
  await page.locator(".line-select").click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole("button", { name: "Agrandir la carte" }).click();
  const expandedResults = await new AxeBuilder({ page }).analyze();
  expect(expandedResults.violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Réduire la carte" }).click();
  await page.goto("/#journeys");
  await page.getByRole("button", { name: /Tunis Marine → La Marsa/ }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
