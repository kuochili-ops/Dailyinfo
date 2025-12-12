// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆、每日語錄，支持城市切換與日期切換。
// 狀態：已修正 solar.js 模組載入錯誤 (solarlunar.fromDate is not a function)
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

let currentDisplayDate = new Date(); 

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

// ====================================================================
// *** FIX: 處理 solarlunar 模組包裝問題 (更強健的檢查) ***
// 確保 LunarApi 指向一個具有 fromDate 函式的物件。
// 優先檢查 window.solarlunar，然後檢查其 .default 屬性。
// ====================================================================

let LunarApi = undefined;
if (typeof solarlunar !== 'undefined') {
    // 檢查 solarlunar 本身
    if (typeof solarlunar.fromDate === 'function') {
        LunarApi = solarlunar;
    } 
    // 檢查 solarlunar.default
    else if (solarlunar.default && typeof solarlunar.default.fromDate === 'function') {
        LunarApi = solarlunar.default;
    }
}
// 如果 LunarApi 仍然是 undefined，則在函式內部會報載入失敗。

// ====================================================================
// I. 農民曆計算邏輯 
// ====================================================================
function getLunarData(date) { 
    // 檢查 LunarApi 是否已正確載入並具有 fromDate 函式
    if (typeof LunarApi === 'undefined' || typeof LunarApi.fromDate !== 'function') {
        // 如果載入失敗，返回預設佔位符
        return { month: '農曆', day: '載入失敗', yi: 'solar.js 錯誤', ji: '請檢查 console', jieqi: '' };
    }
    
    try {
        // 使用修正後的 LunarApi
        const lunar = LunarApi.fromDate(date).getLunar();
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
    } catch (e) {
        console.error("Lunar data generation failed:", e);
        return { month: '農曆', day: '錯誤', yi: '運算失敗', ji: e.message, jieqi: '' };
    }
}

// ** II. 時辰吉凶數據擷取 **
function getHourAuspiceData(date) { 
    // 檢查 LunarApi
    if (typeof LunarApi === 'undefined' || typeof LunarApi.fromDate !== 'function') { return []; }
    try {
        // 使用修正後的 LunarApi
        const lunar = LunarApi.fromDate(date).getLunar();
        return lunar.getHourAuspice();
    } catch (e) {
        console.error("Failed to get hour auspice data:", e);
        return []; 
    }
}

// ** III. 時辰吉凶表格生成 **
function generateHourAuspiceTable(data) { 
    if (!data || data.length === 0) return ''; 

    const HOUR_MAP = {
        '子': '23-01', '丑': '01-03', '寅': '03-05', '卯': '05-07', 
        '辰': '07-09', '巳': '09-11', '午': '11-13', '未': '13-15', 
        '申': '15-17', '酉': '17-19', '戌': '19-21', '亥': '21-23'
    };

    const getColorStyle = (tip) => {
        if (tip.includes('吉')) return 'color: green;';
        if (tip.includes('凶')) return 'color: #cc0000;';
        return 'color: #333;';
    };

    let tableHtml = `<div style="margin: 15px 5px; padding: 10px 0; border-bottom: 1px dashed #ccc; text-align: center;">`;
    tableHtml += `<div style="font-size: 1.1em; font-weight: bold; color: #004d99; margin-bottom: 5px;">時辰吉凶</div>`;
    tableHtml += `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: center;">`;
    
    // 時間區間 (上排)
    tableHtml += `<thead><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            tableHtml += `<th style="width: 16.66%; padding: 3px 0; font-weight: normal; color: #666;">${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr></thead>`;

    // 時辰 (上排)
    tableHtml += `<tbody><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 1.1em; ${colorStyle}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 吉凶提示 (上排)
    data.slice(0, 6).forEach(item => { 
        if (item && item.tip) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 0.8em; ${colorStyle}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr><td colspan="6" style="height: 10px;"></td></tr><tr>`; 

    // 時間區間 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            tableHtml += `<th style="width: 16.66%; padding: 3px 0; font-weight: normal; color: #666;">${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr><tr>`;
    
    // 時辰 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 1.1em; ${colorStyle}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 吉凶提示 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.tip) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 0.8em; ${colorStyle}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr></tbody></table>`;
    tableHtml += `</div>`;
    
    return tableHtml;
}


// IV. 每日語錄 API
// 已移除 fetchQuote 函式。


// V. 天氣 API 擷取邏輯
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

// VI. 時鐘功能函式
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

// VII. 生成小月曆函式
function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth();
    const todayDay = date.getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    let html = '';

    html += `<table style="width: 100%; border-collapse: collapse; font-size: 0.5em; text-align: center; border: 1px solid #eee;">`;
    html += `<thead style="background-color: #f7f7f7;"><tr>`;
    weekdays.forEach(day => {
        const color = day === '日' ? '#cc0000' : '#333';
        html += `<th style="padding: 0px 0; color: ${color}; font-weight: normal;">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;
    
    let cellCount = 0;
    for (let i = 0; i < firstDayOfWeek; i++) {
        html += `<td style="padding: 0px;"></td>`;
        cellCount++;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) {
            html += `</tr><tr>`;
        }
        const isSunday = (cellCount % 7 === 0);
        const isCurrentDay = (day === todayDay);
        
        let style = "padding: 0px; height: 16px; width: 14.28%;";
        if (isCurrentDay) {
             style += "background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;"; // Use inline style or class
        } else if (isSunday) {
            style += "color: #cc0000;";
        } else {
             style += "color: #333;";
        }
        
        html += `<td style="${style}">${day}</td>`;
        cellCount++;
    }

    while (cellCount % 7 !== 0) {
        html += `<td style="padding: 0px;"></td>`;
        cellCount++;
    }

    html += `</tr></tbody></table>`;

    return html;
}


// VIII. 核心渲染邏輯
function renderPageContent(date, weather, quote) {
    let content = '';

    // 1. 頂部資訊：年號與西元
    const hasLunarApi = (typeof LunarApi !== 'undefined' && typeof LunarApi.fromDate === 'function');
    const lunarYearInfo = hasLunarApi 
        ? LunarApi.fromDate(date).getLunar().getYearInGanZhi() 
        : ''; // 使用修正後的 LunarApi

    content += `<div class="top-info">
        <span class="top-info-left">${date.getFullYear() - 1911}年 歲次${lunarYearInfo}</span>
        <span class="top-info-right">${date.getFullYear()}</span>
    </div>`;

    // 2. 主體內容：大日期區塊
    
    // (A) 左側：農曆紅條
    let lunarData = getLunarData(date);
    let lunarHtml = `${lunarData.month}<br>${lunarData.day}`;
    if (lunarData.jieqi) {
        lunarHtml += `<br>(${lunarData.jieqi})`;
    }
    
    // 取得當日星期幾的中文名稱
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = weekdays[date.getDay()];
    
    // 取得月份中文縮寫
    const monthShort = (date.getMonth() + 1).toString().padStart(2, '0');

    content += `<div class="main-date-container">
        <div class="date-shift-controls">
            <button id="prev-day-btn" class="shift-btn"> &#x23EA; </button>
            <button id="next-day-btn" class="shift-btn"> &#x23E9; </button>
        </div>
        
        <div class="lunar-badge"> 
            ${lunarHtml} 
        </div>

        <div class="date-number-wrapper">
            <div class="big-date-number">${date.getDate()}</div>
        </div>

        <div class="month-info">
            <div class="month-short">${monthShort}</div>
            <div class="month-long">星期${dayOfWeek}</div>
        </div>
    </div>`;

    // 3. 宜/忌 區塊 (使用 class)
    content += `<div class="yi-ji-section">
        <div class="yi-section">宜: ${lunarData.yi}</div>
        <div class="ji-section">忌: ${lunarData.ji}</div>
    </div>`;
    
    // 4. 小月曆
    content += `<div class="mini-calendar-container">
        <div class="mini-calendar-title">${date.getFullYear()}年${date.getMonth() + 1}月</div>
        <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
    </div>`;

    // 5. 每日語錄或時鐘 (已移除語錄功能，永遠顯示時鐘)
    content += `<div class="quote-clock-section"> 
        <span id="live-clock" class="live-clock-text">--:--:--</span> 
    </div>`;
    
    // 6. 縣市天氣
    content += `<div class="weather-section">
        <span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description}
        <span class="weather-temp">${weather.temperature}</span>
    </div>`;
    
    // 7. 時辰吉凶
    const hourAuspiceData = getHourAuspiceData(date);
    content += generateHourAuspiceTable(hourAuspiceData);


    PAGE_CONTAINER.innerHTML = content;

    // 添加日期切換事件監聽器
    document.getElementById('prev-day-btn').onclick = () => {
        shiftDate(-1);
    };
    document.getElementById('next-day-btn').onclick = () => {
        shiftDate(1);
    };

    // 啟動時鐘
    startClock();
}


// IX. 日期切換與天氣獲取邏輯
function shiftDate(days) { 
    currentDisplayDate.setDate(currentDisplayDate.getDate() + days);
    updateCalendar(currentDisplayDate);
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

async function updateCalendar(date, lat, lon, cityName) { 
    // 設定預設城市為台北
    if (!lat || !lon || !cityName) {
        const selectedIndex = CITY_SELECTOR.selectedIndex;
        const selectedOption = CITY_SELECTOR.options[selectedIndex];
        if (selectedOption) {
            [lat, lon] = selectedOption.value.split(',');
            cityName = selectedOption.textContent;
        } else {
            // Fallback to Taipei
            lat = TAIWAN_CITIES[0].lat;
            lon = TAIWAN_CITIES[0].lon;
            cityName = TAIWAN_CITIES[0].name;
        }
    }

    let weatherData = { description: "載入中", temperature: "??°", city: cityName };
    let quoteData = null; // 始終為 null，強制顯示時鐘 (已移除語錄功能)

    if (isToday(date)) {
        // 只有在顯示「今天」時才獲取天氣。已移除 fetchQuote()
        [weatherData] = await Promise.all([
            fetchWeatherForecast(lat, lon, cityName)
        ]);
        // quoteData 保持為 null
    } else {
        weatherData.description = "僅顯示今日天氣";
        weatherData.temperature = "----";
        // quoteData 保持為 null 
    }

    renderPageContent(date, weatherData, quoteData); 
}

// ------------------------------------------
// X. 初始化與事件
// ------------------------------------------
function loadCitySelector() { 
    TAIWAN_CITIES.forEach((city) => {
        const option = document.createElement('option');
        option.value = `${city.lat},${city.lon}`; 
        option.textContent = city.name;
        // 這裡需要 CITY_SELECTOR (select id="city-selector") 存在
        CITY_SELECTOR.appendChild(option);
    });
    CITY_SELECTOR.value = `${TAIWAN_CITIES[0].lat},${TAIWAN_CITIES[0].lon}`;
}

function initApp() {
    loadCitySelector();
    CITY_SELECTOR.addEventListener('change', (event) => {
        const currentDate = currentDisplayDate; 
        const [lat, lon] = event.target.value.split(',');
        const cityName = event.target.options[event.target.selectedIndex].textContent;
        updateCalendar(currentDate, lat, lon, cityName);
    });

    updateCalendar(currentDisplayDate);
}

// 啟動應用程式
document.addEventListener('DOMContentLoaded', initApp);
