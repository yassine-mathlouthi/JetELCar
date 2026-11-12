import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("network search, stop selection and favorites persist", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Moins d’attente. Plus de repères." }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "À l’arrêt" })
    .selectOption("ariana");
  await expect(page.locator(".arrival-time")).toContainText("3");
  await page
    .getByRole("button", {
      name: "Ajouter la ligne 2 aux favoris",
      exact: true,
    })
    .click();
  await page.getByRole("link", { name: "Mes favoris" }).click();
  await expect(page.locator(".line-item")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".line-item")).toHaveCount(1);
  await page.getByRole("link", { name: "Vue du réseau" }).click();
  await page
    .getByRole("textbox", { name: "Rechercher une ligne ou un arrêt" })
    .fill("Manar");
  await expect(page.locator(".line-item")).toHaveCount(1);
  await page.locator(".line-select").click();
  await expect(page.locator(".arrival-time")).toContainText(
    "Estimation indisponible",
  );
  await page
    .getByRole("textbox", { name: "Rechercher une ligne ou un arrêt" })
    .fill("zzzzzz");
  await expect(page.getByText("Aucune ligne trouvée")).toBeVisible();
});

test("report, moderate and dismiss an incident", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Signaler un incident", exact: true })
    .click();
  await page.getByLabel("Type d’incident").selectOption("Trajet interrompu");
  await page
    .getByLabel("Description (facultatif)")
    .fill("Test de signalement local");
  await page.getByRole("button", { name: "Envoyer le signalement" }).click();
  await page.getByRole("link", { name: /Alertes & infos/ }).click();
  await expect(page.getByText("Test de signalement local")).toBeVisible();
  await page.getByRole("link", { name: "Administration", exact: true }).click();
  await page.getByLabel("Code de démonstration").fill("incorrect");
  await page.getByRole("button", { name: "Ouvrir l’administration" }).click();
  await expect(page.getByRole("alert")).toContainText("Code incorrect");
  await page.getByLabel("Code de démonstration").fill("JET2026");
  await page.getByRole("button", { name: "Ouvrir l’administration" }).click();
  const row = page
    .locator(".moderation-row")
    .filter({ hasText: "Test de signalement local" });
  await row.getByRole("button", { name: "Valider", exact: true }).click();
  await expect(row).toContainText("VÉRIFIÉ");
  await row
    .getByRole("button", { name: "Écarter Trajet interrompu ligne 2" })
    .click();
  await expect(page.getByText("Test de signalement local")).toHaveCount(0);
});

test("planner supports direct routes, transfers and uncovered journeys", async ({
  page,
}) => {
  await page.goto("/#journeys");
  await page.getByRole("button", { name: "Rechercher un trajet" }).click();
  await expect(
    page.getByRole("heading", { name: "Trajet direct, sans correspondance" }),
  ).toBeVisible();
  await page.getByLabel("Départ", { exact: true }).selectOption("marine");
  await page.getByRole("button", { name: "Rechercher un trajet" }).click();
  await expect(
    page
      .getByRole("heading", {
        name: "Correspondance à Place de la République",
      })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Voir les étapes" }).first().click();
  await page.getByRole("button", { name: "Suivre la ligne" }).first().click();
  await expect(page.locator("#stop-select")).toHaveValue("marine");
  await page.goto("/#journeys");
  await page.getByLabel("Départ", { exact: true }).selectOption("intilaka");
  await page
    .getByLabel("Destination", { exact: true })
    .selectOption("barcelone");
  await page.getByRole("button", { name: "Rechercher un trajet" }).click();
  await expect(
    page.getByRole("heading", { name: "Aucun trajet couvert" }),
  ).toBeVisible();
});

test("crowd submissions and in-app subscriptions work", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Déclarer l’affluence", exact: true })
    .click();
  await page.getByText("Véhicule saturé", { exact: true }).click();
  await page.getByRole("button", { name: "Partager l’affluence" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "Affluence enregistrée",
  );
  await expect(page.locator(".freshness")).toContainText("9 avis");
  await page.getByRole("button", { name: "M’avertir à l’approche" }).click();
  await expect(
    page.getByRole("button", { name: "Alerte d’arrivée activée" }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Alertes & infos/ }).click();
  await expect(
    page.getByRole("switch", { name: "Alerte ligne 2", exact: true }),
  ).toBeChecked();
});

test("driver simulator starts, stops and reports breakdowns", async ({
  page,
}) => {
  await page.goto("/#driver");
  await page.getByRole("button", { name: "Ouvrir la session démo" }).click();
  await page.getByRole("button", { name: "Arrêter l’envoi" }).click();
  await expect(
    page.getByRole("button", { name: "Démarrer l’envoi" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Démarrer l’envoi" }).click();
  await page.getByRole("button", { name: "Signaler une panne" }).click();
  await page.getByRole("button", { name: "Confirmer la panne" }).click();
  await expect(
    page.getByText("Envoi des positions arrêté", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Alertes & infos/ }).click();
  await expect(
    page.getByText("Panne déclarée depuis le simulateur conducteur (BUS-201)."),
  ).toBeVisible();
});

test("admin manages route stop ordering and vehicles", async ({ page }) => {
  await page.goto("/#admin");
  await page.getByLabel("Code de démonstration").fill("JET2026");
  await page.getByRole("button", { name: "Ouvrir l’administration" }).click();
  await page.getByRole("tab", { name: "Lignes & arrêts" }).click();
  await page.getByRole("button", { name: "Ajouter une ligne" }).click();
  await page.getByLabel("Numéro", { exact: true }).fill("99");
  await page.getByLabel("Nom du parcours").fill("Barcelone → Ariana express");
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Barcelone → Ariana express" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Modifier la ligne 99" }).click();
  await page
    .getByLabel("Arrêts desservis · dans l’ordre du trajet")
    .selectOption("passage");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ajouter", exact: true })
    .click();
  await page.getByRole("button", { name: "Monter passage" }).click();
  await page.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await expect(
    page
      .locator(".network-row")
      .filter({ hasText: "Barcelone → Ariana express" }),
  ).toContainText("3 arrêts");
  await page.getByRole("tab", { name: "Véhicules", exact: true }).click();
  await page.getByRole("button", { name: "Ajouter un véhicule" }).click();
  await page.getByLabel("Identifiant", { exact: true }).fill("BUS-TEST");
  await page.getByLabel("Ligne", { exact: true }).selectOption("99");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ajouter le véhicule" })
    .click();
  await expect(page.getByRole("heading", { name: "BUS-TEST" })).toBeVisible();
  await page.getByRole("button", { name: "Supprimer BUS-TEST" }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Supprimer", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "BUS-TEST" })).toHaveCount(0);
});

test("main screens have no automatically detected accessibility violations", async ({
  page,
}) => {
  for (const route of ["network", "journeys", "alerts", "driver", "admin"]) {
    await page.goto(`/#${route}`);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations, `Accessibility on ${route}`).toEqual([]);
  }
});

test("map controls, approach alerts and reset work without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const lineView = page
    .getByRole("group", { name: "Vue de la carte" })
    .getByRole("button", { name: "Ma ligne", exact: true });
  await lineView.click();
  await expect(lineView).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Zoom avant" }).click();
  await page.getByRole("button", { name: "Zoom arrière" }).click();
  await page.getByRole("button", { name: "Recentrer sur la ligne" }).click();
  await page
    .getByRole("combobox", { name: "À l’arrêt" })
    .selectOption("republique");
  await page.getByRole("button", { name: "M’avertir à l’approche" }).click();
  await expect(page.locator(".approach-banner")).toContainText(
    "approche de votre arrêt",
  );
  await page.getByRole("button", { name: "Aide & à propos" }).click();
  await page
    .getByRole("button", { name: "Réinitialiser la démonstration" })
    .click();
  await page
    .getByRole("button", { name: "Réinitialiser", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "M’avertir à l’approche" }),
  ).toBeVisible();
  await expect(page.locator("#stop-select")).toHaveValue("passage");
  expect(errors).toEqual([]);
});

test("mobile layout has no horizontal overflow and dialogs support Escape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator(".map-panel")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("button", { name: "Signaler un incident", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  for (const route of ["journeys", "alerts", "driver", "admin"]) {
    await page.goto(`/#${route}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
