// 顯示今天日期
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][today.getDay()];
document.getElementById("gregorian").innerText = `${year}年${month}月${day}日 · ${weekday}`;

// 農曆資訊
const info = LunarCalendar.solarToLunar(year, month, day);
document.getElementById("lunar").innerText =
  `農曆${info.GanZhiYear}年${info.lunarMonthName}${info.lunarDayName}`;
document.getElementById("solarTerm").innerText =
  `${info.lunarDayName} · ${info.term || "無"}`;

// 日出日落（假資料）
document.getElementById("sunInfo").innerText = "日出 07:19 · 日落 17:43";

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

// 天氣 API（中央氣象署）
const API_KEY = "CWA-A6F3874E-27F3-4AA3-AF5A-96B365798F79";
const API_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001";

async function loadWeather() {
  const city = "臺北市"; // 預設台北市
  const url = `${API_URL}?Authorization=${API_KEY}&locationName=${city}&format=JSON`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const location = data.records.location[0];
    const weatherElements = location.weatherElement;
    const wx = weatherElements.find(e => e.elementName === "Wx").time[0].parameter.parameterName;
    const minT = weatherElements.find(e => e.elementName === "MinT").time[0].parameter.parameterName;
    const maxT = weatherElements.find(e => e.elementName === "MaxT").time[0].parameter.parameterName;
    const pop = weatherElements.find(e => e.elementName === "PoP").time[0].parameter.parameterName;

    document.getElementById("weatherInfo").innerText =
      `${city}：${wx} · ${minT}°C ~ ${maxT}°C · 降雨 ${pop}%`;
  } catch (err) {
    document.getElementById("weatherInfo").innerText = "天氣資料載入失敗";
  }
}
loadWeather();
