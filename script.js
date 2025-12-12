// ====================================================================
// 專案名稱：極簡日曆儀表板 (按鈕修正版)
// 修正：確保小月曆下方的日期切換按鈕正常顯示並具備點擊感
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

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_CHINESE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_ENGLISH = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getChineseZodiacEmoji(year) {
    const zodiacs = ['🐒', '🐔', '🐶', '🐷', '🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑'];
    return zodiacs[(year - 2016) % 12];
}

function simplifiedToTraditional(text) {
    if (!text) return '';
    const map = { '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', '盖': '蓋', '纳': '納', '結': '結', '办': '辦', '迁': '遷', '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會', '備': '備', '园': '園', '买': '買', '卖': '賣', '发': '發', '設': '設', '坛': '壇', '饰': '飾', '馀': '餘', '疗': '療', '理': '理', '歸': '歸', '灶': '竈' };
    let result = '';
    for (let i = 0; i < text.length; i++) { result += map[text[i]] || text[i]; }
    return result;
}

function getLunarData(date) { 
    if (typeof Solar === 'undefined') return { month: '農曆', day: '載入失敗', yi: '', ji: '', jieqi: '', hourAuspice: [] };
    const lunar = Solar.fromDate(date).getLunar();
    const yiList = lunar.getDayYi();
    const jiList = lunar.getDayJi();
    const jieqi = lunar.getJieQi(); 
    const hourAuspiceMap = { '子': '吉', '丑': '凶', '寅': '吉', '卯': '凶', '辰': '吉', '巳': '凶', '午': '吉', '未': '凶', '申': '吉', '酉': '凶', '戌': '吉', '亥': '凶' };
    let hourAuspiceData = [];
    for(const hour in hourAuspiceMap) { hourAuspiceData.push({ hour: hour, auspice: hourAuspiceMap[hour] }); }
    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: simplifiedToTraditional(yiList.slice(0, 4).join(' ')), 
        ji: simplifiedToTraditional(jiList.slice(0, 4).join(' ')), 
        jieqi: jieqi,
        hourAuspice: hourAuspiceData
    };
}

async function fetchWeatherForecast(lat, lon, cityName) { 
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod != 200) return { description: "API 錯誤", temperature: "??°", city: cityName };
        const todayStr = new Date().toDateString();
        let maxT = -Infinity, minT = Infinity, desc = data.list[0].weather[0].description;
        data.list.forEach(item => {
            if (new Date(item.dt_txt).toDateString() === todayStr) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
                desc = item.weather[0].description;
            }
        });
        return { description: desc, temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`, city: cityName };
    } catch (e) { return { description: "網路錯誤", temperature: "??°", city: cityName }; }
}

function startClock() { 
    if (clockInterval) clearInterval(clockInterval);
    const update = () => {
        const el = document.getElementById('live-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    };
    update();
    clockInterval = setInterval(update, 1000);
}

function generateMiniCalendar(date) { 
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let html = '<table><thead><tr>';
    WEEKDAYS_CHINESE.forEach(d => html += `<th>${d}</th>`);
    html += '</tr></thead><tbody><tr>';
    let cells = 0;
    for (let i = 0; i < firstDay; i++) { html += '<td></td>'; cells++; }
    for (let d = 1; d <= daysInMonth; d++) {
        if (cells % 7 === 0 && cells !== 0) html += '</tr><tr>';
        let style = (d === date.getDate() && month === date.getMonth()) ? 'background:#004d99;color:white;border-radius:3px;' : '';
        html += `<td style="${style}">${d}</td>`;
        cells++;
    }
    html += '</tr></tbody></table>';
    return html;
}

function renderPageContent(date, weather) {
    const dayIdx = date.getDay();
    const lunar = getLunarData(date);
    const lunarHtml = `${lunar.month}<br>${lunar.day}${lunar.jieqi ? '<br>('+simplifiedToTraditional(lunar.jieqi)+')' : ''}`;
    
    let content = `
    <div class="top-info">
        <span>${date.getFullYear()-1911}年 歲次${typeof Solar!=='undefined'?Solar.fromDate(date).getLunar().getYearInGanZhi():''} ${getChineseZodiacEmoji(date.getFullYear())}</span>
        <span>${date.getFullYear()}</span>
    </div>
    
    <div class="main-date-container">
        <div class="lunar-badge">${lunarHtml}</div>
        <div class="center-date-info">
            <div class="big-date-number">${date.getDate()}</div>
            <div class="main-day-of-week">星期${WEEKDAYS_CHINESE[dayIdx]}</div>
        </div>
        <div class="month-info">
            <div class="month-short">${MONTH_CHINESE[date.getMonth()]}月 / ${MONTH_NAMES_SHORT[date.getMonth()]}</div>
        </div>
    </div>

    <div class="yi-ji-section">
        <div class="yi-section">宜: ${lunar.yi}</div>
        <div class="ji-section">忌: ${lunar.ji}</div>
    </div>

    <div class="bottom-row-container">
        <div class="left-info-column">
            <div class="weather-section">
                <span class="weather-city-name">${weather.city} 天氣:</span> 
                ${weather.description} 
                <span class="weather-temp">${weather.temperature}</span>
            </div>
            <div class="clock-section">
                <span id="live-clock">--:--:--</span>
            </div>
        </div>
        
        <div class="mini-calendar-container">
            <div class="mini-calendar-select-wrapper">
                <select id="mini-calendar-year" onchange="handleMiniCalendarSelection()">${Array.from({length:21},(_,i)=>`<option value="${date.getFullYear()-10+i}" ${10===i?'selected':''}>${date.getFullYear()-10+i}年</option>`).join('')}</select>
                <select id="mini-calendar-month" onchange="handleMiniCalendarSelection()">${Array.from({length:12},(_,i)=>`<option value="${i}" ${i===date.getMonth()?'selected':''}>${i+1}月</option>`).join('')}</select>
            </div>
            <div class="mini-calendar-table">${generateMiniCalendar(date)}</div>
            <div class="mini-calendar-footer">
                <button class="shift-mini-btn" id="prevDayBtn">＜</button>
                <button class="shift-mini-btn" id="nextDayBtn">＞</button>
            </div>
            <div class="mini-calendar-weekday">
                <span>星期${WEEKDAYS_CHINESE[dayIdx]}</span>
                <span>${WEEKDAYS_ENGLISH[dayIdx]}</span>
            </div>
        </div>
    </div>

    <div class="hour-auspice-container">
        <div class="hour-auspice-title">今日時辰吉凶</div>
        <div class="hour-auspice-text">
            <span class="auspice-good">吉時: ${lunar.hourAuspice.filter(h=>h.auspice==='吉').map(h=>h.hour).join(' ')}</span> | 
            <span class="auspice-bad">凶時: ${lunar.hourAuspice.filter(h=>h.auspice==='凶').map(h=>h.hour).join(' ')}</span>
        </div>
    </div>`;

    PAGE_CONTAINER.innerHTML = content;
    
    // 綁定事件
    document.getElementById('prevDayBtn').onclick = () => {
        currentDisplayDate.setDate(currentDisplayDate.getDate() - 1);
        updateCalendar(currentDisplayDate);
    };
    document.getElementById('nextDayBtn').onclick = () => {
        currentDisplayDate.setDate(currentDisplayDate.getDate() + 1);
        updateCalendar(currentDisplayDate);
    };

    startClock();
}

window.handleMiniCalendarSelection = function() {
    const y = document.getElementById('mini-calendar-year').value;
    const m = document.getElementById('mini-calendar-month').value;
    currentDisplayDate = new Date(y, m, 1);
    updateCalendar(currentDisplayDate);
}

async function updateCalendar(date) {
    const [lat, lon] = CITY_SELECTOR.value.split(',');
    const cityName = CITY_SELECTOR.options[CITY_SELECTOR.selectedIndex].textContent;
    const weather = await fetchWeatherForecast(lat, lon, cityName);
    renderPageContent(date, weather);
}

document.addEventListener('DOMContentLoaded', () => {
    TAIWAN_CITIES.forEach(c => CITY_SELECTOR.add(new Option(c.name, `${c.lat},${c.lon}`)));
    CITY_SELECTOR.onchange = () => updateCalendar(currentDisplayDate);
    updateCalendar(currentDisplayDate);
});
