import { chromium } from "playwright";
import { execSync } from "node:child_process";

execSync('psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -v ON_ERROR_STOP=1 -f supabase/seed.e2e.sql', { env: { ...process.env, PGPASSWORD: 'postgres' }, stdio: 'inherit' });

const OUT = "/private/var/folders/bd/z0zk8jyn4kddph4bgxkctfhw0000gn/T/opencode";
const failures = [];
const checks = [];

function check(name, pass, detail = "") {
  checks.push({ name, pass, detail });
  if (!pass) failures.push(`${name}${detail ? ` (${detail})` : ""}`);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1400 },
});
const page = await context.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on(
  "console",
  (m) => m.type() === "error" && errors.push(`console: ${m.text()}`),
);

// Guard: e2e menulis data. Hentikan sebelum menyentuh apa pun bila app tidak memakai Supabase lokal.
page.on("request", (req) => {
  const url = new URL(req.url());
  if (url.pathname.startsWith("/rest/v1") && url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    console.error(`E2E DIBATALKAN: app mengarah ke ${url.origin}, bukan Supabase lokal. Periksa .env.local.`);
    process.exit(2);
  }
});

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.locator('nav[aria-label="Navigasi atas"]').getByRole("button", { name: "Transaksi", exact: true }).click();
await page.waitForTimeout(500);

const amount = page.locator("#entry-amount");
const entryTabs = page.getByRole("tablist", { name: "Jenis transaksi" });
const reportTabs = page.getByRole("tablist", { name: "Jenis laporan" });

// 1. Income
await amount.fill("5000000");
await page.locator("#entry-description").fill("Gaji bulanan");
await page.getByRole("button", { name: "Simpan pemasukan" }).click();
await page.locator("[aria-live]").getByText("Pemasukan dicatat.").waitFor();

// 2. Transfer bank -> cash
await entryTabs.getByRole("tab", { name: "Transfer" }).click();
await amount.fill("1000000");
await page.locator("#entry-source").selectOption("bank");
await page.locator("#entry-destination").selectOption("cash");
await page.getByRole("button", { name: "Pindahkan dana" }).click();
await page.locator("[aria-live]").getByText("Transfer dicatat.").waitFor();

// 3. Expense from cash
await entryTabs.getByRole("tab", { name: "Pengeluaran" }).click();
await amount.fill("250000");
await page.locator("#entry-source").selectOption("cash");
await page.locator("#entry-description").fill("Belanja pasar");
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
await page.locator("[aria-live]").getByText("Pengeluaran dicatat.").waitFor();

await page.waitForTimeout(400);

const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
check("saldo bank 4.000.000", /Rp\s?4\.000\.000/.test(text));
check("saldo tunai 750.000", /Rp\s?750\.000/.test(text));
check("no console errors", errors.length === 0, errors.join(" | "));

// History must show account names, not raw ids.
const historySource = await page
  .locator("#ledger-heading")
  .locator("..")
  .locator("..")
  .innerText();
check(
  "riwayat pakai nama akun",
  !/\bcash\b|\bbank\b/.test(historySource),
  historySource.slice(0, 200).replace(/\n/g, " / "),
);

await page.screenshot({ path: `${OUT}/dompet-desktop.png`, fullPage: true });

await page.locator('nav[aria-label="Navigasi atas"]').getByRole("button", { name: "Laporan", exact: true }).click();
await page.waitForTimeout(500);

// Ledger tab: state and content must agree.
await reportTabs.getByRole("tab", { name: "Buku" }).click();
await page.waitForTimeout(300);

const selectedReports = await reportTabs
  .locator('[role="tab"][aria-selected="true"]')
  .allInnerTexts();
check(
  "tab buku besar aktif",
  selectedReports.length === 1 && /buku/i.test(selectedReports[0]),
  selectedReports.join(","),
);
check(
  "isi buku besar tampil",
  await page.locator("#ledger-account").isVisible(),
);

await page.screenshot({ path: `${OUT}/dompet-ledger.png`, fullPage: true });

// Responsive layout uses the database seed loaded at startup.
async function shoot(name, width, height, colorScheme = "light") {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme,
  });
  const p = await ctx.newPage();
  const viewportErrors = [];
  p.on("pageerror", (e) => viewportErrors.push(e.message));
  await p.goto("http://localhost:5173/", { waitUntil: "networkidle" });
  await p.waitForTimeout(300);

  const metrics = await p.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  check(
    `${name} tanpa scroll horizontal`,
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `${metrics.scrollWidth} > ${metrics.clientWidth}`,
  );
  check(
    `${name} tanpa error`,
    viewportErrors.length === 0,
    viewportErrors.join(" | "),
  );
  check(
    `${name} data tampil`,
    /Rp\s?4\.750\.000/.test(
      (await p.locator("body").innerText()).replace(/\s+/g, " "),
    ),
  );

  await p.screenshot({ path: `${OUT}/dompet-${name}.png`, fullPage: true });
  await ctx.close();
}

await shoot("mobile", 390, 844);
await shoot("tablet", 834, 1112);
await shoot("dark", 1440, 1200, "dark");

// UI primitives demo: selection, dialog keyboard dismissal, and toast lifecycle.
const demoPage = await context.newPage();
await demoPage.goto("http://localhost:5173/#demo", { waitUntil: "networkidle" });
const demoTabs = demoPage.getByRole("tablist", { name: "Demo segmented" });
const demoFirst = demoTabs.getByRole("tab").nth(0);
const demoSecond = demoTabs.getByRole("tab").nth(1);
await demoSecond.click();
check("demo segmented selection", await demoSecond.getAttribute("aria-selected") === "true" && await demoFirst.getAttribute("aria-selected") === "false");
await demoPage.getByRole("button", { name: "Buka sheet demo" }).click();
check("demo sheet opens", await demoPage.getByRole("dialog").isVisible());
await demoPage.keyboard.press("Escape");
check("demo sheet closes with Escape", await demoPage.getByRole("dialog").count() === 0);
await demoPage.getByRole("button", { name: "Tampilkan toast demo" }).click();
check("demo toast appears", await demoPage.getByText("Toast demo.").isVisible());
await demoPage.waitForTimeout(3000);
check("demo toast disappears", await demoPage.getByText("Toast demo.").count() === 0);

// Task 3 shell acceptance checks.
const shellPage = await context.newPage();
await shellPage.setViewportSize({ width: 375, height: 812 });
await shellPage.goto("http://localhost:5173/", { waitUntil: "networkidle" });
const shellBody = (await shellPage.locator("body").innerText()).replace(/\s+/g, " ");
check("shell tanpa teks Supabase", !/Supabase/i.test(shellBody));
const bottomNav = shellPage.locator('nav[aria-label="Navigasi bawah"]');
const reportNav = bottomNav.getByRole("button", { name: "Laporan", exact: true });
const reportNavBox = await reportNav.boundingBox();
check("bottom nav Laporan terlihat di bawah", !!reportNavBox && reportNavBox.y > 700);
await shellPage.getByRole("button", { name: "Catat transaksi", exact: true }).click();
check("FAB membuka jumlah transaksi dan fokus jumlah", await shellPage.locator("#entry-amount").evaluate((el) => document.activeElement === el));
const desktopShell = await context.newPage();
await desktopShell.setViewportSize({ width: 1440, height: 900 });
await desktopShell.goto("http://localhost:5173/", { waitUntil: "networkidle" });
check("desktop tidak render bottom nav", await desktopShell.locator('nav[aria-label="Navigasi bawah"]').count() === 0);
check("desktop render top nav", await desktopShell.locator('nav[aria-label="Navigasi atas"]').count() === 1);

await browser.close();

for (const c of checks)
  console.log(
    `${c.pass ? "ok  " : "FAIL"} ${c.name}${c.pass || !c.detail ? "" : ` -> ${c.detail}`}`,
  );
console.log(
  failures.length ? `\n${failures.length} check gagal` : "\nsemua check lulus",
);
if (failures.length) process.exitCode = 1;
