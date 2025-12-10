const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表及其 OpenWeatherMap ID (適用於免費 2.5 版本 API)
const TAIWAN_CITIES = [
    { name: '臺北市', id: 1668341 },
    { name: '新北市', id: 1673812 },
    { name: '桃園市', id: 1679093 },
    { name: '臺中市', id: 1679080 },
    { name: '臺南市', id: 1679075 },
    { name: '高雄市', id: 1679070 },
    { name: '基隆市', id: 1677334 },
    { name: '新竹市', id: 1673874 },
    { name: '嘉義市', id: 1676679 },
    { name: '宜蘭縣', id: 1668270 },
    { name: '花蓮縣', id: 1678125 },
    { name: '屏東縣', id: 1673994 },
    { name: '臺東縣', id: 1679073 }
];

// ------------------------------------------
// I. 輔助函式：載入城市選單
// ------------------------------------------

function loadCitySelector() {
    TAIWAN_CITIES.forEach(city => {
        const option = document.createElement('option');
        option.value = city.id;
        option.textContent = city.name;
        CITY_SELECTOR.appendChild(option);
    });
    // 預設選擇臺北市
    CITY_SELECTOR.value = TAIWAN_CITIES[0].id;
}


// ------------------------------------------
// II. 天氣 API 擷取邏輯 (OpenWeatherMap 2.5 免費版)
// ------------------------------------------

async function fetchWeatherForecast(cityId, cityName) {
    
    // 使用 5 Day / 3 Hour Forecast API (免費版) 
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?id=${cityId}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();

        if (data.cod != 200) {
            console.error("OpenWeatherMap 2.5 API 錯誤:", data.message);
            return { description: "API 查詢失敗: " + data.message, temperature: "??° ~ ??°", city: cityName };
        }

        // 獲取當日天氣描述
        const todayList = data.list[0];
        const description = todayList.weather[0].description;
        
        // 計算當日最高和最低溫
        const today = new Date().toDateString();
        let maxT = -Infinity;
        let minT = Infinity;

        for (const item of data.list) {
            const itemDate = new Date(item.dt_txt).toDateString();
            
            // 只考慮今天的預報時段
            if (itemDate === today) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
            }
        }
        
        const tempMax = maxT === -Infinity ? '??' : Math.round(maxT);
        const tempMin = minT === Infinity ? '??' : Math.round(minT);
        
        return {
            description: description,
            temperature: `${tempMin}°C ~ ${tempMax}°C`,
            city: cityName
        };

    } catch (error) {
        console.error("Fetch Error:", error);
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: cityName };
    }
}

// ------------------------------------------
// III. 渲染邏輯 (保持不變)
// ------------------------------------------

function renderPageContent(date, weather) {
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    
    // 模擬農曆和宜忌 (保持靜態，與先前版本一致)
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
// IV. 應用程式啟動與事件處理
// ------------------------------------------

// 核心啟動和更新邏輯
async function updateCalendar(cityId, cityName) {
    const today = new Date();
    // 顯示載入狀態
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取 ' + cityName + ' 天氣中...</div>';
    
    const weatherData = await fetchWeatherForecast(cityId, cityName);
    renderPageContent(today, weatherData);
}

function initApp() {
    // 1. 載入城市選單
    loadCitySelector();
    
    // 2. 設定選單變更事件
    CITY_SELECTOR.addEventListener('change', (event) => {
        const selectedId = event.target.value;
        const selectedCity = TAIWAN_CITIES.find(c => c.id == selectedId);
        updateCalendar(selectedCity.id, selectedCity.name);
    });
    
    // 3. 初始載入 (預設臺北市)
    const defaultCity = TAIWAN_CITIES[0];
    updateCalendar(defaultCity.id, defaultCity.name);
}

initApp();
