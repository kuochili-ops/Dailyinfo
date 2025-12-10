const PAGE_CONTAINER = document.getElementById('calendar-page-container');

// ⚠️ API 金鑰保持不變 (Dcd113bba5675965ccf9e60a7e6d06e5)
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 使用臺北市的城市 ID，這是免費 API 2.5 版本的標準查詢方式
const CITY_ID = 1668341; // 臺北市的 OpenWeatherMap ID
const LOCATION_DISPLAY_NAME = '臺北市'; 

// ------------------------------------------
// I. 天氣 API 擷取邏輯 (OpenWeatherMap 2.5 免費版)
// ------------------------------------------

async function fetchWeatherForecast() {
    
    // 使用 5 Day / 3 Hour Forecast API (免費版) 獲取未來幾日的溫度資訊
    // 雖然是 5 天/3 小時，但我們可以從中提取今日的最高/最低溫
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?id=${CITY_ID}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();

        if (data.cod != 200) {
            console.error("OpenWeatherMap 2.5 API 錯誤:", data.message);
            // 如果連這個免費 API 都失敗，則可能是金鑰本身還未生效或網路連線問題
            return { description: "API 查詢失敗 (請檢查金鑰狀態)", temperature: "??° ~ ??°", city: LOCATION_DISPLAY_NAME };
        }

        // 獲取當日天氣描述 (我們將使用第一個預報時段的描述)
        const todayList = data.list[0];
        const description = todayList.weather[0].description;
        
        // 遍歷當日的所有預報時段 (每 3 小時一次) 來找到今日真正的最高和最低溫
        const today = new Date().toDateString();
        let maxT = -Infinity;
        let minT = Infinity;

        for (const item of data.list) {
            const itemDate = new Date(item.dt_txt).toDateString();
            
            // 只有今天或剛過午夜的數據才納入計算
            if (itemDate === today) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
            }
        }
        
        // 確保至少有一個數據點被處理
        const tempMax = maxT === -Infinity ? '??' : Math.round(maxT);
        const tempMin = minT === Infinity ? '??' : Math.round(minT);
        
        return {
            description: description,
            temperature: `${tempMin}°C ~ ${tempMax}°C`,
            city: LOCATION_DISPLAY_NAME
        };

    } catch (error) {
        console.error("Fetch Error:", error);
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: LOCATION_DISPLAY_NAME };
    }
}

// ------------------------------------------
// II. 日期與內容渲染 (保持不變)
// ------------------------------------------

function renderPageContent(date, weather) {
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
    // 渲染頁面時，先顯示 "載入中..." 讓使用者知道正在處理
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取天氣中...</div>';
    
    const weatherData = await fetchWeatherForecast();
    renderPageContent(today, weatherData);
}

initApp();
