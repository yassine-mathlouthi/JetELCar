import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1362, height: 649 },
  { width: 1024, height: 600 },
  { width: 800, height: 400 },
]) {
  test(`sidebar navigation stays reachable at ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const sidebar = page.locator(".sidebar");
    const admin = sidebar.getByRole("link", {
      name: "Administration",
      exact: true,
    });
    await admin.scrollIntoViewIfNeeded();
    await expect(admin).toBeInViewport();
    await admin.click();
    await expect(page.getByLabel("Code de démonstration")).toBeVisible();

    const network = sidebar.getByRole("link", { name: "Vue du réseau" });
    await network.scrollIntoViewIfNeeded();
    await expect(network).toBeInViewport();
    await network.click();

    expect(
      await sidebar.evaluate(
        (element) => element.clientHeight <= window.innerHeight,
      ),
    ).toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  });
}
