import { test, expect } from "@playwright/test";

test.describe("Site intro curtain", () => {
  test("plays the full sequence on first load", async ({ page }) => {
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    // Curtain is present shortly after load (client-side effect runs
    // synchronously before paint, so the first DOM snapshot includes it).
    const curtain = page.locator("[data-vox-intro-curtain]");
    await expect(curtain).toBeVisible({ timeout: 1500 });

    // Wait for the nav logo to become visible (handoff complete).
    const navLogo = page.locator("[data-vox-logo] img");
    await expect(navLogo).toBeVisible();
    await expect(navLogo).toHaveCSS("opacity", "1", { timeout: 6000 });

    const elapsed = Date.now() - t0;
    // Total should fall within the hybrid gate window + some slack for
    // test harness overhead. Lower bound is the min hold (1000ms).
    expect(elapsed).toBeGreaterThanOrEqual(1000);
    expect(elapsed).toBeLessThanOrEqual(6000);

    // Curtain should have detached after handoff.
    await expect(curtain).toHaveCount(0, { timeout: 2000 });

    // Cards are visible and clickable.
    const firstCard = page.locator("[data-project-id]").first();
    await expect(firstCard).toBeVisible();
  });

  test("respects prefers-reduced-motion", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    const t0 = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });

    const navLogo = page.locator("[data-vox-logo] img");
    await expect(navLogo).toHaveCSS("opacity", "1", { timeout: 4000 });

    const elapsed = Date.now() - t0;
    // Reduced motion collapses the full sequence — still bounded by the
    // min hold (1000ms) because the gate still enforces it, plus the
    // reduced-motion fade. Generous ceiling for CI flakiness.
    expect(elapsed).toBeLessThanOrEqual(4000);

    await context.close();
  });
});
