import { chromium } from "playwright";
const browser = await chromium.launch();
for (const h of [700, 900, 1200]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: h } });
  page.on("pageerror", e => console.log("[pageerror]", e.message));
  await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: /^For Brands/ }).click();
  await page.waitForTimeout(6000);
  const info = await page.evaluate(() => {
    const nav = document.querySelector('nav').getBoundingClientRect();
    const c = document.querySelector('#hero canvas').getBoundingClientRect();
    return { navBottom: Math.round(nav.bottom), navTop: Math.round(nav.top),
             canvasTop: Math.round(c.top), canvasHeight: Math.round(c.height) };
  });
  // anchor screen y = canvasTop + 0.2 * (canvasHeight / worldHeight)
  const worldH = 2 * 30 * Math.tan((40 / 2) * Math.PI / 180);
  const anchorScreenY = info.canvasTop + 0.2 * (info.canvasHeight / worldH);
  const hidden = anchorScreenY >= info.navTop && anchorScreenY <= info.navBottom;
  console.log(`vh=${h}`, JSON.stringify(info), `anchorY≈${anchorScreenY.toFixed(1)}`, `hiddenBehindNavbar=${hidden}`);
  await page.close();
}
await browser.close();
