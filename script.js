// 日期顯示今天
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const weekday = ["星期日","星期一","星期二","星期三","星期四","星期五","星期六"][now.getDay()];
document.getElementById("yearMonth").innerText = `${year} · ${month}月`;
document.getElementById("dayNum").innerText = day;
document.getElementById("todayInfo").innerText = `${year}年${month}月${day}日 · ${weekday}`;

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
  const city = document.getElementById("city").value;
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

// 農曆日期 + 節氣（政府開放資料）
async function loadAlmanacGov() {
  try {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // ⚠️ 請先下載政府資料集 JSON，命名為 lunar.json，放在同目錄
    const res = await fetch("lunar.json");
    const data = await res.json();

    const record = data.find(item => item["西元日期"] === dateStr);
    if (record) {
      document.getElementById("almanacInfo").innerText =
        `農曆${record["農曆月"]}${record["農曆日"]} · 節氣：${record["節氣"] || "無"}`;
    } else {
      document.getElementById("almanacInfo").innerText = "找不到農曆資料";
    }
  } catch (err) {
    document.getElementById("almanacInfo").innerText = "農曆資料載入失敗";
  }
}
loadAlmanacGov();
