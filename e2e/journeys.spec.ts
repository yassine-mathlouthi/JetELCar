import { expect, test } from "@playwright/test";

for (const field of ["Départ", "Destination"]) {
  test(`changing ${field} clears outdated journeys and expanded steps`, async ({
    page,
  }) => {
    await page.goto("/#journeys");
    await page.getByRole("button", { name: "Rechercher un trajet" }).click();
    await expect(page.locator(".journey-card").first()).toBeVisible();
    await page.getByRole("button", { name: "Voir les étapes" }).first().click();
    await expect(page.locator(".journey-card.chosen")).toHaveCount(1);

    await page.getByLabel(field, { exact: true }).selectOption("marine");
    await expect(page.locator(".journey-card")).toHaveCount(0);
    await expect(
      page.getByRole("heading", {
        name: "Voyagez avec un peu plus de visibilité.",
      }),
    ).toBeVisible();

    await page.getByLabel("Départ", { exact: true }).selectOption("marine");
    await page.getByLabel("Destination", { exact: true }).selectOption("marsa");
    await page.getByRole("button", { name: "Rechercher un trajet" }).click();
    await expect(page.locator(".journey-card").first()).toContainText(
      "Tunis Marine",
    );
    await expect(page.locator(".journey-card.chosen")).toHaveCount(0);
  });
}
