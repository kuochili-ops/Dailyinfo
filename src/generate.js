import puppeteer from "puppeteer";
import fs from "fs";

async function generateCalendar() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // 載入 HTML 模板
  const html = fs.readFileSync("./src/template.html", "utf8");
  await page.setContent(html, { waitUntil: "networkidle0" });

  // 截圖輸出
  await page.screenshot({ path: "./output/calendar.png", fullPage: true });

  await browser.close();
  console.log("✅ 日曆圖片已生成：output/calendar.png");
}

generateCalendar();
