// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆宜忌、每日語錄，並支持城市切換
// 特點：大日期完美居中；月份靠右；宜忌字體加大；自動農曆與節氣
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表 (保持不變)
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

// ------------------------------------------
// I. 農民曆與節氣計算邏輯 (自動計算)
// ------------------------------------------
function getLunarData(date) {
    if (typeof Solar === 'undefined') {
        return { month: '農曆', day: '載入中', yi: '', ji: '', jieqi: '' };
    }
    const lunar = Solar.fromDate(date).getLunar();
    const yiList = lunar.getDayYi();
    const jiList = lunar.getDayJi();
    const jieqi = lunar.getJieQi(); 

    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: yiList.slice(0, 4).join(' '),
        ji: jiList.slice(0, 4).join(' '),
        jieqi: jieqi
    };
}

// ------------------------------------------
// II. 每日語錄 & 天氣 API (保持不變)
// ------------------------------------------
async function fetchQuote() {
    const url = 'https://type.fit/api/quotes';
    try {
        const response = await fetch(url);
        const data = await response.json(); 
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomQuote = data[randomIndex];
        return `${randomQuote.text} — ${randomQuote.author || 'Unknown'}`;
    } catch (error) {
        return 'Daily Quote: Error fetching quote. (Quotes are in English)';
    }
}

async function fetchWeatherForecast(lat, lon, cityName) {
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();
        if (data.cod != 200) return { description: "API 查詢失敗", temperature: "??°", city: cityName };

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
        return {
            description: data.list[0].weather[0].description,
            temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`,
            city: cityName
        };
    } catch (error) {
        return { description: "網路錯誤", temperature: "??°", city: cityName };
    }
}

// ------------------------------------------
// III. 渲染邏輯 (重點修改：日期置中、月份靠右、字體加大)
// ------------------------------------------

function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    // 自動獲取農曆資訊
    const lunarData = getLunarData(date);
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;

    // 廣告區域高度
    const AD_HEIGHT_PX = 90; 
    
    let content = `<div style="height: 100%; position: relative; padding-bottom: ${AD_HEIGHT_PX + 20}px; max-width: 400px; margin: 0 auto; box-sizing: border-box;">`;

    // 1. 頂部資訊
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">${date.getFullYear() - 1911}年 歲次${typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : ''}</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：[農曆(左) --- 大日期(置中) --- 月份(右)]
    // 使用 position: relative 作為定位基準，確保日期絕對置中
    content += `<div style="position: relative; height: 120px; margin-top: 15px; display: flex; align-items: center; justify-content: center;">`; 

    // (A) 左側：農曆紅條 (絕對定位靠左)
    content += `<div style="position: absolute; left: 0; background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); line-height: 1.2;">
        ${lunarHtml}
    </div>`;

    // (B) 中央：大日期 (絕對居中)
    // 為了不被左右元素擠壓，寬度設為 100%，文字置中，z-index 設為 0 以防遮擋點擊(雖然這裡沒點擊)
    content += `<div style="width: 100%; text-align: center;">
        <div style="font-size: 7.5em; font-weight: 900; color: #004d99; line-height: 1;">
            ${dayNumber}
        </div>
    </div>`;

    // (C) 右側：月份 (絕對定位靠右)
    content += `<div style="position: absolute; right: 0; text-align: right; line-height: 1.2;">
        <div style="font-size: 1.5em; font-weight: bold; color: #cc0000;">${monthShort}</div>
        <div style="font-size: 1.0em; font-weight: bold; color: #333;">${month}月</div>
    </div>`;

    content += `</div>`; // 主體內容結束
    
    // 3. 星期
    content += `<div style="clear: both; margin-top: 10px; text-align: center;">
        <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 15px;">
            ${weekdayName}
        </div>
    </div>`;
    
    // 4. 宜/忌 (字體加大)
    // 將 font-size 從 0.8em 調整為 1.1em
    content += `<div style="margin: 0 5px; padding: 15px 0; text-align: center; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 1.1em; line-height: 1.6;">
            <div style="width: 48%; border-right: 1px solid #eee;">
                <div style="font-weight: bold; color: green; margin-bottom: 5px;">**宜**</div>
                <div style="white-space: pre-wrap; color: #555;">${lunarData.yi || '諸事不宜'}</div>
            </div>
            <div style="width: 48%;">
                <div style="font-weight: bold; color: #cc0000; margin-bottom: 5px;">**忌**</div>
                <div style="white-space: pre-wrap; color: #555;">${lunarData.ji || '諸事不宜'}</div>
            </div>
        </div>
    </div>`;
    
    // 5. 每日語錄
    content += `<div style="margin-top: 20px; padding: 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.9em; color: #555; min-height: 50px; display: flex; align-items: center; justify-content: center; text-align: center; font-style: italic;">
        "${quote}"
    </div>`;

    // 6. 縣市天氣
    content += `<div style="padding: 15px; text-align: center; font-size: 0.9em; color: #666;">
        <span style="font-weight: bold; color: #333;">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span style="font-weight: bold; color: #e60000;">(${weather.temperature})</span>
    </div>`;
    
    // 7. 底部廣告空間
    content += `<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${AD_HEIGHT_PX}px; background-color: #ddd;"></div>`;

    content += `</div>`; 
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// V. 初始化與事件 (保持不變)
// ------------------------------------------
async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
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
