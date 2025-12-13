// ====================================================================
// 專案名稱：極簡日曆儀表板 (時辰吉凶強制更新版)
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

let currentDisplayDate = new Date(); 
let clockInterval = null;

const TAIWAN_CITIES = [
    { name: '臺北市', lat: 25.0330, lon: 121.5654 }, { name: '新北市', lat: 25.0139, lon: 121.4552 }, 
    { name: '桃園市', lat: 24.9961, lon: 121.3129 }, { name: '臺中市', lat: 24.1478, lon: 120.6728 }, 
    { name: '臺南市', lat: 22.9909, lon: 120.2132 }, { name: '高雄市', lat: 22.6273, lon: 120.3014 }
];

// --- 核心計算：根據當日農曆物件計算時辰吉凶 ---
function calculateHourAuspice(lunar) {
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    // 黃道六神（吉）：青龍、明堂、金匱、天德、玉堂、司命
    const luckyGods = ['青龍', '明堂', '金匱', '天德', '玉堂', '司命'];
    
    let good = [];
    let bad = [];

    // 強制對 12 個時辰進行輪詢計算
    hours.forEach(h => {
        // 透過 getTimeZhiShen 取得該時辰對應當日日柱的神煞
        const god = lunar.getTimeZhiShen(h + '時');
        if (luckyGods.includes(god)) {
            good.push(h);
        } else {
            bad.push(h);
        }
    });

    return {
        good: good.join(' '),
        bad: bad.join(' ')
    };
}

function getLunarData(date) { 
    if (typeof Solar === 'undefined') return { month: '農曆', day: '載入中', yi: '', ji: '', hourAuspice: {good:'--', bad:'--'} };
    
    // 取得當前日期的農曆物件
    const lunar = Solar.fromDate(date).getLunar();
    
    // 立即計算該日期的時辰吉凶
    const auspice = calculateHourAuspice(lunar);

    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: simplifiedToTraditional(lunar.getDayYi().slice(0, 5).join(' ')), 
        ji: simplifiedToTraditional(lunar.getDayJi().slice(0, 5).join(' ')), 
        jieqi: lunar.getJieQi(),
        ganzhi: lunar.getYearInGanZhi(),
        hourAuspice: auspice
    };
}

function simplifiedToTraditional(text) {
    if (!text) return '';
    const map = { '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', '盖': '蓋', '纳': '納', '結': '結', '办': '辦', '迁': '遷', '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會', '備': '備', '园': '園', '買': '買', '賣': '賣', '發': '發', '設': '設', '壇': '壇', '飾': '飾' };
    return text.split('').map(c => map[c] || c).join('');
}

// --- 渲染畫面 (確保 UI 內容與邏輯同步) ---
function renderPageContent(date, weather) {
    const lunar = getLunarData(date);
    const dayIdx = date.getDay();
    const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
    const MONTH_CHINESE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    PAGE_CONTAINER.innerHTML = `
    <div class="top-info">
        <span>${date.getFullYear()-1911}年 歲次${lunar.ganzhi}</span>
        <span>${date.getFullYear()}</span>
    </div>
    
    <div class="main-date-container">
        <div class="lunar-badge">${lunar.month}<br>${lunar.day}${lunar.jieqi ? '<br>('+simplifiedToTraditional(lunar.jieqi)+')' : ''}</div>
        <div class="center-date-info">
            <div class="big-date-number">${date.getDate()}</div>
            <div class="main-day-of-week">星期${WEEKDAYS_CHINESE[dayIdx]}</div>
        </div>
        <div class="month-info">
            <div class="month-short"><b>${MONTH_CHINESE[date.getMonth()]}月</b> / ${MONTH_NAMES_SHORT[date.getMonth()]}</div>
        </div>
    </div>

    <div class="yi-ji-section">
        <div class="yi-section">宜: ${lunar.yi}</div>
        <div class="ji-section">忌: ${lunar.ji}</div>
    </div>

    <div class="bottom-row-container">
        <div class="left-info-column">
            <div id="weather-box" class="weather-section">
                <span class="weather-city-name">${weather.city} 天氣:</span> 
                ${weather.description} <span class="weather-temp">${weather.temperature}</span>
            </div>
            <div class="clock-section">
                <span id="live-clock">--:--:--</span>
            </div>
        </div>
        <div class="mini-calendar-container">
            <div class="mini-calendar-select-wrapper">
                <select id="mini-calendar-year" onchange="handleMiniCalendarSelection()">${Array.from({length:21},(_,i)=>`<option value="${date.getFullYear()-10+i}" ${date.getFullYear()-10+i===date.getFullYear()?'selected':''}>${date.getFullYear()-10+i}年</option>`).join('')}</select>
                <select id="mini-calendar-month" onchange="handleMiniCalendarSelection()">${Array.from({length:12},(_,i)=>`<option value="${i}" ${i===date.getMonth()?'selected':''}>${i+1}月</option>`).join('')}</select>
            </div>
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
            <div class="mini-calendar-footer">
                <button class="shift-mini-btn" id="prevDayBtn">＜</button>
                <button class="shift-mini-btn" id="nextDayBtn">＞</button>
            </div>
        </div>
    </div>

    <div class="hour-auspice-container">
        <div class="hour-auspice-text">
            <span class="auspice-good">吉時: ${lunar.hourAuspice.good}</span> 
            <span class="auspice-separator">|</span>
            <span class="auspice-bad">凶時: ${lunar.hourAuspice.bad}</span>
        </div>
    </div>`;

    document.getElementById('prevDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() - 1); updateCalendar(currentDisplayDate); };
    document.getElementById('nextDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() + 1); updateCalendar(currentDisplayDate); };
    startClock();
}

// --- 更新機制 (先渲染 UI 再抓天氣，避免卡死) ---
async function updateCalendar(date) {
    const [lat, lon] = CITY_SELECTOR.value.split(',');
    const cityName = CITY_SELECTOR.options[CITY_SELECTOR.selectedIndex].textContent;
    
    // 1. 立即更新日曆內容（包含新的吉凶時辰）
    renderPageContent(date, { city: cityName, description: "載入中", temperature: "" });
    
    // 2. 異步抓取天氣，抓完再補上
    const weather = await fetchWeatherForecast(lat, lon, cityName);
    const weatherBox = document.getElementById('weather-box');
    if (weatherBox) {
        weatherBox.innerHTML = `<span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} <span class="weather-temp">${weather.temperature}</span>`;
    }
}

// 時鐘與小月曆輔助功能 (保持不變)
function startClock() { 
    if (clockInterval) clearInterval(clockInterval);
    const update = () => {
        const el = document.getElementById('live-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    };
    update(); clockInterval = setInterval(update, 1000);
}

function generateMiniCalendar(date) { 
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '<table><thead><tr>' + ['日','一','二','三','四','五','六'].map(d=>`<th style="color:${d==='日'?'#cc0000':'#333'};">${d}</th>`).join('') + '</tr></thead><tbody><tr>';
    let cells = 0;
    for (let i = 0; i < firstDay; i++) { html += '<td></td>'; cells++; }
    for (let d = 1; d <= daysInMonth; d++) {
        if (cells % 7 === 0 && cells !== 0) html += '</tr><tr>';
        let style = (d === date.getDate() && month === date.getMonth()) ? 'background:#004d99;color:white;border-radius:3px;font-weight:bold;' : '';
        if (cells % 7 === 0 && !style.includes('color')) style += 'color:#cc0000;';
        html += `<td style="${style}">${d}</td>`;
        cells++;
    }
    return html + '</tr></tbody></table>';
}

window.handleMiniCalendarSelection = function() {
    const y = document.getElementById('mini-calendar-year').value;
    const m = document.getElementById('mini-calendar-month').value;
    currentDisplayDate = new Date(y, m, 1);
    updateCalendar(currentDisplayDate);
}

async function fetchWeatherForecast(lat, lon, cityName) { 
    try {
        const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`);
        const data = await response.json();
        const item = data.list[0];
        return { description: item.weather[0].description, temperature: `${Math.round(item.main.temp)}°C`, city: cityName };
    } catch (e) { return { description: "暫無數據", temperature: "--°C", city: cityName }; }
}

document.addEventListener('DOMContentLoaded', () => {
    TAIWAN_CITIES.forEach(c => CITY_SELECTOR.add(new Option(c.name, `${c.lat},${c.lon}`)));
    CITY_SELECTOR.onchange = () => updateCalendar(currentDisplayDate);
    updateCalendar(currentDisplayDate);
});
