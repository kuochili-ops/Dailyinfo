// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終定案版 - 版面結構與功能穩定)
// 狀態：已修復 JS 錯誤，並完成所有版面要求。
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

let currentDisplayDate = new Date(); 
let clockInterval = null;

const TAIWAN_CITIES = [
    { name: '臺北市', lat: 25.0330, lon: 121.5654 }, 
    { name: '新北市', lat: 25.0139, lon: 121.4552 }, 
    { name: '桃園市', lat: 24.9961, lon: 121.3129 }, 
    { name: '臺中市', lat: 24.1478, lon: 120.6728 }, 
    { name: '臺南市', lat: 22.9909, lon: 120.2132 }, 
    { name: '高雄市', lat: 22.6273, lon: 120.3014 }, 
    { name: '基隆市', lat: 25.1276, lon: 121.7390 }, 
    { name: '新竹市', lat: 24.8037, lon: 120.9667 }, 
    { name: '嘉義市', lat: 23.4791, lon: 120.4402 }, 
    { name: '宜蘭縣', lat: 24.7554, lon: 121.7523 }, 
    { name: '花蓮縣', lat: 23.9733, lon: 121.6062 }, 
    { name: '屏東縣', lat: 22.6685, lon: 120.4855 }, 
    { name: '臺東縣', lat: 22.7562, lon: 121.1524 }  
];

// I. 農民曆計算邏輯 (保持不變)
function getLunarData(date) { 
    if (typeof Solar === 'undefined') {
        return { month: '農曆', day: '載入失敗', yi: 'CDN 連線異常', ji: 'CDN 連線異常', jieqi: '', hourAuspice: [] };
    }
    
    const lunar = Solar.fromDate(date).getLunar();
    const yiList = lunar.getDayYi();
    const jiList = lunar.getDayJi();
    const jieqi = lunar.getJieQi(); 

    // 硬編碼時辰吉凶資料 (用戶原始邏輯)
    let hourAuspiceData = [];
    const hourAuspiceMap = {
        '子': '吉', '丑': '凶', '寅': '吉', '卯': '凶', '辰': '吉', '巳': '凶',
        '午': '吉', '未': '凶', '申': '吉', '酉': '凶', '戌': '吉', '亥': '凶'
    };
    for(const hour in hourAuspiceMap) {
        hourAuspiceData.push({ hour: hour, auspice: hourAuspiceMap[hour] });
    }

    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: yiList.slice(0, 4).join(' '),
        ji: jiList.slice(0, 4).join(' '),
        jieqi: jieqi,
        hourAuspice: hourAuspiceData
    };
}

// II. 時辰吉凶數據擷取 (保持用戶原始邏輯)
function getHourAuspiceData(date) { 
    return getLunarData(date).hourAuspice; 
}

// III. 時辰吉凶表格生成 (保持不變)
function generateHourAuspiceContent(data) { 
    if (!data || data.length === 0) {
        return `<div class="hour-auspice-container">
            <div class="hour-auspice-title">今日時辰吉凶</div>
            <div class="hour-auspice-text" style="color: #999;">本日無時辰吉凶資料或載入失敗</div>
        </div>`;
    }

    const goodHours = data.filter(h => h.auspice === '吉').map(h => h.hour).join(' ');
    const badHours = data.filter(h => h.auspice === '凶').map(h => h.hour).join(' ');

    return `
    <div class="hour-auspice-container">
        <div class="hour-auspice-title">今日時辰吉凶</div>
        <div class="hour-auspice-text">
            <span class="auspice-good">吉時: ${goodHours || '無'}</span> | 
            <span class="auspice-bad">凶時: ${badHours || '無'}</span>
        </div>
    </div>`;
}

// IV. 天氣 API (不變)
async function fetchWeatherForecast(lat, lon, cityName) { 
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const weather = data.weather[0].description;
        const temp = Math.round(data.main.temp);
        return {
            description: weather,
            temperature: `${temp}°C`,
            city: cityName
        };
    } catch (error) {
        return { description: "網路錯誤", temperature: "??°", city: cityName };
    }
}

// V. 時鐘與小月曆 (不變)
function startClock() { 
    if (clockInterval) clearInterval(clockInterval);
    const updateTime = () => {
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            const now = new Date();
            const timeString = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
            clockElement.textContent = timeString;
        }
    };
    updateTime();
    clockInterval = setInterval(updateTime, 1000);
}

function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth();
    const todayDay = date.getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    let html = '';

    html += `<table style="width: 100%;">`; 
    html += `<thead><tr>`;
    weekdays.forEach(day => {
        const color = day === '日' ? '#cc0000' : '#333';
        html += `<th style="color: ${color};">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;
    
    let cellCount = 0;
    for (let i = 0; i < firstDayOfWeek; i++) html += `<td></td>`, cellCount++;
    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) html += `</tr><tr>`;
        const isSunday = (cellCount % 7 === 0);
        const isCurrentDay = (day === todayDay);
        let className = '';
        if (isCurrentDay) className = 'current-day';
        else if (isSunday) className = 'sunday-day';
        
        html += `<td class="${className}">${day}</td>`;
        cellCount++;
    }
    while (cellCount % 7 !== 0) html += `<td></td>`, cellCount++;
    html += `</tr></tbody></table>`;
    return html;
}

// VIII. 核心渲染邏輯 (已調整結構以符合視覺要求)
function renderPageContent(date, weather, quote) {
    let content = '';
    const lunarYearInfo = typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : '';

    // 1. 頂部資訊 (年與歲次)
    content += `<div class="top-info"><span class="top-info-left">${date.getFullYear() - 1911}年 歲次${lunarYearInfo}</span><span class="top-info-right">${date.getFullYear()}</span></div>`;

    let lunarData = getLunarData(date);
    let lunarHtml = `${lunarData.month}<br>${lunarData.day}`;
    if (lunarData.jieqi) lunarHtml += `<br>(${lunarData.jieqi})`;
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = weekdays[date.getDay()];
    
    // *** 修正點：月份中英文顯示 (英文月份縮寫) ***
    const monthShort = date.toLocaleString('en-US', { month: 'short' }); 

    // 2. 日期切換按鈕
    content += `<div class="date-shift-wrapper">
        <button id="prev-day-btn" class="shift-btn date-shift-top"> &#x23EA; </button>
        <button id="next-day-btn" class="shift-btn date-shift-top"> &#x23E9; </button>
    </div>`;

    // 3. 主日期區塊 
    content += `<div class="main-date-container">
        <div class="lunar-badge">${lunarHtml}</div>
        <div class="date-number-wrapper">
            <div class="big-date-number">${date.getDate()}</div>
            <div class="weekday-below-date">星期${dayOfWeek}</div>
        </div>
        <div class="month-info">
            <div class="month-long">${date.toLocaleString('zh-TW', { month: 'long' })}</div>
            <div class="month-short">${monthShort}</div>
        </div>
    </div>`;

    // 4. 宜/忌 區塊 
    content += `<div class="yi-ji-section">
        <div class="yi-section">宜: ${lunarData.yi}</div>
        <div class="ji-section">忌: ${lunarData.ji}</div>
    </div>`;

    // 5. 底部內容容器 (天氣/時鐘 左側 vs 小月曆 右側)
    content += `<div class="bottom-row-container">
        
        <div class="weather-clock-section-left">
            <div class="weather-section-left">
                <span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} 
                <span class="weather-temp">${weather.temperature}</span>
            </div>
            
            <div class="live-clock-container">
                <span id="live-clock" class="live-clock-text">--:--:--</span>
            </div>
        </div>
        
        <div class="mini-calendar-container">
            <div class="mini-calendar-title">${date.getFullYear()}年${date.getMonth() + 1}月</div>
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
        </div>
        
    </div>`;
    
    // 6. 時辰吉凶 (在最下方)
    content += generateHourAuspiceContent(getHourAuspiceData(date));

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
    
    // 語法錯誤已修復
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
