import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on("pageerror", e => console.log("[pageerror]", e.message));
await page.goto("http://localhost:8081/", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.getByRole("button", { name: /^For Brands/ }).click();
await page.waitForTimeout(12000);
const d = await page.evaluate(() => JSON.parse(JSON.stringify(window.__lanyardDebug ?? null)));
console.log(JSON.stringify(d, null, 2));
const rect = await page.evaluate(() => {
  const c = document.querySelector('#hero canvas');
  const r = c.getBoundingClientRect();
  return { top: r.top, height: r.height, left: r.left, width: r.width };
});
console.log("canvasRect", JSON.stringify(rect));
await browser.close();
