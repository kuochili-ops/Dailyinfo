// 今天日期
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][today.getDay()];

// 西曆顯示
document.getElementById("year").innerText = year;
document.getElementById("month").innerText = `${month}月`;
document.getElementById("gregorian").innerText = `${year}年${month}月${day}日 · ${weekday}`;
document.getElementById("day").innerText = day;

// 使用 solarlunar 轉換農曆
const lunarInfo = solarlunar.solar2lunar(year, month, day);
document.getElementById("lunar").innerText =
  `農曆${lunarInfo.gzYear}年${lunarInfo.lMonth}月${lunarInfo.lDayName}`;
document.getElementById("zodiac").innerText = lunarInfo.animal;
document.getElementById("solarTerm").innerText =
  lunarInfo.term ? `節氣：${lunarInfo.term}` : "";

// 假資料：伊斯蘭曆（可替換成 API）
document.getElementById("islamic").innerText = "Rejab 27hb, 1447";

// 宜忌提醒（示範用，可接 API）
const yiJiData = {
  "2025-12-09": {
    yi: "祭祀・祈福・嫁娶",
    ji: "出行・安葬・動土"
  }
};
const dateKey = today.toISOString().slice(0,10);
if (yiJiData[dateKey]) {
  document.getElementById("yi").innerText = `宜：${yiJiData[dateKey].yi}`;
  document.getElementById("ji").innerText = `忌：${yiJiData[dateKey].ji}`;

  // 顯示在記事欄
  const notes = document.querySelector(".notes");
  const reminder = document.createElement("div");
  reminder.className = "reminder";
  reminder.innerHTML = `
    <div class="reminder-title">今日提醒</div>
    <div class="reminder-text">宜：${yiJiData[dateKey].yi}<br>忌：${yiJiData[dateKey].ji}</div>
  `;
  notes.appendChild(reminder);
}

// 時鐘功能
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById("clock").innerText = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();
