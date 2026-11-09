import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";

const base = process.env.VISUAL_BASE_URL || "http://localhost:3200";
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const output = path.join(process.cwd(), ".qa");
fs.mkdirSync(output, { recursive: true });

const browser = await chromium.launch({ executablePath: chromePath, headless: true });
const issues = [];

async function pageFor(viewport = { width: 1440, height: 1000 }) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
  });
  const page = await context.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") {
      issues.push(`console ${page.url()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => issues.push(`pageerror ${page.url()}: ${error.message}`));
  page.on("requestfailed", (request) => {
    const error = request.failure()?.errorText ?? "";
    const cancelledPrefetch = error.includes("ERR_ABORTED") && request.url().includes("_rsc=");
    if (!request.url().includes("images.unsplash.com") && !cancelledPrefetch) {
      issues.push(`requestfailed ${request.url()}: ${error}`);
    }
  });
  return { context, page };
}

const publicContext = await pageFor();
const page = publicContext.page;

await page.goto(base, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(output, "home-desktop.png"), fullPage: false });
const heroHeading = await page.locator("h1").first().innerText();
if (!heroHeading.toLowerCase().includes("space")) issues.push("home hero heading missing");

await page.goto(`${base}/explore`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(output, "explore-desktop.png"), fullPage: false });
const cards = await page.locator(".facility-card").count();
if (cards < 1) issues.push("explore produced no facility cards");

await page.goto(`${base}/facilities/auditorium-utama`, { waitUntil: "networkidle" });
await page.screenshot({ path: path.join(output, "detail-desktop.png"), fullPage: false });
const panelVisible = await page.locator(".booking-panel").isVisible();
if (!panelVisible) issues.push("booking panel not visible");

for (const [name, pathname] of [
  ["help", "/help"],
  ["tutorial", "/tutorial"],
  ["emergency", "/emergency"],
  ["locations", "/locations"],
  ["premium-detail", "/facilities/gor-indoor"],
]) {
  await page.goto(`${base}${pathname}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: false });
  if (!(await page.locator("h1").first().isVisible())) issues.push(`${name} heading missing`);
  if (name === "premium-detail" && !(await page.getByText(/300\.000/).first().isVisible())) {
    issues.push("premium tariff not visible");
  }
}

const mobile = await pageFor({ width: 390, height: 844 });
await mobile.page.goto(base, { waitUntil: "networkidle" });
await mobile.page.screenshot({ path: path.join(output, "home-mobile.png"), fullPage: false });
const overflow = await mobile.page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
if (overflow > 2) issues.push(`mobile horizontal overflow: ${overflow}px`);
await mobile.page.goto(`${base}/facilities/auditorium-utama`, { waitUntil: "networkidle" });
await mobile.page.screenshot({ path: path.join(output, "detail-mobile.png"), fullPage: false });
const mobileOverflow = await mobile.page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
if (mobileOverflow > 2) issues.push(`mobile detail horizontal overflow: ${mobileOverflow}px`);
await mobile.context.close();

const student = await pageFor();
await student.page.goto(`${base}/login`, { waitUntil: "networkidle" });
await student.page.fill('input[type="email"]', "mahasiswa@its-space.id");
await student.page.fill('input[type="password"]', "Mahasiswa#2026");
await student.page.click('button[type="submit"]');
await student.page.waitForURL("**/dashboard", { timeout: 20_000 });
await student.page.waitForLoadState("networkidle");
await student.page.screenshot({ path: path.join(output, "dashboard.png"), fullPage: false });
if (!student.page.url().includes("/dashboard")) issues.push("student login did not reach dashboard");
await student.page.goto(`${base}/settings`, { waitUntil: "networkidle" });
await student.page.screenshot({ path: path.join(output, "settings.png"), fullPage: false });
if (!(await student.page.locator(".settings-form").first().isVisible())) issues.push("profile settings form not visible");
await student.context.close();

const admin = await pageFor();
await admin.page.goto(`${base}/login`, { waitUntil: "networkidle" });
await admin.page.fill('input[type="email"]', "admin@its-space.id");
await admin.page.fill('input[type="password"]', "Admin#2026");
await admin.page.click('button[type="submit"]');
await admin.page.waitForURL("**/admin", { timeout: 20_000 });
await admin.page.waitForLoadState("networkidle");
await admin.page.screenshot({ path: path.join(output, "admin.png"), fullPage: false });
if (!admin.page.url().includes("/admin")) issues.push("admin login did not reach admin");
const queueVisible = await admin.page.locator("#antrean").isVisible();
if (!queueVisible) issues.push("admin approval queue not visible");
await admin.context.close();

await publicContext.context.close();
await browser.close();

if (issues.length) {
  console.log("VISUAL ISSUES");
  for (const issue of issues) console.log("-", issue);
  process.exitCode = 1;
} else {
  console.log("Visual checks passed: public pages, premium tariff, mobile, settings, dashboard, admin.");
}
console.log(`Screenshots: ${output}`);
