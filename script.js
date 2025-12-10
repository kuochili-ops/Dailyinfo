const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const API_KEY = 'CWA-A6F3874E-27F3-4AA3-AF5A-96B365798F79'; // <--- 已使用您提供的金鑰
const LOCATION_NAME = '臺北市'; // 預設查詢地點

// ------------------------------------------
// I. 天氣 API 擷取邏輯
// ------------------------------------------

async function fetchWeatherForecast() {
    
    // 使用 F-C0032-001 (一般天氣預報-今明36小時天氣預報)
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}&format=JSON&locationName=${LOCATION_NAME}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.success !== 'true') {
            console.error("CWA API Error:", data.message);
            return { description: "天氣資訊載入失敗 (" + data.message + ")", temperature: "??° ~ ??°", city: LOCATION_NAME };
        }

        const locationData = data.records.location[0];
        const weatherElements = locationData.weatherElement;
        
        // 獲取今天的第一個預報時段
        const targetTime = weatherElements.find(e => e.elementName === 'Wx').time[0];
        const tempMax = weatherElements.find(e => e.elementName === 'MaxT').time[0].elementValue[0].value;
        const tempMin = weatherElements.find(e => e.elementName === 'MinT').time[0].elementValue[0].value;
        
        return {
            description: targetTime.elementValue[0].value,
            temperature: `${tempMin}°C ~ ${tempMax}°C`,
            city: locationData.locationName
        };

    } catch (error) {
        console.error("Fetch Error:", error);
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: LOCATION_NAME };
    }
}

// ------------------------------------------
// II. 日期與內容渲染 (使用行內樣式)
// ------------------------------------------

function renderPageContent(date, weather) {
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    
    // 模擬農曆和宜忌 (保持靜態)
    const lunarDate = "十月二十八"; 
    
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
        農曆 ${lunarDate}
    </div>`;

    // 中間：大日期數字
    content += `<div style="float: left; width: 100px; font-size: 5em; font-weight: 900; color: #004d99; text-align: center; line-height: 1.2;">
        ${dayNumber}
    </div>`;
    
    // 右側：天氣資訊
    content += `<div style="float: left; padding: 5px; font-size: 0.8em; text-align: left; border: 1px solid #eee; width: 80px;">
        <div style="font-weight: bold;">${month}月 NOV</div>
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
    // 1. 獲取當前日期
    const today = new Date();
    
    // 2. 獲取天氣資訊
    const weatherData = await fetchWeatherForecast();
    
    // 3. 渲染頁面
    renderPageContent(today, weatherData);
}

initApp();
