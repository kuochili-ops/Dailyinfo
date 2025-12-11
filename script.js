// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆、每日語錄(或時鐘)，並支持城市切換
// 特點：
// 1. 已移除最頂部紅色區塊。
// 2. ✨ 新增/調整：小月曆已整合並移動至月份下方。
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表 (不變)
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

let clockInterval = null;

// ------------------------------------------
// I. 農民曆與節氣計算邏輯 (不變)
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
// II. 每日語錄 API (失敗時回傳 null)
// ------------------------------------------
async function fetchQuote() {
    const url = 'https://type.fit/api/quotes';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json(); 
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomQuote = data[randomIndex];
        return `${randomQuote.text} — ${randomQuote.author || 'Unknown'}`;
    } catch (error) {
        console.warn("Quote API failed, switching to Clock mode.");
        return null; 
    }
}

// ------------------------------------------
// III. 天氣 API 擷取邏輯 (不變)
// ------------------------------------------
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
// IV. 時鐘功能函式 (不變)
// ------------------------------------------
function startClock() {
    if (clockInterval) clearInterval(clockInterval);

    const updateTime = () => {
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-TW', { hour12: false });
            clockElement.textContent = timeString;
        }
    };

    updateTime();
    clockInterval = setInterval(updateTime, 1000);
}

// ------------------------------------------
// V. 新增：生成小月曆函式 (移除 max-width 限制)
// ------------------------------------------
function generateMiniCalendar(date) {
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const todayDay = date.getDate(); 
    
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    let html = '';

    // 調整樣式：移除 max-width 和 margin-top，讓它適應父容器
    html += `<table style="width: 100%; border-collapse: collapse; font-size: 0.7em; text-align: center; border: 1px solid #eee;">`;
    html += `<thead style="background-color: #f7f7f7;"><tr>`;
    weekdays.forEach(day => {
        const color = day === '日' ? '#cc0000' : '#333';
        html += `<th style="padding: 2px 0; color: ${color}; font-weight: normal;">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;

    let cellCount = 0; 

    // 1. 插入開頭的空白單元格 (Placeholder)
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += `<td style="padding: 2px;"></td>`;
        cellCount++;
    }

    // 2. 填入實際日期
    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) {
            html += `</tr><tr>`;
        }

        const isToday = day === todayDay;
        const style = isToday 
            ? `background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;` 
            : `color: #333;`;
        
        html += `<td style="padding: 2px; ${style}">${day}</td>`;
        cellCount++;
    }

    // 3. 填入結尾的空白單元格
    while (cellCount % 7 !== 0) {
        html += `<td style="padding: 2px;"></td>`;
        cellCount++;
    }

    html += `</tr></tbody></table>`;
    return html;
}

// ------------------------------------------
// VI. 渲染邏輯 (已將小月曆整合至月份下方)
// ------------------------------------------
function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    // 農曆資訊
    const lunarData = getLunarData(date);
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;

    // 廣告區域高度
    const AD_HEIGHT_PX = 90; 
    
    let content = `<div style="height: 100%; position: relative; padding-bottom: ${AD_HEIGHT_PX + 20}px; max-width: 400px; margin: 0 auto; box-sizing: border-box;">`;

    // 1. 頂部資訊 (年號，已還原為獨立區塊)
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 10px;">
        <span style="float: left; font-size: 0.8em;">${date.getFullYear() - 1911}年 歲次${typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : ''}</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：[農曆(左) --- 大日期(置中) --- 月份/小月曆(右)]
    // 讓高度足以容納小月曆
    content += `<div style="position: relative; height: 230px; margin-top: 15px; display: flex; align-items: flex-start; justify-content: center;">`; 

    // (A) 左側：農曆紅條 (不變)
    content += `<div style="position: absolute; left: 0; background-color: #cc0000; color: white; padding: 5px; font-size: 1.1em; text-align: center; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); line-height: 1.2;">
        ${lunarHtml}
    </div>`;

    // (B) 中央：大日期 (不變)
    content += `<div style="width: 100%; text-align: center;">
        <div style="font-size: 7.5em; font-weight: 900; color: #004d99; line-height: 1;">
            ${dayNumber}
        </div>
    </div>`;

    // (C) 右側：月份 + 小月曆 (整合區塊)
    content += `<div style="position: absolute; right: 0; text-align: right; line-height: 1.1; width: 160px;">
        <div style="font-size: 2.5em; font-weight: bold; color: #cc0000;">${monthShort}</div>
        
        <span style="display: block; transform: scale(2, 1.5); transform-origin: right top; margin-top: 5px;">
            <div style="font-size: 1.2em; font-weight: bold; color: #333;">${month}月</div>
        </span>
        
        <div style="margin-top: 15px;"> 
            ${generateMiniCalendar(date)}
        </div>
    </div>`;

    content += `</div>`; 
    
    // 3. 星期 (從 230px 高度之後開始)
    content += `<div style="clear: both; margin-top: 10px; text-align: center;">
        <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 15px;">
            ${weekdayName}
        </div>
    </div>`;
    
    // 4. 宜/忌 (不變)
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
    
    // 5. 每日語錄 或 現在時刻 (不變)
    if (quote) {
        content += `<div style="margin-top: 20px; padding: 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.9em; color: #555; min-height: 50px; display: flex; align-items: center; justify-content: center; text-align: center; font-style: italic;">
            "${quote}"
        </div>`;
    } else {
        // 時鐘
        content += `<div style="margin-top: 20px; padding: 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 2.0em; font-weight: bold; color: #333; min-height: 50px; display: flex; align-items: center; justify-content: center; text-align: center;">
            <span id="live-clock">--:--:--</span>
        </div>`;
    }

    // 6. 縣市天氣 (不變)
    content += `<div style="padding: 15px; text-align: center; font-size: 0.9em; color: #666;">
        <span style="font-weight: bold; color: #333;">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span style="font-weight: bold; color: #e60000;">(${weather.temperature})</span>
    </div>`;
    
    // 7. 底部廣告空間 (維持不變)
    content += `<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${AD_HEIGHT_PX}px; background-color: #ddd;"></div>`;

    content += `</div>`; 
    PAGE_CONTAINER.innerHTML = content;

    if (!quote) {
        startClock();
    }
}

// ------------------------------------------
// VII. 初始化與事件 (不變)
// ------------------------------------------
async function updateCalendar(lat, lon, cityName) {
    if (clockInterval) clearInterval(clockInterval); 
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
