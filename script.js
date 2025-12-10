// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆宜忌、每日語錄，並支持城市切換
// 特點：農曆分三行顯示；移除底部廣告空間標示
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
// 請替換成您自己的 OpenWeatherMap API Key
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表及其經緯度 (不變)
const TAIWAN_CITIES = [
    { name: '臺北市', lat: 25.0330, lon: 121.5654 }, 
    { name: '新北市', lat: 25.0139, lon: 121.4552 }, 
    { name: '桃園市', lat: 24.9961, lon: 121.3129 }, 
    { name: '臺中市', lat: 24.1478, lon: 120.6728 }, 
    { name: '臺南市', lat: 22.9909, lon: 120.2132 }, 
    { name: '高雄市', lat: 22.6273, lon: 120.3014 }, 
    { name: '基隆市', lat: 25.1276, lon: 121.7392 }, 
    { name: '新竹市', lat: 24.8037, lon: 120.9669 }, 
    { name: '嘉義市', lat: 23.4841, lon: 120.4497 }, 
    { name: '宜蘭縣', lat: 24.7577, lon: 121.7533 }, 
    { name: '花蓮縣', lat: 23.9730, lon: 121.6030 }, 
    { name: '屏東縣', lat: 22.6738, lon: 120.4851 }, 
    { name: '臺東縣', lat: 22.7505, lon: 121.1518 }  
];

// 【靜態宜忌清單】
const YIJIS = {
    // 格式：'YYYY-M-D': { yi: '宜做事項', ji: '忌做事項', lunar: '農曆十一月 廿一' }
    '2025-12-11': { 
        yi: '祭祀, 納財, 開市', 
        ji: '動土, 安床, 移徙', 
        lunar: '農曆十一月 廿一' 
    },
    '2025-12-12': { 
        yi: '嫁娶, 訂盟, 祈福', 
        ji: '入宅, 安門, 蓋屋', 
        lunar: '農曆十一月 廿二' 
    },
    '2025-12-13': { 
        yi: '出行, 簽約, 求醫', 
        ji: '破土, 交易, 納畜', 
        lunar: '農曆十一月 廿三' 
    },
};

// ------------------------------------------
// I. 每日語錄 API 擷取邏輯
// ------------------------------------------

async function fetchQuote() {
    const url = 'https://type.fit/api/quotes';
    try {
        const response = await fetch(url);
        const data = await response.json(); 
        
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomQuote = data[randomIndex];
        
        const quoteText = randomQuote.text;
        const author = randomQuote.author || 'Unknown';
        
        return `${quoteText} — ${author}`;
        
    } catch (error) {
        return 'Daily Quote: Error fetching quote from API. (Quotes are in English)';
    }
}


// ------------------------------------------
// II. 天氣 API 擷取邏輯 (OpenWeatherMap)
// ------------------------------------------

async function fetchWeatherForecast(lat, lon, cityName) {
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();

        if (data.cod != 200) {
            return { description: "API 查詢失敗", temperature: "??° ~ ??°", city: cityName };
        }

        const todayList = data.list[0];
        const description = todayList.weather[0].description;
        
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
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: cityName };
    }
}

// ------------------------------------------
// III. 渲染邏輯 (應用最終排版)
// ------------------------------------------

function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    // 從靜態清單中獲取宜忌數據
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const yijiData = YIJIS[dateKey] || { 
        yi: '無（請更新清單）', 
        ji: '無（請更新清單）', 
        lunar: '農曆資訊不足' 
    };
    
    const yiItems = yijiData.yi.split(/[,|]/).map(s => s.trim()).filter(s => s);
    const jiItems = yijiData.ji.split(/[,|]/).map(s => s.trim()).filter(s => s);
    
    // 將農曆資訊分割成三行：['農曆', '十一月', '廿一']
    const lunarParts = yijiData.lunar.split(' ');
    const lunarHtml = lunarParts.map(part => `<div>${part}</div>`).join('');
    
    // 廣告區域高度
    const AD_HEIGHT_PX = 90; 
    
    // 容器設置底部填充，為廣告留出空間
    let content = `<div style="height: 100%; position: relative; padding-bottom: ${AD_HEIGHT_PX + 20}px; max-width: 400px; margin: 0 auto; box-sizing: border-box;">`;

    // 1. 頂部資訊 (年與生肖)
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">114年 兔年</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：農曆、大日期、月份 (三欄分列，日期居中)
    content += `<div style="clear: both; display: flex; align-items: flex-start; margin-top: 15px;">`; 

    // 左側：農曆紅條 (分三行顯示)
    content += `<div style="width: 80px; background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; margin-right: 15px; flex-shrink: 0; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); line-height: 1.2;">
        ${lunarHtml}
    </div>`;

    // 中央區：大日期、月份 (flex-grow: 1, 確保內容居中)
    content += `<div style="flex-grow: 1; display: flex; align-items: center; justify-content: center;">
        
        <div style="display: flex; align-items: center;">
            <div style="font-size: 6em; font-weight: 900; color: #004d99; line-height: 1.0; margin-right: 10px;">
                ${dayNumber}
            </div>
            
            <div style="font-size: 1.5em; font-weight: bold; color: #cc0000; line-height: 1.1;">
                <div>${monthShort}</div>
                <div style="font-size: 0.8em; color: #333;">${month}月</div>
            </div>
        </div>
    </div>`;

    // 右側：佔位符 (寬度 80px)，確保對稱
    content += `<div style="width: 80px; flex-shrink: 0; margin-left: 15px;"></div>`; 

    content += `</div>`; // 主體內容結束
    
    // 3. 星期 (在宜忌虛線框外)
    content += `<div style="clear: both; margin-top: 15px; text-align: center;">
        <div style="font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 10px;">
            ${weekdayName}
        </div>
    </div>`;
    
    // 4. 宜/忌 (帶虛線框)
    content += `<div style="margin: 0 10px; padding: 10px 0; text-align: center; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 0.8em; line-height: 1.5;">
            <div style="width: 48%; border-right: 1px solid #eee;">
                <div style="font-weight: bold; color: green; margin-bottom: 5px;">**宜：**</div>
                ${yiItems.length > 0 ? yiItems.map(item => `<div>${item}</div>`).join('') : '<div>無</div>'}
            </div>
            
            <div style="width: 48%;">
                <div style="font-weight: bold; color: #cc0000; margin-bottom: 5px;">**忌：**</div>
                ${jiItems.length > 0 ? jiItems.map(item => `<div>${item}</div>`).join('') : '<div>無</div>'}
            </div>
        </div>
    </div>`;
    
    // 5. 每日語錄
    content += `<div style="margin-top: 15px; padding: 5px 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.8em; color: #555; height: 60px; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center;">
        ${quote}
    </div>`;

    // 6. 縣市天氣 (語錄下方)
    content += `<div style="padding: 10px; text-align: center; font-size: 0.85em; color: #666; background-color: #f0f0f0; margin-top: 10px;">
        <span style="font-weight: bold; color: #333;">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span style="font-weight: bold; color: #e60000;">(${weather.temperature})</span>
    </div>`;
    
    // 7. 底部廣告空間 (90px 高度, 移除標示文字)
    content += `<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${AD_HEIGHT_PX}px; background-color: #ddd;">
        </div>`;


    content += `</div>`; // 容器結束
    
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// IV. 應用程式啟動與事件處理 (不變)
// ------------------------------------------

async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取 ' + cityName + ' 天氣與今日語錄中...</div>';
    
    const [weatherData, quoteData] = await Promise.all([
        fetchWeatherForecast(lat, lon, cityName),
        fetchQuote() 
    ]);
    
    renderPageContent(today, weatherData, quoteData); 
}

function loadCitySelector() {
    TAIWAN_CITIES.forEach((city) => {
        const option = document.createElement('option');
        option.value = `${city.lat},${city.lon}`; 
        option.textContent = city.name;
        CITY_SELECTOR.appendChild(option);
    });
    // 預設選擇第一個城市
    CITY_SELECTOR.value = `${TAIWAN_CITIES[0].lat},${TAIWAN_CITIES[0].lon}`;
}

function initApp() {
    loadCitySelector();
    
    CITY_SELECTOR.addEventListener('change', (event) => {
        const [lat, lon] = event.target.value.split(',');
        const cityName = event.target.options[event.target.selectedIndex].textContent;
        updateCalendar(lat, lon, cityName);
    });
    
    const defaultCity = TAIWAN_CITIES[0];
    updateCalendar(defaultCity.lat, defaultCity.lon, defaultCity.name);
}

initApp();
