import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
const avatar = (
  await readFile(new URL("../public/avatar.jpg", import.meta.url))
).toString("base64");
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<html><head><style>*{box-sizing:border-box}body{margin:0;background:#0c0d10;color:#f1f1f3;font-family:Arial,'PingFang SC',sans-serif}.card{height:630px;padding:74px 80px;background:radial-gradient(ellipse at 85% 20%,#30333f,transparent 65%)}small{font-size:18px;letter-spacing:5px;color:#a3a5ad}h1{font-size:84px;letter-spacing:-4px;margin:60px 0 18px}p{font-size:30px;color:#c0c2ca}footer{font-size:20px;letter-spacing:3px;color:#a3a5ad;margin-top:55px}img{position:absolute;right:85px;top:170px;width:260px;height:260px;border-radius:48px;transform:rotate(-5deg);box-shadow:0 24px 70px #0008}</style></head><body><div class="card"><small>PERSONAL SPACE / DK CONNECT</small><h1>Han_B1ng.</h1><p>祝你天天开心。</p><footer>HANB1NG.COM ↗</footer><img src="data:image/jpeg;base64,${avatar}"/></div></body></html>`,
  );
  await page.locator("img").evaluate((img) => img.decode());
  await page.screenshot({
    path: new URL("../public/og-image.png", import.meta.url).pathname,
  });
} finally {
  await browser.close();
}
