// One-off: renders public/logo.svg onto a paper background with Playwright. Run: node scripts/make-icons.mjs
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const logo = `data:image/svg+xml;base64,${readFileSync("public/logo.svg").toString("base64")}`;
const icons = [
  ["icon-192.png", 192, 0.7],
  ["icon-512.png", 512, 0.7],
  ["icon-maskable-512.png", 512, 0.6],
  ["apple-touch-icon.png", 180, 0.7],
];

const browser = await chromium.launch();
for (const [file, size, ratio] of icons) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const logoSize = Math.round(size * ratio);
  await page.setContent(
    `<body style="margin:0;background:#f4f3ef;display:grid;place-items:center;height:${size}px"><img src="${logo}" width="${logoSize}" height="${logoSize}"></body>`,
  );
  await page.screenshot({ path: `public/icons/${file}` });
  await page.close();
}
await browser.close();
