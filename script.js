// ====================================================================
// 專案名稱：極簡日曆儀表板 (版面修正版)
// 功能：顯示天氣、農民曆 (含宜忌)、時鐘
// 修正：日期切換按鈕上移、小月曆縮小至右側
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

// I. 農民曆計算邏輯 (使用 CDN 完整庫)
function getLunarData(date) { 
    if (typeof Solar === 'undefined') {
        return { month: '農曆', day: '載入失敗', yi: 'CDN 連線異常', ji: 'CDN 連線異常', jieqi: '' };
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

function getHourAuspiceData(date) { 
    return []; 
}

function generateHourAuspiceTable(data) { 
    // 時辰吉凶表不顯示
    if (!data || data.length === 0) return ''; 
    return '';
}

// IV. 天氣 API (不變)
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

// V. 時鐘 (不變)
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

// 小月曆生成 (不變，但樣式由 CSS 控制)
function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth();
    const todayDay = date.getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    let html = '';

    html += `<table style="border-collapse: collapse; font-size: 1em; text-align: center;">`;
    html += `<thead style="background-color: #f7f7f7;"><tr>`;
    weekdays.forEach(day => {
        const color = day === '日' ? '#cc0000' : '#333';
        html += `<th style="padding: 0px 0; color: ${color}; font-weight: normal;">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;
    
    let cellCount = 0;
    for (let i = 0; i < firstDayOfWeek; i++) html += `<td style="padding: 0px; width: 14.28%;"></td>`, cellCount++;
    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) html += `</tr><tr>`;
        const isSunday = (cellCount % 7 === 0);
        const isCurrentDay = (day === todayDay);
        let style = "padding: 0px; height: 16px; width: 14.28%;";
        if (isCurrentDay) style += "background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;";
        else if (isSunday) style += "color: #cc0000;";
        else style += "color: #333;";
        html += `<td style="${style}">${day}</td>`;
        cellCount++;
    }
    while (cellCount % 7 !== 0) html += `<td style="padding: 0px; width: 14.28%;"></td>`, cellCount++;
    html += `</tr></tbody></table>`;
    return html;
}

// VIII. 核心渲染邏輯 (調整順序與結構)
function renderPageContent(date, weather, quote) {
    let content = '';
    const lunarYearInfo = typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : '';

    // 1. 頂部資訊
    content += `<div class="top-info"><span class="top-info-left">${date.getFullYear() - 1911}年 歲次${lunarYearInfo}</span><span class="top-info-right">${date.getFullYear()}</span></div>`;

    let lunarData = getLunarData(date);
    let lunarHtml = `${lunarData.month}<br>${lunarData.day}`;
    if (lunarData.jieqi) lunarHtml += `<br>(${lunarData.jieqi})`;
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = weekdays[date.getDay()];
    const monthShort = (date.getMonth() + 1).toString().padStart(2, '0');

    // 2. 主日期區塊 (無按鈕)
    content += `<div class="main-date-container">
        <div class="lunar-badge">${lunarHtml}</div>
        <div class="date-number-wrapper"><div class="big-date-number">${date.getDate()}</div></div>
        <div class="month-info"><div class="month-short">${monthShort}</div><div class="month-long">星期${dayOfWeek}</div></div>
    </div>`;

    // 3. 日期切換按鈕 (新的獨立容器，有透明度，在宜忌上方)
    content += `<div class="date-shift-wrapper">
        <button id="prev-day-btn" class="shift-btn date-shift-top"> &#x23EA; </button>
        <button id="next-day-btn" class="shift-btn date-shift-top"> &#x23E9; </button>
    </div>`;

    // 4. 宜/忌 區塊 (左右並列)
    content += `<div class="yi-ji-section">
        <div class="yi-section">宜: ${lunarData.yi}</div>
        <div class="ji-section">忌: ${lunarData.ji}</div>
    </div>`;

    // 5. 時鐘 (全寬)
    content += `<div class="quote-clock-section">
        <span id="live-clock" class="live-clock-text">--:--:--</span>
    </div>`;

    // 6. 底部內容容器 (天氣和縮小月曆左右並列)
    content += `<div class="bottom-row-container">
        
        <div class="weather-section-left">
            <span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} 
            <span class="weather-temp">${weather.temperature}</span>
        </div>
        
        <div class="mini-calendar-container">
            <div class="mini-calendar-title">${date.getFullYear()}年${date.getMonth() + 1}月</div>
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
        </div>
        
    </div>`;
    
    // 7. 時辰吉凶 (不顯示)
    content += generateHourAuspiceTable(getHourAuspiceData(date));

    PAGE_CONTAINER.innerHTML = content;
    document.getElementById('prev-day-btn').onclick = () => shiftDate(-1);
    document.getElementById('next-day-btn').onclick = () => shiftDate(1);
    startClock();
}

function shiftDate(days) { 
    currentDisplayDate.setDate(currentDisplayDate.getDate() + days);
    updateCalendar(currentDisplayDate);
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

async function updateCalendar(date, lat, lon, cityName) { 
    if (!lat || !lon || !cityName) {
        const selectedIndex = CITY_SELECTOR.selectedIndex;
        const selectedOption = CITY_SELECTOR.options[selectedIndex];
        if (selectedOption) {
            [lat, lon] = selectedOption.value.split(',');
            cityName = selectedOption.textContent;
        } else {
            lat = TAIWAN_CITIES[0].lat;
            lon = TAIWAN_CITIES[0].lon;
            cityName = TAIWAN_CITIES[0].name;
        }
    }
    let weatherData = { description: "載入中", temperature: "??°", city: cityName };
    if (isToday(date)) [weatherData] = await Promise.all([fetchWeatherForecast(lat, lon, cityName)]);
    else { weatherData.description = "僅顯示今日天氣"; weatherData.temperature = "----"; }
    renderPageContent(date, weatherData, null); 
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
        updateCalendar(currentDisplayDate, lat, lon, cityName);
    });
    updateCalendar(currentDisplayDate);
}

document.addEventListener('DOMContentLoaded', initApp);
