const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表及其經緯度 (適用於免費 2.5 版本 API，更穩定)
const TAIWAN_CITIES = [
    { name: '臺北市', lat: 25.0330, lon: 121.5654 }, // 臺北站前
    { name: '新北市', lat: 25.0139, lon: 121.4552 }, // 板橋區
    { name: '桃園市', lat: 24.9961, lon: 121.3129 }, // 桃園區
    { name: '臺中市', lat: 24.1478, lon: 120.6728 }, // 臺中火車站
    { name: '臺南市', lat: 22.9909, lon: 120.2132 }, // 臺南中西區
    { name: '高雄市', lat: 22.6273, lon: 120.3014 }, // 高雄前金區
    { name: '基隆市', lat: 25.1276, lon: 121.7392 }, // 基隆港
    { name: '新竹市', lat: 24.8037, lon: 120.9669 }, // 新竹北區
    { name: '嘉義市', lat: 23.4841, lon: 120.4497 }, // 嘉義西區
    { name: '宜蘭縣', lat: 24.7577, lon: 121.7533 }, // 宜蘭市
    { name: '花蓮縣', lat: 23.9730, lon: 121.6030 }, // 花蓮市
    { name: '屏東縣', lat: 22.6738, lon: 120.4851 }, // 屏東市
    { name: '臺東縣', lat: 22.7505, lon: 121.1518 }  // 臺東市
];

// ------------------------------------------
// I. 輔助函式：載入城市選單
// ------------------------------------------

function loadCitySelector() {
    TAIWAN_CITIES.forEach((city, index) => {
        const option = document.createElement('option');
        // value 儲存經緯度，方便查詢
        option.value = `${city.lat},${city.lon}`; 
        option.textContent = city.name;
        CITY_SELECTOR.appendChild(option);
    });
    // 預設選擇臺北市
    CITY_SELECTOR.value = `${TAIWAN_CITIES[0].lat},${TAIWAN_CITIES[0].lon}`;
}


// ------------------------------------------
// II. 天氣 API 擷取邏輯 (OpenWeatherMap 2.5 - 使用經緯度)
// ------------------------------------------

async function fetchWeatherForecast(lat, lon, cityName) {
    
    // 使用 5 Day / 3 Hour Forecast API (免費版) 
    // endpoint 變更為 lat/lon 查詢
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();

        if (data.cod != 200) {
            console.error("OpenWeatherMap 2.5 API 錯誤:", data.message);
            // 由於已經使用經緯度，如果仍失敗，很可能是 API 金鑰問題
            return { description: "API 查詢失敗 (請檢查金鑰狀態)", temperature: "??° ~ ??°", city: cityName };
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
    
    // 根據當前時間 2025/12/10 設置農曆
    const lunarDate = "農曆十月 二十"; 
    
    let content = '<div style="height: 100%;">';

    // 1. 頂部資訊
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">114年 兔年</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容
    content += `<div style="height: calc(100% - 100px); padding: 10px 0; overflow: auto;">`; 

    // 左側：農曆紅條
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
async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
    // 顯示載入狀態
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取 ' + cityName + ' 天氣中...</div>';
    
    const weatherData = await fetchWeatherForecast(lat, lon, cityName);
    renderPageContent(today, weatherData);
}

function initApp() {
    // 1. 載入城市選單
    loadCitySelector();
    
    // 2. 設定選單變更事件
    CITY_SELECTOR.addEventListener('change', (event) => {
        const [lat, lon] = event.target.value.split(',');
        const cityName = event.target.options[event.target.selectedIndex].textContent;
        updateCalendar(lat, lon, cityName);
    });
    
    // 3. 初始載入 (預設臺北市)
    const defaultCity = TAIWAN_CITIES[0];
    updateCalendar(defaultCity.lat, defaultCity.lon, defaultCity.name);
}

initApp();
