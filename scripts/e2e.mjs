import { chromium } from "playwright";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const psql = (args) => execSync(`psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -v ON_ERROR_STOP=1 -At ${args}`, { env: { ...process.env, PGPASSWORD: "postgres" } }).toString().trim();

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

// Auth: local-only test user (signup is open on the local stack), then log in through the UI.
const envLocal = Object.fromEntries(readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]));
const SB_URL = envLocal.VITE_SUPABASE_URL;
const SB_KEY = envLocal.VITE_SUPABASE_ANON_KEY;
const E2E_USER = { email: "e2e@example.com", password: "e2e-pass-123" };
const OTHER_USER = { email: "other@example.com", password: "other-pass-123" };
for (const u of [E2E_USER, OTHER_USER]) await fetch(`${SB_URL}/auth/v1/signup`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(u) });
const uidOf = (email) => psql(`-c "select id from auth.users where email='${email}'"`);
execSync(`psql -h 127.0.0.1 -p 55322 -U postgres -d postgres -v ON_ERROR_STOP=1 -v uid=${uidOf(E2E_USER.email)} -v other=${uidOf(OTHER_USER.email)} -f supabase/seed.e2e.sql`, { env: { ...process.env, PGPASSWORD: "postgres" }, stdio: "inherit" });
const anonRows = await (await fetch(`${SB_URL}/rest/v1/accounts?select=id`, { headers: { apikey: SB_KEY } })).json();
check("anon tidak bisa membaca akun", Array.isArray(anonRows) && anonRows.length === 0, JSON.stringify(anonRows).slice(0, 80));

await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
check("tanpa sesi tampil halaman masuk", await page.getByRole("button", { name: "Masuk", exact: true }).isVisible());
check("tanpa sesi nav tidak tampil", (await page.locator('nav[aria-label="Navigasi atas"]').count()) === 0);
await page.getByRole("button", { name: "Lupa kata sandi?" }).click();
check("lupa sandi minta email dulu", await page.getByText("Isi email dulu.").isVisible());
await page.getByLabel("Email").fill(E2E_USER.email);
await page.getByLabel("Kata sandi").fill("salah-total");
await page.getByRole("button", { name: "Masuk", exact: true }).click();
await page.getByText("Email atau kata sandi salah.").waitFor();
check("sandi salah ditolak", true);
errors.length = 0; // the 400 from the deliberate bad login is expected
await page.getByLabel("Kata sandi").fill(E2E_USER.password);
await page.getByRole("button", { name: "Masuk", exact: true }).click();
await page.locator('nav[aria-label="Navigasi atas"]').waitFor();
check("data orang lain tidak tampil", (await page.getByText("Akun Orang Lain").count()) === 0);
const tokenRes = await (await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(E2E_USER) })).json();
const mine = await (await fetch(`${SB_URL}/rest/v1/accounts?select=id`, { headers: { apikey: SB_KEY, authorization: `Bearer ${tokenRes.access_token}` } })).json();
check("RLS: hanya akun milik sendiri", Array.isArray(mine) && mine.length === 3 && !mine.some((a) => a.id === "other-acc"), JSON.stringify(mine).slice(0, 100));
const authState = await context.storageState();
const newContext = browser.newContext.bind(browser);
browser.newContext = (opts = {}) => newContext({ storageState: authState, ...opts });
await page.locator('nav[aria-label="Navigasi atas"]').getByRole("button", { name: "Transaksi", exact: true }).click();
await page.waitForTimeout(500);

const amount = page.locator("#entry-amount");
const entryTabs = page.getByRole("tablist", { name: "Jenis transaksi" });
const reportTabs = page.getByRole("tablist", { name: "Jenis laporan" });

const toastOf = (text) => page.getByRole("status").getByText(text);

// 1. Income
check("mode default Keluar", (await entryTabs.getByRole("tab", { name: "Keluar" }).getAttribute("aria-selected")) === "true");
await entryTabs.getByRole("tab", { name: "Masuk" }).click();
await amount.fill("5000000");
await page.locator("#entry-description").fill("Gaji bulanan");
await page.getByRole("button", { name: "Simpan pemasukan" }).click();
await toastOf("Pemasukan dicatat.").waitFor();

// 2. Transfer bank -> cash
await entryTabs.getByRole("tab", { name: "Transfer" }).click();
await amount.fill("1000000");
await page.locator("#entry-source").selectOption("bank");
await page.locator("#entry-destination").selectOption("cash");
await page.getByRole("button", { name: "Pindahkan dana" }).click();
await toastOf("Transfer dicatat.").waitFor();

// 2b. Transfer ke akun yang sama ditolak
await amount.fill("1000");
await page.locator("#entry-destination").selectOption("bank");
await page.getByRole("button", { name: "Pindahkan dana" }).click();
check("transfer akun sama ditolak", await page.getByText("Akun tujuan harus berbeda.").isVisible());

// 3. Expense from cash
await entryTabs.getByRole("tab", { name: "Keluar" }).click();
await amount.fill("250000");
await page.locator("#entry-source").selectOption("cash");
await page.locator("#entry-description").fill("Belanja pasar");
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
await toastOf("Pengeluaran dicatat.").waitFor();

// 3b. Hapus lewat sheet detail → konfirmasi
await amount.fill("1000");
await page.locator("#entry-description").fill("Uji hapus");
await page.getByRole("button", { name: "Simpan pengeluaran" }).click();
await toastOf("Pengeluaran dicatat.").waitFor();
await page.getByText("Uji hapus", { exact: true }).click();
const detail = page.getByRole("dialog");
check("detail sheet punya tombol Hapus", await detail.getByRole("button", { name: "Hapus", exact: true }).isVisible());
await detail.getByRole("button", { name: "Hapus", exact: true }).click();
await page.getByRole("dialog").getByRole("button", { name: "Hapus permanen" }).click();
await toastOf("Transaksi dihapus.").waitFor();
check("baris terhapus tanpa reload", (await page.getByText("Uji hapus", { exact: true }).count()) === 0);

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
await reportTabs.getByRole("tab", { name: "Buku besar" }).click();
await page.waitForTimeout(300);

const selectedReports = await reportTabs
  .locator('[role="tab"][aria-selected="true"]')
  .allInnerTexts();
check(
  "tab buku besar aktif",
  selectedReports.length === 1 && /buku besar/i.test(selectedReports[0]),
  selectedReports.join(","),
);
check(
  "isi buku besar tampil",
  await page.locator("#ledger-account").isVisible(),
);

await page.screenshot({ path: `${OUT}/dompet-ledger.png`, fullPage: true });

// Task 8: Laporan acceptance.
const topNav = page.locator('nav[aria-label="Navigasi atas"]');
await topNav.getByRole("button", { name: "Home", exact: true }).click();
await page.waitForTimeout(300);
const homeTotal = await page.locator('[data-testid="home-total"]').getAttribute("data-value");
await topNav.getByRole("button", { name: "Laporan", exact: true }).click();
await reportTabs.getByRole("tab", { name: "Saldo akun" }).click();
await page.waitForTimeout(300);
const balanceTotal = await page.locator('[data-testid="balance-total"] td:last-child').getAttribute("data-value");
check("Saldo akun total = total Home", balanceTotal === homeTotal, `${balanceTotal} vs ${homeTotal}`);
for (const tab of ["Arus kas", "Kategori", "Saldo akun", "Buku besar"]) {
  await reportTabs.getByRole("tab", { name: tab }).click();
  const body = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  check(`laporan ${tab} tanpa Neraca/Debit/Kredit`, !/Neraca|Debit|Kredit/.test(body));
}
await reportTabs.getByRole("tab", { name: "Arus kas" }).click();
await page.getByRole("button", { name: "⤓ CSV" }).click();
const [download] = await Promise.all([
  page.waitForEvent("download"),
  page.getByRole("dialog").getByRole("button").first().click(),
]);
check("CSV bernama dompet-suami-", download.suggestedFilename().startsWith("dompet-suami-"), download.suggestedFilename());
await page.keyboard.press("Escape");

// Task 9: Master acceptance.
await topNav.getByRole("button", { name: "Master", exact: true }).click();
const accSection = page.locator("section", { hasText: "Akun ·" });
await accSection.getByRole("button", { name: "+ Tambah" }).click();
let dlg = page.getByRole("dialog");
await dlg.getByLabel("Nama").fill("bank");
await dlg.getByRole("button", { name: "Simpan" }).click();
check("nama duplikat ditolak", await dlg.getByText("Nama sudah dipakai.").isVisible());
await dlg.getByLabel("Nama").fill("Dompet Uji");
await dlg.getByRole("tab", { name: "Tunai" }).click();
await dlg.getByRole("button", { name: "Simpan" }).click();
await toastOf("Disimpan.").waitFor();
check("akun baru muncul", (await accSection.getByText("Dompet Uji", { exact: true }).count()) === 1);
await accSection.locator("button", { hasText: "Bank" }).first().click();
check("edit akun mengisi nama", (await page.getByRole("dialog").getByLabel("Nama").inputValue()) === "Bank");
check("hapus akun bertransaksi disabled", await page.getByRole("dialog").getByRole("button", { name: /^Hapus akun/ }).isDisabled());
await page.keyboard.press("Escape");
await accSection.locator("button", { hasText: "Dompet Uji" }).click();
await page.getByRole("dialog").getByRole("button", { name: /^Hapus akun/ }).click();
await page.getByRole("dialog").getByRole("button", { name: "Hapus", exact: true }).click();
await toastOf("Dihapus.").waitFor();
check("akun terhapus", (await accSection.getByText("Dompet Uji", { exact: true }).count()) === 0);
await page.reload();
await topNav.getByRole("button", { name: "Master", exact: true }).click();
check("akun terhapus setelah reload", (await page.getByText("Dompet Uji", { exact: true }).count()) === 0);

check("Master menampilkan email", await page.getByText(E2E_USER.email).isVisible());
check("Master punya tombol Keluar", await page.getByRole("button", { name: "Keluar", exact: true }).isVisible());

// First login of a new user seeds private defaults with unique ids.
const FRESH = { email: `fresh${Date.now()}@example.com`, password: "fresh-pass-123" };
await fetch(`${SB_URL}/auth/v1/signup`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(FRESH) });
const freshCtx = await newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 900 } });
const freshPage = await freshCtx.newPage();
await freshPage.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await freshPage.getByLabel("Email").fill(FRESH.email);
await freshPage.getByLabel("Kata sandi").fill(FRESH.password);
await freshPage.getByRole("button", { name: "Masuk", exact: true }).click();
await freshPage.locator('nav[aria-label="Navigasi atas"]').waitFor();
await freshPage.waitForTimeout(1500);
const freshToken = await (await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(FRESH) })).json();
const freshAccs = await (await fetch(`${SB_URL}/rest/v1/accounts?select=id,name`, { headers: { apikey: SB_KEY, authorization: `Bearer ${freshToken.access_token}` } })).json();
check("pengguna baru dapat 3 akun default", Array.isArray(freshAccs) && freshAccs.length === 3, JSON.stringify(freshAccs).slice(0, 100));
check("id default unik (bukan 'bank')", Array.isArray(freshAccs) && !freshAccs.some((a) => ["bank", "cash", "ewallet"].includes(a.id)));
// Invite/recovery landing: hash type=recovery with a live session asks for a (different) new password.
await freshPage.goto("http://localhost:5173/#type=recovery");
await freshPage.reload({ waitUntil: "networkidle" }); // hash-only goto does not reload, and real links open a fresh load
check("recovery menampilkan buat kata sandi", await freshPage.getByRole("heading", { name: "Buat kata sandi" }).isVisible());
await freshPage.getByLabel("Kata sandi baru").fill("pendek");
await freshPage.getByRole("button", { name: "Simpan dan lanjut" }).click();
check("kata sandi pendek ditolak", await freshPage.getByText("Kata sandi minimal 8 karakter.").isVisible());
await freshPage.getByLabel("Kata sandi baru").fill("fresh-pass-456");
await freshPage.getByRole("button", { name: "Simpan dan lanjut" }).click();
await freshPage.locator('nav[aria-label="Navigasi atas"]').waitFor();
check("setelah set sandi masuk aplikasi", true);

// Account menu (top right): change password, then sign out.
await freshPage.getByRole("button", { name: "Menu akun" }).click();
check("menu akun menampilkan email", await freshPage.getByRole("menu").getByText(FRESH.email).isVisible());
await freshPage.getByRole("menuitem", { name: "Ubah kata sandi" }).click();
await freshPage.getByLabel("Kata sandi baru").fill("fresh-pass-456");
await freshPage.getByRole("dialog").getByRole("button", { name: "Simpan" }).click();
await freshPage.getByText("Kata sandi baru harus berbeda dari yang lama.").waitFor();
check("sandi sama ditolak", true);
errors.length = 0; // supabase answers the rejected update with a 422
await freshPage.getByLabel("Kata sandi baru").fill("fresh-pass-789");
await freshPage.getByRole("dialog").getByRole("button", { name: "Simpan" }).click();
await freshPage.getByRole("status").getByText("Kata sandi diubah.").waitFor();
await freshPage.getByRole("button", { name: "Menu akun" }).click();
await freshPage.getByRole("menuitem", { name: "Keluar" }).click();
await freshPage.getByRole("button", { name: "Masuk", exact: true }).waitFor();
check("keluar kembali ke halaman masuk", true);
await freshCtx.close();

// The Queen: owner shares read-only access with the wife (OTHER_USER), who logs in and only sees.
check("Master punya seksi The Queen", await page.getByText("The Queen", { exact: false }).first().isVisible());
await page.getByLabel("Email istri").fill(OTHER_USER.email);
await page.getByRole("button", { name: "Simpan", exact: true }).click();
await toastOf("Tersimpan.").waitFor();
const wifeCtx = await newContext({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 900 } });
const wifePage = await wifeCtx.newPage();
await wifePage.goto("http://localhost:5173/", { waitUntil: "networkidle" });
await wifePage.getByLabel("Email").fill(OTHER_USER.email);
await wifePage.getByLabel("Kata sandi").fill(OTHER_USER.password);
await wifePage.getByRole("button", { name: "Masuk", exact: true }).click();
await wifePage.locator('nav[aria-label="Navigasi atas"]').waitFor();
await wifePage.waitForTimeout(1200);
check("istri melihat banner mode lihat", await wifePage.getByText("Mode lihat", { exact: false }).isVisible());
check("istri melihat data suami", await wifePage.getByText("4.750.000").first().isVisible());
check("istri tanpa tombol catat", (await wifePage.getByRole("button", { name: "+ Catat" }).count()) === 0);
check("istri tidak melihat datanya sendiri", (await wifePage.getByText("Akun Orang Lain").count()) === 0);
const wifeTok = (await (await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: SB_KEY, "content-type": "application/json" }, body: JSON.stringify(OTHER_USER) })).json()).access_token;
const wifeHdr = { apikey: SB_KEY, authorization: `Bearer ${wifeTok}`, "content-type": "application/json", prefer: "return=representation" };
const wifeEdit = await (await fetch(`${SB_URL}/rest/v1/accounts?id=eq.bank`, { method: "PATCH", headers: wifeHdr, body: JSON.stringify({ name: "Diubah istri" }) })).json();
check("RLS: istri tidak bisa mengubah data suami", Array.isArray(wifeEdit) && wifeEdit.length === 0, JSON.stringify(wifeEdit).slice(0, 80));
await wifeCtx.close();
await page.getByRole("button", { name: "Cabut akses" }).click();
await toastOf("Akses dicabut.").waitFor();
const afterRevoke = await (await fetch(`${SB_URL}/rest/v1/accounts?select=id`, { headers: wifeHdr })).json();
check("RLS: setelah dicabut istri hanya melihat miliknya", Array.isArray(afterRevoke) && afterRevoke.length === 1 && afterRevoke[0].id === "other-acc", JSON.stringify(afterRevoke).slice(0, 80));

// Task 10: PWA assets (Vite dev answers HTML 200 for any path, so inspect content).
const mf = await page.request.get("http://localhost:5173/manifest.webmanifest");
const mfBody = await mf.text();
let mfIcons = 0;
try { mfIcons = JSON.parse(mfBody).icons.length; } catch {}
check("manifest JSON dengan 3 ikon", (mf.headers()["content-type"] ?? "").includes("json") && mfIcons === 3, mf.headers()["content-type"]);
const png = await page.request.get("http://localhost:5173/icons/icon-512.png");
const pngBytes = Buffer.from(await png.body());
check("icon-512.png adalah PNG", (png.headers()["content-type"] ?? "") === "image/png" && pngBytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
check("link manifest ada", (await page.locator('link[rel="manifest"]').count()) === 1);
check("tidak ada service worker di dev", (await page.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length)) === 0);

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

// Task 5 Home acceptance checks.
const homePage = await context.newPage();
await homePage.setViewportSize({ width: 375, height: 812 });
await homePage.goto("http://localhost:5173/", { waitUntil: "networkidle" });
check("Home menyapa Pak Arief", await homePage.getByText("Halo, Pak Arief", { exact: true }).count() > 0);
check("rail akun bisa scroll horizontal", await homePage.locator('[data-testid="account-rail"]').evaluate((el) => el.scrollWidth > el.clientWidth));
const insightCount = await homePage.locator('[data-testid="insight-row"]').count();
check("Home menampilkan 1–3 insight", insightCount >= 1 && insightCount <= 3, String(insightCount));
check("tren Home menampilkan 12 bulan", await homePage.locator('svg[aria-label="Tren 12 bulan"] text[data-month]').count() === 12);
const homeWidth = await homePage.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
check("Home tanpa scroll horizontal halaman", homeWidth.scroll === homeWidth.client, `${homeWidth.scroll} !== ${homeWidth.client}`);
const homeTotalValue = await homePage.locator('[data-testid="home-total"]').getAttribute("data-value");
check("total Home bernilai 4.750.000", homeTotalValue === "4750000", homeTotalValue ?? "missing");
await homePage.close();

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
