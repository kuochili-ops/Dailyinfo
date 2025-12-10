const PAGE_CONTAINER = document.getElementById('calendar-page-container');

// ⚠️ API 金鑰已植入：Dcd113bba5675965ccf9e60a7e6d06e5
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺北市的經緯度
const LATITUDE = 25.033;
const LONGITUDE = 121.565;
const LOCATION_DISPLAY_NAME = '臺北市'; 

// ------------------------------------------
// I. 天氣 API 擷取邏輯 (OpenWeatherMap)
// ------------------------------------------

async function fetchWeatherForecast() {
    
    // 使用 One Call API 3.0，查詢當前天氣
    // &units=metric 確保溫度單位為攝氏度
    // &lang=zh_tw 確保天氣描述為中文
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        // 檢查 API 是否返回錯誤代碼
        if (data.cod && data.cod != 200) {
            console.error("OpenWeatherMap API Error:", data.message);
            return { description: "API 查詢失敗: " + data.message, temperature: "??° ~ ??°", city: LOCATION_DISPLAY_NAME };
        }

        const current = data.current;
        const todayForecast = data.daily[0]; // 獲取今日預報
        
        // 獲取今日的最高/最低溫
        const tempMax = Math.round(todayForecast.temp.max);
        const tempMin = Math.round(todayForecast.temp.min);
        
        return {
            description: current.weather[0].description,
            temperature: `${tempMin}°C ~ ${tempMax}°C`,
            city: LOCATION_DISPLAY_NAME
        };

    } catch (error) {
        // 這通常是網路連線錯誤，非 API 錯誤
        console.error("Fetch Error:", error);
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: LOCATION_DISPLAY_NAME };
    }
}

// ------------------------------------------
// II. 日期與內容渲染 (使用行內樣式)
// ------------------------------------------

function renderPageContent(date, weather) {
    // 設置日期為當日 (2025/12/10)
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    
    // 模擬農曆和宜忌 (使用目前時間 2025/12/10 對應的農曆)
    const lunarDate = "農曆十月 二十"; 
    
    let content = '<div style="height: 100%;">';

    // 1. 頂部資訊
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">114年 兔年</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容
    content += `<div style="height: calc(100% - 100px); padding: 10px 0; overflow: auto;">`; 

    // 左側：農曆紅條 (僅能水平顯示)
    content += `<div style="float: left; width: 80px; background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; margin-right: 10px;">
        ${lunarDate}
    </div>`;

    // 中間：大日期數字
    content += `<div style="float: left; width: 100px; font-size: 5em; font-weight: 900; color: #004d99; text-align: center; line-height: 1.2;">
        ${dayNumber}
    </div>`;
    
    // 右側：天氣資訊
    content += `<div style="float: left; padding: 5px; font-size: 0.8em; text-align: left; border: 1px solid #eee; width: 80px;">
        <div style="font-weight: bold;">${month}月 ${date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
        <div style="margin-top: 10px; font-size: 1.1em; color: #333;">${weather.city}</div>
        <div>${weather.description}</div>
        <div style="font-weight: bold; color: #e60000;">${weather.temperature}</div>
    </div>`;

    content += `</div>`; // 主體內容結束

    // 3. 底部星期/宜忌
    content += `<div style="clear: both; border-top: 1px solid #eee; padding-top: 10px; text-align: center; position: absolute; bottom: 10px; width: 95%;">
        <div style="font-size: 1.5em; color: #333; margin-bottom: 5px;">${weekdayName}</div>
        <div>宜：嫁娶 | 忌：動土</div>
    </div>`;

    content += `</div>`; 
    
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// III. 啟動應用程式
// ------------------------------------------

async function initApp() {
    const today = new Date();
    const weatherData = await fetchWeatherForecast();
    renderPageContent(today, weatherData);
}

initApp();
