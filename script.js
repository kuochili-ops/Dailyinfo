// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終定案版 - 支援年月選擇，介面文字已轉為正體中文)
// 狀態：已修正生肖計算邏輯。移除小月曆點擊切換，改為使用 <input type="date"> 輔助選擇。
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

// ******************************************************
// ** 輔助函式：生肖 Emoji & 簡體轉正體 **
// ******************************************************
function getChineseZodiacEmoji(year) {
    const zodiacs = ['🐒', '🐔', '🐶', '🐷', '🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑'];
    return zodiacs[(year - 2016) % 12];
}

function simplifiedToTraditional(text) {
    if (!text) return '';
    const map = {
        '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', 
        '盖': '蓋', '纳': '納', '结': '結', '办': '辦', '迁': '遷', 
        '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會',
        '備': '備', '园': '園', '买': '買', '卖': '賣', '发': '發', 
        '设': '設', '坛': '壇',
        '饰': '飾', '馀': '餘', '疗': '療', '理': '理', '归': '歸',
        '灶': '竈', '会': '會'
    };
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        result += map[char] || char;
    }
    return result;
}

// I. 農民曆計算邏輯 
function getLunarData(date) { 
    if (typeof Solar === 'undefined') {
        return { month: '農曆', day: '載入失敗', yi: 'CDN 連線異常', ji: 'CDN 連線異常', jieqi: '', hourAuspice: [] };
    }
    
    const lunar = Solar.fromDate(date).getLunar();
    const yiList = lunar.getDayYi();
    const jiList = lunar.getDayJi();
    const jieqi = lunar.getJieQi(); 

    const rawYi = yiList.slice(0, 4).join(' ');
    const rawJi = jiList.slice(0, 4).join(' ');

    const finalYi = simplifiedToTraditional(rawYi);
    const finalJi = simplifiedToTraditional(rawJi);

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
        yi: finalYi, 
        ji: finalJi, 
        jieqi: jieqi,
        hourAuspice: hourAuspiceData
    };
}

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

// 移除小月曆的點擊事件
function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    const todayDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
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
        const isCurrentDay = (day === todayDay && month === currentMonth && year === currentYear);
        
        let className = '';
        if (isCurrentDay) className = 'current-day';
        else if (isSunday) className = 'sunday-day';

        // 移除 onclick 事件，僅顯示日期
        html += `<td class="${className}">${day}</td>`;
        
        cellCount++;
    }
    while (cellCount % 7 !== 0) html += `<td></td>`, cellCount++;
    html += `</tr></tbody></table>`;
    return html;
}

// VI. 產生年月選擇器 (現改為顯示當前年月)
function generateDateSelectors(date) {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // JS month is 0-indexed

    // 格式化為 YYYY-MM-DD，用於設定 Date Picker 的預設值
    const dateValue = date.toISOString().split('T')[0];
    
    // 隱藏的 Date Picker，用於彈出標準選擇介面
    let html = `
    <input type="date" id="date-picker-trigger" style="position:absolute; opacity:0; width:100%; height:100%; top:0; left:0; cursor:pointer;" value="${dateValue}" />
    <div class="date-selector-wrapper">
        <span class="date-select">${currentYear}年</span>
        <span class="date-select">${currentMonth}月</span>
    </div>
    `;
    return html;
}

// 核心修正：處理 Date Picker 的 change 事件
window.handleDatePickerChange = function() {
    const datePicker = document.getElementById('date-picker-trigger');
    const selectedDate = new Date(datePicker.value);
    
    // 由於 Date Picker 回傳的日期是 UTC 午夜 (00:00:00)，需要調整時區以避免差一天
    selectedDate.setMinutes(selectedDate.getMinutes() + selectedDate.getTimezoneOffset());
    
    currentDisplayDate = selectedDate;
    updateCalendar(currentDisplayDate);
}


// VIII. 核心渲染邏輯
function renderPageContent(date, weather, quote) {
    let content = '';
    const currentYear = date.getFullYear();
    const lunarYearInfo = typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : '';
    const zodiacEmoji = getChineseZodiacEmoji(currentYear); 

    // 1. 頂部資訊 (年與歲次)
    content += `<div class="top-info"><span class="top-info-left">${currentYear - 1911}年 歲次${lunarYearInfo} ${zodiacEmoji}</span><span class="top-info-right">${currentYear}</span></div>`;

    let lunarData = getLunarData(date);
    let lunarHtml = `${lunarData.month}<br>${lunarData.day}`;
    if (lunarData.jieqi) lunarHtml += `<br>(${simplifiedToTraditional(lunarData.jieqi)})`; 
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dayOfWeek = weekdays[date.getDay()];
    
    // 月份中英文顯示
    const monthShort = date.toLocaleString('en-US', { month: 'short' }); 

    // 2. 主日期區塊 (日期、星期、月份全部加大)
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

    // 3. 宜/忌 區塊 
    content += `<div class="yi-ji-section">
        <div class="yi-section">宜: ${lunarData.yi}</div>
        <div class="ji-section">忌: ${lunarData.ji}</div>
    </div>`;

    // 4. 底部內容容器 (天氣/時鐘 左側 vs 年月選擇/小月曆 右側)
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
        
        <div class="mini-calendar-container" id="date-selection-area">
            ${generateDateSelectors(date)} 
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
        </div>
        
    </div>`;
    
    // 5. 時辰吉凶 (在最下方)
    content += generateHourAuspiceContent(getHourAuspiceData(date));

    PAGE_CONTAINER.innerHTML = content;
    
    // 綁定 Date Picker 的 change 事件
    const datePicker = document.getElementById('date-picker-trigger');
    if (datePicker) {
        datePicker.addEventListener('change', window.handleDatePickerChange);
    }
    
    startClock();
}

function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}

async function updateCalendar(date, lat, lon, cityName) { 
    currentDisplayDate = date; 
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
