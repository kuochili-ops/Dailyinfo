const today = new Date();
const year = today.getFullYear();
const month = today.getMonth() + 1;
const day = today.getDate();
const weekday = ["日","一","二","三","四","五","六"][today.getDay()];
document.getElementById("gregorian").innerText = `${year}年${month}月${day}日（星期${weekday}）`;

const lunar = solarlunar.solar2lunar(year, month, day);
document.getElementById("lunar").innerText = `農曆 ${lunar.lMonth}月${lunar.lDayName} · ${lunar.animal}年 ${lunar.term ? "節氣：" + lunar.term : ""}`;

const API_KEY = "CWA-A6F3874E-27F3-4AA3-AF5A-96B365798F79";

async function fetchWeather() {
  const city = document.getElementById("city").value;
  const url = `/api/weather?city=${encodeURIComponent(city)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const location = data.records.location.find(loc => loc.locationName === city);
    if (!location) {
      document.getElementById("weatherInfo").innerText = `${city}：找不到天氣資料`;
      return;
    }

    const now = new Date();
    function pickTime(elementName) {
      const element = location.weatherElement.find(e => e.elementName === elementName);
      if (!element) return "--";
      const match = element.time.find(t => {
        const start = new Date(t.startTime);
        const end = new Date(t.endTime);
        return now >= start && now < end;
      });
      return match?.parameter?.parameterName || element.time[0]?.parameter?.parameterName || "--";
    }

    const wx = pickTime("Wx");
    const minT = pickTime("MinT");
    const maxT = pickTime("MaxT");
    const pop = pickTime("PoP");
    const ci = pickTime("CI");

    document.getElementById("weatherInfo").innerText =
      `${city}：${wx} · ${minT}°C ~ ${maxT}°C · 降雨 ${pop}% · ${ci}`;
  } catch (err) {
    document.getElementById("weatherInfo").innerText = "天氣資料載入失敗";
    console.error(err);
  }
}


    const now = new Date();
    function pickTime(elementName) {
      const element = location.weatherElement.find(e => e.elementName === elementName);
      if (!element) return "--";
      const match = element.time.find(t => {
        const start = new Date(t.startTime);
        const end = new Date(t.endTime);
        return now >= start && now < end;
      });
      return match?.parameter?.parameterName || element.time[0]?.parameter?.parameterName || "--";
    }

    const wx = pickTime("Wx");
    const minT = pickTime("MinT");
    const maxT = pickTime("MaxT");
    const pop = pickTime("PoP");
    const ci = pickTime("CI");

    document.getElementById("weatherInfo").innerText =
      `${city}：${wx} · ${minT}°C ~ ${maxT}°C · 降雨 ${pop}% · ${ci}`;
  } catch (err) {
    document.getElementById("weatherInfo").innerText = "天氣資料載入失敗";
    console.error(err);
  }
}

fetchWeather();
document.getElementById("city").addEventListener("change", fetchWeather);
