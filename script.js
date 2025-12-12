// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終版 - 依圖定稿)
// 功能：顯示天氣、農民曆 (含宜忌)、時鐘、時辰吉凶
// 修正：修正佈局，移除頂部換日鍵、調整月份格式、移動星期到小月曆下方。
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

// 月份與星期對應表
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_CHINESE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_ENGLISH = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


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
        '設': '設', '坛': '壇',
        '饰': '飾', '馀': '餘', '疗': '療', '理': '理', '歸': '歸',
        '灶': '竈'
    };
    let result = '';
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        result += map[char] || char;
    }
    return result;
}

// I. 農民曆計算邏輯 (使用 CDN 完整庫)
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

// II. 時辰吉凶數據擷取 & 生成
function getHourAuspiceData(date) { 
    return getLunarData(date).hourAuspice; 
}

function generateHourAuspiceContent(data) { 
    if (!data || data.length === 0) return '';
    
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

// III. 天氣 API 
async function fetchWeatherForecast(lat, lon, cityName) { 
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(forecast_url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.cod != 200) return { description: "API 查詢失敗", temperature: "??°", city: cityName };

        const today = new Date().toDateString();
        let maxT = -Infinity;
        let minT = Infinity;
        let weatherDescription = data.list[0].weather[0].description; 

        for (const item of data.list) {
            const itemDate = new Date(item.dt_txt).toDateString();
            if (itemDate === today) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
                weatherDescription = item.weather[0].description; 
            }
        }
        
        if (minT === Infinity) {
             return { description: "溫度數據缺失", temperature: "??°", city: cityName };
        }

        return {
            description: weatherDescription,
            temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`,
            city: cityName
        };
    } catch (error) {
        console.error("Weather fetch error:", error);
        return { description: "網路或金鑰錯誤", temperature: "??°", city: cityName };
    }
}

// IV. 時鐘與小月曆
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

function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date(); 
    const todayDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const displayDay = date.getDate(); 
    
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdays = WEEKDAYS_CHINESE;
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
        const isSelectedDay = (day === displayDay && month === date.getMonth() && year === date.getFullYear());
        const isCurrentDay = (day === todayDay && month === currentMonth && year === currentYear);

        let style = "padding: 0px; height: 16px; width: 14.28%;";
        
        if (isSelectedDay) { 
            style += "background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;"; 
        } else if (isCurrentDay) {
            style += "border: 1px solid #004d99; color: #004d99; border-radius: 3px;"; 
        } else if (isSunday) {
            style += "color: #cc0000;";
        } else {
            style += "color: #333;";
        }
        
        html += `<td style="${style}">${day}</td>`;
        cellCount++;
    }
    while (cellCount % 7 !== 0) html += `<td style="padding: 0px; width: 14.28%;"></td>`, cellCount++;
    html += `</tr></tbody></table>`;
    return html;
}

// V. 日期控制函式 (主日曆/小月曆共用)
function shiftDate(days) { 
    currentDisplayDate.setDate(currentDisplayDate.getDate() + days);
    updateCalendar(currentDisplayDate);
}

// VI. 新增：生成年/月下拉選單
function generateMiniCalendarHeader(date) {
    const currentYear = date.getFullYear();
    const currentMonth = date.getMonth() + 1; // 1-indexed

    let yearOptions = '';
    const startYear = currentYear - 10;
    const endYear = currentYear + 10;
    for (let y = startYear; y <= endYear; y++) {
        const selected = y === currentYear ? 'selected' : '';
        yearOptions += `<option value="${y}" ${selected}>${y}年</option>`;
    }
    
    let monthOptions = '';
    for (let m = 1; m <= 12; m++) {
        const selected = m === currentMonth ? 'selected' : '';
        monthOptions += `<option value="${m}" ${selected}>${m}月</option>`;
    }

    return `
    <div class="mini-calendar-select-wrapper">
        <select id="mini-calendar-year" onchange="handleMiniCalendarSelection()">
            ${yearOptions}
        </select>
        <select id="mini-calendar-month" onchange="handleMiniCalendarSelection()">
            ${monthOptions}
        </select>
    </div>`;
}

// VII. 新增：處理年/月選擇器變更
window.handleMiniCalendarSelection = function() {
    const yearSelect = document.getElementById('mini-calendar-year');
    const monthSelect = document.getElementById('mini-calendar-month');
    
    if (!yearSelect || !monthSelect) return;

    const newYear = parseInt(yearSelect.value);
    const newMonth = parseInt(monthSelect.value) - 1; // 轉為 0-indexed 月份
    
    // 依要求：跳月時，日期選定當月 1 日
    const newDay = 1; 

    const newDate = new Date(newYear, newMonth, newDay);
    currentDisplayDate = newDate;
    updateCalendar(currentDisplayDate);
}


// VIII. 核心渲染邏輯 (調整順序與結構)
function renderPageContent(date, weather, quote) {
    let content = '';
    const currentYear = date.getFullYear();
    const lunarYearInfo = typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : '';
    const zodiacEmoji = getChineseZodiacEmoji(currentYear); 
    const dayIndex = date.getDay();

    // 1. 頂部資訊 (年與歲次)
    content += `<div class="top-info"><span class="top-info-left">${currentYear - 1911}年 歲次${lunarYearInfo} ${zodiacEmoji}</span><span class="top-info-right">${currentYear}</span></div>`;

    let lunarData = getLunarData(date);
    let lunarHtml = `${lunarData.month}<br>${lunarData.day}`;
    if (lunarData.jieqi) lunarHtml += `<br>(${simplifiedToTraditional(lunarData.jieqi)})`; 
    
    const monthChineseName = MONTH_CHINESE[date.getMonth()];
    const monthEnglishName = MONTH_NAMES[date.getMonth()];
    // 星期資訊 (用於小月曆下方)
    const dayOfWeekChinese = `星期${WEEKDAYS_CHINESE[dayIndex]}`;
    const dayOfWeekEnglish = WEEKDAYS_ENGLISH[dayIndex];

    // 2. 移除頂部換日按鈕 (原 date-shift-wrapper)

    // 3. 主日期區塊 
    content += `<div class="main-date-container">
        <div class="lunar-badge">${lunarHtml}</div>
        <div class="date-number-wrapper"><div class="big-date-number">${date.getDate()}</div></div>
        <div class="month-info">
            <div class="month-short">${monthChineseName}月 / ${monthEnglishName}</div>
            </div>
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
            ${generateMiniCalendarHeader(date)} 
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
            <div class="mini-calendar-footer">
                <button id="prev-day-mini-btn" class="shift-btn day-shift-mini"> &#x23EA; </button>
                <button id="next-day-mini-btn" class="shift-btn day-shift-mini"> &#x23E9; </button>
            </div>
            <div class="mini-calendar-weekday">
                <span class="weekday-cn">${dayOfWeekChinese}</span>
                <span class="weekday-en">${dayOfWeekEnglish}</span>
            </div>
        </div>
        
    </div>`;
    
    // 7. 時辰吉凶 (在最下方)
    content += generateHourAuspiceContent(getHourAuspiceData(date));

    PAGE_CONTAINER.innerHTML = content;
    
    // 綁定按鈕 (只剩下小月曆下方的換日按鈕)
    document.getElementById('prev-day-mini-btn').onclick = () => shiftDate(-1);
    document.getElementById('next-day-mini-btn').onclick = () => shiftDate(1);
    
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
    
    // 1. 初始渲染：立刻顯示 "載入中"
    let weatherData = { description: "載入中", temperature: "??°", city: cityName };
    renderPageContent(date, weatherData, null); 

    // 2. 異步獲取天氣數據
    if (isToday(date)) {
        weatherData = await fetchWeatherForecast(lat, lon, cityName); 
    } else { 
        weatherData.description = "僅顯示今日天氣"; 
        weatherData.temperature = "----"; 
    }
    
    // 3. 最終渲染：顯示載入完成的數據 (或錯誤訊息)
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
