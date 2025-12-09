// 當年生肖對照表
const zodiacMap = {
  2024: "🐉", // 龍
  2025: "🐍", // 蛇
  2026: "🐎", // 馬
  2027: "🐐", // 羊
  2028: "🐒", // 猴
  2029: "🐔", // 雞
  2030: "🐕", // 狗
  2031: "🐖", // 豬
  2032: "🐀", // 鼠
  2033: "🐂", // 牛
  2034: "🐅", // 虎
  2035: "🐇"  // 兔
};

// 宜忌資料（示範用，可接 API）
const yiJiData = {
  "2025-12-08": {
    yi: "祭祀・祈福・嫁娶",
    ji: "出行・安葬・動土"
  }
};

// 顯示日期
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][today.getDay()];

document.getElementById("year").innerText = year;
document.getElementById("month").innerText = `${month}月`;
document.getElementById("gregorian").innerText = `${year}年${month}月${day}日 · ${weekday}`;
document.getElementById("lunar").innerText = "農曆乙巳年十月十九"; // 假資料
document.getElementById("islamic").innerText = "Rejab 27hb, 1447"; // 假資料
document.getElementById("day").innerText = day;

// 顯示生肖
document.getElementById("zodiac").innerText = zodiacMap[year] || "";

// 顯示宜忌
const dateKey = today.toISOString().slice(0,10);
if (yiJiData[dateKey]) {
  document.getElementById("yi").innerText = `宜：${yiJiData[dateKey].yi}`;
  document.getElementById("ji").innerText = `忌：${yiJiData[dateKey].ji}`;
  alert(`今日提醒\n宜：${yiJiData[dateKey].yi}\n忌：${yiJiData[dateKey].ji}`);
}

// 時鐘
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById("clock").innerText = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();
