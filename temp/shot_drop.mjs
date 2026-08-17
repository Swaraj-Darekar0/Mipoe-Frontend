import { chromium } from "playwright";
const [,, w, h, label, brand] = process.argv;
const OUT = "D:/temp/claude/d--Mipoe/3cb70b64-7a70-4f21-b879-bd7cfb433ad6/scratchpad";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
page.on("pageerror", (e) => console.log("[pageerror]", e.message));
await page.goto("http://localhost:8080/", { waitUntil: "networkidle" });
if (brand === "brand") { await page.getByRole("button", { name: /^For Brands/ }).click(); }
// capture the fall in progress, then settled
for (const [ms, tag] of [[260, "a-mid"], [700, "b-late"], [5000, "c-settled"]]) {
  await page.waitForTimeout(tag === "a-mid" ? ms : tag === "b-late" ? 440 : 4300);
  await page.screenshot({ path: `${OUT}/${label}-${tag}.png` });
}
await browser.close();
console.log("done", label);
