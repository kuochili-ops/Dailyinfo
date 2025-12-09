// ===== 日期與時間 =====
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

// ===== 農曆、生肖、節氣 =====
const lunarInfo = solarlunar.solar2lunar(year, month, day);
document.getElementById("lunar").innerText =
  `農曆${lunarInfo.gzYear}年${lunarInfo.lMonth}月${lunarInfo.lDayName}`;
document.getElementById("zodiac").innerText = lunarInfo.animal;
document.getElementById("solarTerm").innerText =
  lunarInfo.term ? `節氣：${lunarInfo.term}` : "";

// ===== 伊斯蘭曆（示範用） =====
document.getElementById("islamic").innerText = "Rejab 27hb, 1447";

// ===== 宜忌提醒（全年 JSON 範例生成） =====
function generateYiJiData() {
  const data = {};
  const start = new Date("2025-01-01");
  const end = new Date("2025-12-31");
  const yiOptions = ["祭祀", "祈福", "嫁娶", "開市", "交易", "納財", "出行", "赴任", "修造", "安門"];
  const jiOptions = ["動土", "安葬", "移徙", "入宅", "破土", "遠行", "置產"];

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0,10);
    const yi = yiOptions[Math.floor(Math.random() * yiOptions.length)];
    const ji = jiOptions[Math.floor(Math.random() * jiOptions.length)];
    data[key] = { yi, ji };
  }
  return data;
}

const yiJiData = generateYiJiData();
const dateKey = today.toISOString().slice(0,10);
if (yiJiData[dateKey]) {
  document.getElementById("yi").innerText = `宜：${yiJiData[dateKey].yi}`;
  document.getElementById("ji").innerText = `忌：${yiJiData[dateKey].ji}`;

  const notes = document.querySelector(".notes");
  const reminder = document.createElement("div");
  reminder.className = "reminder";
  reminder.innerHTML = `
    <div class="reminder-title">今日提醒</div>
    <div class="reminder-text">宜：${yiJiData[dateKey].yi}<br>忌：${yiJiData[dateKey].ji}</div>
  `;
  notes.appendChild(reminder);
}

// ===== 時鐘 =====
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  document.getElementById("clock").innerText = `${h}:${m}:${s}`;
}
setInterval(updateClock, 1000);
updateClock();

// ===== 天氣 API =====
const API_KEY = "CWA-A6F3874E-27F3-4AA3-AF5A-96B365798F79";

async function fetchWeather(city) {
  const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}&locationName=${city}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const location = data.records.location[0].weatherElement;

    const now = new Date();
    function pickTime(elementName) {
      const element = location.find(e => e.elementName === elementName);
      if (!element) return "--";
      const match = element.time.find(t => {
        const start = new Date(t.startTime);
        const end = new Date(t.endTime);
        return now >= start && now < end;
      });
      // 如果沒找到符合區段，就退回第一筆資料
      return match?.parameter?.parameterName || element.time[0]?.parameter?.parameterName || "--";
    }

    const wx = pickTime("Wx");     // 天氣現象
    const minT = pickTime("MinT"); // 最低溫
    const maxT = pickTime("MaxT"); // 最高溫
    const pop = pickTime("PoP");   // 降雨機率
    const ci = pickTime("CI");     // 舒適度指數

    document.getElementById("weatherInfo").innerText =
      `${city}：${wx} · ${minT}°C ~ ${maxT}°C · 降雨 ${pop}% · ${ci}`;
  } catch (err) {
    document.getElementById("weatherInfo").innerText = "天氣資料載入失敗";
    console.error(err);
  }
}

// 初始顯示
fetchWeather("臺北市");

// 監聽選單變化
document.getElementById("city").addEventListener("change", function() {
  fetchWeather(this.value);
});
