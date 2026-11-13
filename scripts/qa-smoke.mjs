#!/usr/bin/env node
/**
 * Full-loop browser smoke test.
 *
 * Start the dev server first, then run:
 *   npm run dev
 *   npm run qa
 *
 * Set QA_BASE_URL or CHROME_PATH if the defaults do not match your machine.
 * Screenshots are written to docs/screenshots/ so the README stays in sync with
 * the current build.
 */
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SCREENSHOT_DIR = join(ROOT, "docs", "screenshots");
const BASE_URL = process.env.QA_BASE_URL ?? "http://localhost:5173";
const PORT = Number(process.env.QA_VIEWPORT_WIDTH ?? 1440);

const chromePath =
  process.env.CHROME_PATH ??
  [
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ].find((candidate) => existsSync(candidate));

if (!chromePath) {
  console.error("Chrome/Chromium not found. Set CHROME_PATH to a browser executable.");
  process.exit(1);
}

mkdirSync(SCREENSHOT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

await browser
  .defaultBrowserContext()
  .overridePermissions(new URL(BASE_URL).origin, ["clipboard-read", "clipboard-write"]);

const page = await browser.newPage();
await page.setViewport({ width: PORT, height: 1000, deviceScaleFactor: 1 });
const failures = [];
const browserErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") browserErrors.push(`console: ${message.text()}`);
});
page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));

function assert(condition, message) {
  if (!condition) {
    failures.push(message);
    console.error(`FAIL  ${message}`);
  } else {
    console.log(`ok    ${message}`);
  }
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

async function clickText(selector, text) {
  const clicked = await page.evaluate(
    (sel, needle) => {
      const node = [...document.querySelectorAll(sel)].find((candidate) =>
        candidate.textContent?.includes(needle),
      );
      if (!node) return false;
      node.click();
      return true;
    },
    selector,
    text,
  );
  if (!clicked) throw new Error(`Could not find ${selector} containing "${text}"`);
  await delay(220);
}

async function click(selector) {
  const clicked = await page.evaluate((sel) => {
    const node = document.querySelector(sel);
    if (!node) return false;
    node.click();
    return true;
  }, selector);
  if (!clicked) throw new Error(`Could not find ${selector}`);
  await delay(240);
}

async function screenshot(name) {
  await page.screenshot({ path: join(SCREENSHOT_DIR, name), fullPage: false });
  console.log(`shot  docs/screenshots/${name}`);
}

async function count(selector) {
  return page.$$eval(selector, (nodes) => nodes.length);
}

try {
  console.log(`Opening ${BASE_URL}\n`);
  await page.goto(BASE_URL, { waitUntil: "networkidle0" });
  await page.waitForSelector(".objective-card");

  assert((await count(".objective-card")) === 6, "briefing lists six mission objectives");
  assert(
    (await page.$eval("h1", (node) => node.textContent)).includes("There is no perfect spacecraft"),
    "landing hero is visible",
  );

  await clickText(".objective-card", "Earth Climate Observatory");
  await page.waitForSelector(".briefing-checkpoint .btn");
  assert(
    (await page.$eval(".briefing-checkpoint", (node) => node.textContent)).includes("SENTINEL"),
    "selected objective appears in the checkpoint",
  );
  await screenshot("briefing.png");

  await clickText(".briefing-checkpoint .btn", "Open spacecraft bay");
  await page.waitForSelector(".builder-screen");
  await page.waitForSelector(".component-card");

  async function choose(category, component) {
    await clickText(".category-rail__item", category);
    await clickText(".component-card", component);
  }

  await choose("Structure", "Explorer Bus");
  await choose("Power", "Deployable HEP Array");
  await choose("Battery", "Modular Li-ion Pack");
  await choose("Communications", "X-band Medium Gain");
  await choose("Avionics", "Rad-Hard Quad-Core");
  await choose("Attitude Control", "3-Axis Reaction Wheels");
  await clickText(".category-rail__item", "Instruments");
  await clickText(".component-card", "Multispectral Camera");
  await clickText(".component-card", "Mass Spectrometer");

  assert(
    (await page.$eval(".resource-grid", (node) => node.textContent)).includes("367 kg"),
    "builder rail computes the reference mass",
  );
  await screenshot("builder.png");

  await clickText(".builder-footer .btn", "Choose an orbit");
  await page.waitForSelector(".orbit-screen");
  await clickText(".orbit-card", "Sun-Synchronous Orbit");
  await clickText(".builder-footer .btn", "Select launch vehicle");
  await page.waitForSelector(".launch-screen");
  await clickText(".launch-card", "Falcon 9");
  await clickText(".builder-footer .btn", "Review mission");
  await page.waitForSelector(".review-screen");

  assert(
    (await page.$eval(".review-screen", (node) => node.textContent)).toLowerCase().includes("all gating checks passed"),
    "reference design passes design review",
  );
  await screenshot("review.png");

  await clickText(".review-head__actions .btn", "Save design");
  await page.waitForSelector(".toast");
  assert(
    (await page.$eval(".toast", (node) => node.textContent)).toLowerCase().includes("saved"),
    "design saves to the local hangar",
  );
  await click(".toast__close");

  await clickText(".review-head__actions .btn", "Share");
  await page.waitForSelector(".toast");
  assert(
    (await page.$eval(".toast", (node) => node.textContent)).toLowerCase().includes("share link"),
    "share action produces a design link",
  );
  await click(".toast__close");

  await clickText(".review-footer .btn", "Run mission simulation");
  await page.waitForSelector(".flight-screen");
  assert((await count(".flight-track")) === 1, "flight replay renders");
  await delay(900);
  await screenshot("flight.png");

  await clickText(".builder-footer .btn", "Open mission report");
  await page.waitForSelector(".report-screen");
  assert(
    (await page.$eval(".report-hero", (node) => node.textContent)).includes("MISSION SUCCESS"),
    "report records mission success",
  );
  assert(
    (await page.$eval(".report-screen", (node) => node.textContent)).includes("not an official NASA product"),
    "report carries the non-official disclaimer",
  );
  await screenshot("report.png");

  await clickText(".report-footer__actions .btn", "Hangar");
  await page.waitForSelector(".hangar-screen");
  assert((await count(".leaderboard__row")) >= 1, "completed run appears in the leaderboard");
  await screenshot("hangar.png");

  await clickText(".hangar-tabs button", "Saved designs");
  assert((await count(".design-card")) >= 1, "saved design appears in the hangar");
  await clickText(".hangar-tabs button", "Leaderboard");

  await clickText(".hangar-head__actions .btn", "Mission control");
  await clickText(".report-screen .builder-footer > .btn", "Tune this design");
  await page.waitForSelector(".review-screen");
  await clickText(".review-footer .btn", "Run mission simulation");
  await page.waitForSelector(".flight-screen");
  await clickText(".builder-footer .btn", "Open mission report");
  await page.waitForSelector(".report-screen");
  await clickText(".report-footer__actions .btn", "Hangar");
  await page.waitForSelector(".hangar-screen");

  const compareLabels = await page.$$eval(
    '.leaderboard__row .leaderboard__actions button[aria-label*="comparison"]',
    (nodes) => nodes.map((node) => node.getAttribute("aria-label")).filter(Boolean),
  );
  assert(compareLabels.length >= 2, "two runs are available for comparison");
  if (compareLabels.length >= 2) {
    await click(
      '.leaderboard__row:nth-child(1) .leaderboard__actions button[aria-label*="comparison"]',
    );
    await delay(220);
    await click(
      '.leaderboard__row:nth-child(2) .leaderboard__actions button[aria-label*="comparison"]',
    );
    await delay(250);
    await clickText(".leaderboard-foot .btn", "Compare 2 runs");
    await page.waitForSelector(".compare-table");
    assert(
      (await page.$eval(".compare-table", (node) => node.textContent)).includes("Mission cost"),
      "compare table renders recomputed metrics",
    );
    await screenshot("compare.png");
  }

  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".topbar");
  await clickText(".topbar__hangar", "Hangar");
  await page.waitForSelector(".hangar-screen");
  assert((await count(".leaderboard__row")) >= 2, "runs persist across a full page reload");

  await click(".leaderboard__actions .icon-btn:nth-child(2)");
  await page.waitForSelector(".report-screen");
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await delay(350);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assert(overflow <= 1, `mobile report has no horizontal overflow (${overflow}px)`);
  await screenshot("mobile-report.png");

  const bodyText = await page.evaluate(() => document.body.innerText);
  assert(!bodyText.includes("NaN"), "page contains no NaN values");
  assert(!bodyText.includes("undefined"), "page contains no raw undefined values");
  assert(browserErrors.length === 0, `browser console is clean (${browserErrors.length} errors)`);
} catch (error) {
  failures.push(error.message);
  console.error(`\nFATAL  ${error.message}`);
  await page
    .screenshot({ path: join(SCREENSHOT_DIR, "qa-failure.png"), fullPage: false })
    .catch(() => {});
} finally {
  if (browserErrors.length > 0) {
    console.error("\nBrowser errors:");
    for (const error of browserErrors) console.error(`  ${error}`);
  }
  await browser.close();
}

if (failures.length > 0) {
  console.error(`\nQA failed with ${failures.length} failure(s).`);
  process.exit(1);
}

console.log("\nQA passed. Full mission loop, persist, compare and mobile checks are healthy.");
