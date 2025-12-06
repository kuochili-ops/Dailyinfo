// index.js
import { generateCalendar } from "./generate.js";

// 主程式入口
(async () => {
  try {
    await generateCalendar();
    console.log("✅ 日曆圖片生成完成！");
  } catch (err) {
    console.error("❌ 發生錯誤：", err);
  }
})();
