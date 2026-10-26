import { revealMoment } from "./helpers/moments";
import { test, expect, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidenceDir = "../output/playwright/turn-of-play";
const runtime = new URL(process.env.MATCHPULSE_TEST_URL ?? "http://127.0.0.1:5173").port === "4173" ? "production" : "development";

async function trackBootstrap(page: Page, saved?: string, storageUnavailable = false) {
  await page.addInitScript(({ savedTheme, unavailable }) => {
    if (unavailable) {
      Object.defineProperty(window, "localStorage", {
        configurable: true,
        get() { throw new Error("storage unavailable"); },
      });
    } else if (savedTheme !== undefined) {
      try {
        if (localStorage.getItem("turn-of-play.theme") === null) {
          localStorage.setItem("turn-of-play.theme", savedTheme);
        }
      } catch { /* test setup */ }
    }
    (window as Window & { __themeBootLog?: string[] }).__themeBootLog = [];
    new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName === "data-theme") {
          (window as Window & { __themeBootLog?: string[] }).__themeBootLog?.push(
            document.documentElement.dataset.theme ?? "",
          );
        }
      }
    }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  }, { savedTheme: saved, unavailable: storageUnavailable });
}

async function ready(page: Page) {
  await page.goto("/?scenario=line-shift");
  await expect(page.getByRole("main", { name: "Broadcast Theatre" })).toBeVisible();
  await expect(page.getByTestId("clock")).toHaveText("56:00");
  await expect(page.locator(".theatre-source")).toHaveText("Recorded replay");
  await expect(page.locator(".theme-toggle")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const sizes = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(sizes.scrollWidth).toBeLessThanOrEqual(sizes.width + 1);
}

test("saved light and dark themes boot before React and render self-hosted fonts", async ({ browser }, info) => {
  await mkdir(evidenceDir, { recursive: true });
  for (const theme of ["light", "dark"] as const) {
    const page = await browser.newPage({ viewport: info.project.use.viewport });
    await trackBootstrap(page, theme);
    await ready(page);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(page.getByRole("button", { name: theme === "dark" ? "Switch to light theme" : "Switch to dark theme" })).toBeVisible();
    const bootstrapIsBeforeReact = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      const bootstrap = scripts.find((script) => script.src.endsWith("/theme-bootstrap.js"));
      const app = scripts.find((script) => script.type === "module" && script.getAttribute("src") &&
        (script.src.includes("/src/main.tsx") || /\/assets\/index-[^/]+\.js/.test(new URL(script.src).pathname)));
      return !!bootstrap && !!app && bootstrap.parentElement === document.head &&
        [document.head, document.body].includes(app.parentElement!) &&
        scripts.indexOf(bootstrap) < scripts.indexOf(app);
    });
    expect(bootstrapIsBeforeReact).toBe(true);
    const fontState = await page.evaluate(async () => {
      await document.fonts.ready;
      return {
        outfit: document.fonts.check('700 24px "Outfit Variable"'),
        body: document.fonts.check('400 14px "DM Sans Variable"'),
      };
    });
    expect(fontState).toEqual({ outfit: true, body: true });
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      animations: "disabled",
      path: `${evidenceDir}/${runtime}-${info.project.name}-${theme}.png`,
      fullPage: true,
    });
    await page.close();
  }
});

test("system preference, invalid storage and unavailable storage use the fallback order", async ({ browser }, info) => {
  for (const setup of [
    { color: "dark" as const },
    { color: "light" as const, saved: "sepia" },
    { color: "dark" as const, unavailable: true },
  ]) {
    const page = await browser.newPage({ viewport: info.project.use.viewport });
    await page.emulateMedia({ colorScheme: setup.color });
    await trackBootstrap(page, setup.saved, setup.unavailable);
    await ready(page);
    const expected = setup.saved ? "light" : setup.color;
    await expect(page.locator("html")).toHaveAttribute("data-theme", expected);
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", expected === "dark" ? "#130A1B" : "#F7F3FF");
    if (!setup.saved && !setup.unavailable) {
      await page.emulateMedia({ colorScheme: "light" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await page.getByRole("button", { name: "Switch to dark theme" }).click();
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    }
    if (setup.unavailable) {
      await page.getByRole("button", { name: "Switch to light theme" }).click();
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
      await page.emulateMedia({ colorScheme: "dark" });
      await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    }
    await page.close();
  }
});

test("keyboard toggle persists the explicit preference after reload", async ({ page }) => {
  await trackBootstrap(page, "light");
  await ready(page);
  const toggle = page.getByRole("button", { name: "Switch to dark theme" });
  await toggle.focus();
  await page.keyboard.press("Space");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("turn-of-play.theme"))).toBe("dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Switch to light theme" })).toBeVisible();
});

test("selected Investigate story metadata meets normal-text contrast", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Investigate", exact: true }).click();
  const metadata = page.locator(".scenario-button.chosen small");
  await expect(metadata).toHaveText("Observed tracking");
  const ratio = await metadata.evaluate((element) => {
    const channels = (value: string) => value.match(/[0-9.]+/g)!.slice(0, 3).map(Number);
    const luminance = (value: string) => {
      const [r, g, b] = channels(value).map((channel) => {
        const normalized = channel / 255;
        return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const foreground = luminance(getComputedStyle(element).color);
    const background = luminance(getComputedStyle(element.closest(".scenario-button")!).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("theme changes preserve selected incident, replay time, proof and do not refetch", async ({ page }, info) => {
  await mkdir(evidenceDir, { recursive: true });
  await trackBootstrap(page, "light");
  await ready(page);
  const requests: string[] = [];
  page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/")) requests.push(request.url()); });
  const incident = page.locator(".md-moments [data-story-id]").first();
  const incidentId = await incident.getAttribute("data-story-id");
  await (await revealMoment(page,incidentId!)).click();
  await expect(page.locator(".md-moments [aria-current='true']")).toHaveAttribute("data-story-id", incidentId!);
  const replayTime = await page.getByTestId("clock").innerText();
  await page.getByRole("button", { name: "Open Proof Lens" }).click();
  await expect(page.getByRole("dialog", { name: /Proof Lens/ })).toBeVisible();
  await expect(page.locator(".proof-summary h3")).toBeVisible();
  const section = await page.locator(".proof-drawer").getAttribute("data-section");
  expect(section).not.toBeNull();
  await page.screenshot({ animations: "disabled", path: `${evidenceDir}/${runtime}-${info.project.name}-light-proof.png`, fullPage: true });
  await page.getByRole("button", { name: "Switch to dark theme" }).last().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".proof-drawer")).toBeVisible();
  await expect(page.locator(".proof-drawer")).toHaveAttribute("data-section", section!);
  await expect(page.getByTestId("clock")).toHaveText(replayTime);
  await expect(page.locator(".md-moments [aria-current='true']")).toHaveAttribute("data-story-id", incidentId!);
  await expect(page.getByRole("button", { name: "Switch to light theme" }).last()).toBeVisible();
  await expect(page.locator("meta[name='theme-color']")).toHaveAttribute("content", "#130A1B");
  await page.screenshot({ animations: "disabled", path: `${evidenceDir}/${runtime}-${info.project.name}-dark-proof.png`, fullPage: true });
  expect(requests.length).toBeGreaterThan(0);
  const requestCount = requests.length;
  await page.waitForTimeout(250);
  expect(requests).toHaveLength(requestCount);
});
