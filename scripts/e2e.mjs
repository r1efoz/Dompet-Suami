import { chromium } from "playwright";

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

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: "networkidle" });
await page.getByRole("button", { name: "Transaksi" }).click();
await page.waitForTimeout(500);

const amount = page.locator("#entry-amount");
const entryTabs = page.getByRole("tablist", { name: "Jenis transaksi" });
const reportTabs = page.getByRole("tablist", { name: "Jenis laporan" });

// 1. Income
await amount.fill("5000000");
await page.locator("#entry-description").fill("Gaji bulanan");
await page.getByRole("button", { name: "Simpan pemasukan" }).click();

// 2. Transfer bank -> cash
await entryTabs.getByRole("tab", { name: "Transfer" }).click();
await amount.fill("1000000");
await page.locator("#entry-source").selectOption("bank");
await page.locator("#entry-destination").selectOption("cash");
await page.getByRole("button", { name: "Pindahkan dana" }).click();

// 3. Expense from cash
await entryTabs.getByRole("tab", { name: "Pengeluaran" }).click();
await amount.fill("250000");
await page.locator("#entry-source").selectOption("cash");
await page.locator("#entry-description").fill("Belanja pasar");
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();

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

await page.getByRole("button", { name: "Laporan" }).click();
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

// Seeded small-screen passes so responsive layout is reviewed with real data.
const seedTx = await page.evaluate(() =>
  localStorage.getItem("dompet-suami-transactions"),
);
const seedAcc = await page.evaluate(() =>
  localStorage.getItem("dompet-suami-accounts"),
);

async function shoot(name, width, height, colorScheme = "light") {
  const ctx = await browser.newContext({
    viewport: { width, height },
    colorScheme,
  });
  await ctx.addInitScript(
    ([tx, acc]) => {
      if (!localStorage.getItem("dompet-suami-transactions")) {
        localStorage.setItem("dompet-suami-transactions", tx);
        localStorage.setItem("dompet-suami-accounts", acc);
      }
    },
    [seedTx, seedAcc],
  );
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

await browser.close();

for (const c of checks)
  console.log(
    `${c.pass ? "ok  " : "FAIL"} ${c.name}${c.pass || !c.detail ? "" : ` -> ${c.detail}`}`,
  );
console.log(
  failures.length ? `\n${failures.length} check gagal` : "\nsemua check lulus",
);
if (failures.length) process.exitCode = 1;
