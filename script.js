// 顯示今天日期
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][today.getDay()];
document.getElementById("gregorian").innerText = `${year}年${month}月${day}日 · ${weekday}`;

// 農曆資訊（這裡可接農曆 API，目前先用假資料）
document.getElementById("lunar").innerText = "農曆乙巳年十月十九";

// 節氣資料（簡單對照表）
const solarTerms = [
  { date: "2025-12-07", term: "大雪" },
  { date: "2025-12-21", term: "冬至" }
];
let termToday = "";
solarTerms.forEach(item => {
  if (today.toISOString().slice(0,10) === item.date) {
    termToday = item.term;
  }
});
document.getElementById("solarTerm").innerText = termToday ? `節氣：${termToday}` : "";

// 即時時鐘
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById("clock").innerText = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();
