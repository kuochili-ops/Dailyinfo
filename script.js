// ====================================================================
// 專案名稱：極簡日曆儀表板 (時辰吉凶連動修正版)
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
// 請確認您的 API Key 有效
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

let currentDisplayDate = new Date(); 
let clockInterval = null;

const TAIWAN_CITIES = [
    { name: '臺北市', lat: 25.0330, lon: 121.5654 }, { name: '新北市', lat: 25.0139, lon: 121.4552 }, 
    { name: '桃園市', lat: 24.9961, lon: 121.3129 }, { name: '臺中市', lat: 24.1478, lon: 120.6728 }, 
    { name: '臺南市', lat: 22.9909, lon: 120.2132 }, { name: '高雄市', lat: 22.6273, lon: 120.3014 },
    { name: '基隆市', lat: 25.1276, lon: 121.7392 }, { name: '新竹市', lat: 24.8037, lon: 120.9669 }, 
    { name: '嘉義市', lat: 23.4841, lon: 120.4497 }, { name: '宜蘭縣', lat: 24.7577, lon: 121.7533 }, 
    { name: '花蓮縣', lat: 23.9730, lon: 121.6030 }, { name: '屏東縣', lat: 22.6738, lon: 120.4851 }, 
    { name: '臺東縣', lat: 22.7505, lon: 121.1518 }
];

const MONTH_NAMES_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_CHINESE = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

// 取得生肖圖標 (保持不變)
function getChineseZodiacEmoji(year) {
    const zodiacs = ['🐒', '🐔', '🐶', '🐷', '🐭', '🐮', '🐯', '🐰', '🐲', '🐍', '🐴', '🐑'];
    return zodiacs[(year - 2016) % 12];
}

// 簡體轉正體 (保持不變)
function simplifiedToTraditional(text) {
    const map = { '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', '盖': '蓋', '纳': '納', '結': '結', '办': '辦', '迁': '遷', '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會', '備': '備', '园': '園', '买': '買', '卖': '賣', '发': '發', '設': '設', '坛': '壇', '饰': '飾', '馀': '餘', '疗': '療', '理': '理', '歸': '歸', '灶': '竈' };
    return text.split('').map(c => map[c] || c).join('');
}

// *** 核心修正點：動態判斷時辰吉凶 ***
function getHourAuspiceDynamic(lunar) {
    // 十二時辰地支
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    // 黃道六神 (吉)
    const luckyGods = ['青龍', '明堂', '金匱', '天德', '玉堂', '司命'];
    
    let good = [];
    let bad = [];

    hours.forEach(h => {
        // 使用 getTimeZhiShen 取得該時辰的黃道/黑道神煞
        const god = lunar.getTimeZhiShen(h + '時');
        if (luckyGods.includes(god)) {
            good.push(h);
        } else {
            bad.push(h);
        }
    });
    return { good, bad };
}

// 取得農曆資料
function getLunarData(date) { 
    if (typeof Solar === 'undefined') {
        // 如果 Lunar 庫未載入，返回錯誤資訊
        return { month: '庫未載入', day: '請檢查HTML', yi: '錯誤', ji: '錯誤', jieqi: '', hourAuspice: {good:['--'], bad:['--']} };
    }
    
    const lunar = Solar.fromDate(date).getLunar();
    
    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: simplifiedToTraditional(lunar.getDayYi().slice(0, 5).join(' ')), 
        ji: simplifiedToTraditional(lunar.getDayJi().slice(0, 5).join(' ')), 
        jieqi: lunar.getJieQi(),
        // 確保這裡調用了動態計算
        hourAuspice: getHourAuspiceDynamic(lunar) 
    };
}

// 輔助函數：時鐘 (保持不變)
function startClock() { 
    if (clockInterval) clearInterval(clockInterval);
    const update = () => {
        const el = document.getElementById('live-clock');
        if (el) el.textContent = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    };
    update(); clockInterval = setInterval(update, 1000);
}

// 輔助函數：生成小月曆 (保持不變)
function generateMiniCalendar(date) { 
    const year = date.getFullYear(), month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
    let html = '<table><thead><tr>';
    WEEKDAYS_CHINESE.forEach(d => html += `<th style="color:${d==='日'?'#cc0000':'#333'};">${d}</th>`);
    html += '</tr></thead><tbody><tr>';
    let cells = 0;
    for (let i = 0; i < firstDay; i++) { html += '<td></td>'; cells++; }
    for (let d = 1; d <= daysInMonth; d++) {
        if (cells % 7 === 0 && cells !== 0) html += '</tr><tr>';
        // 確保只有當前月份的當天被標記
        let style = (d === date.getDate() && month === date.getMonth()) ? 'background:#004d99;color:white;border-radius:3px;font-weight:bold;' : '';
        if (cells % 7 === 0 && !style.includes('color')) style += 'color:#cc0000;';
        html += `<td style="${style}">${d}</td>`;
        cells++;
    }
    html += '</tr></tbody></table>';
    return html;
}

// 輔助函數：天氣抓取 (保持不變)
async function fetchWeatherForecast(lat, lon, cityName) { 
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); 

        const response = await fetch(url, { signal: controller.signal });
        const data = await response.json();
        clearTimeout(timeoutId);

        if (data.cod != 200) throw new Error("API Key Invalid");

        const todayStr = new Date().toDateString();
        let maxT = -Infinity, minT = Infinity, desc = data.list[0].weather[0].description;
        data.list.forEach(item => {
            if (new Date(item.dt_txt).toDateString() === todayStr) {
                maxT = Math.max(maxT, item.main.temp_max); minT = Math.min(minT, item.main.temp_min);
                desc = item.weather[0].description;
            }
        });
        return { description: desc, temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`, city: cityName };
    } catch (e) { 
        console.warn("Weather load failed:", e);
        return { description: "暫無數據", temperature: "--°C", city: cityName }; 
    }
}

// 核心渲染邏輯
function renderPageContent(date, weather) {
    const lunar = getLunarData(date);
    const dayIdx = date.getDay();
    const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];
    
    PAGE_CONTAINER.innerHTML = `
    <div class="top-info">
        <span>${date.getFullYear()-1911}年 歲次${typeof Solar!=='undefined'?Solar.fromDate(date).getLunar().getYearInGanZhi():''} ${getChineseZodiacEmoji(date.getFullYear())}</span>
        <span>${date.getFullYear()}</span>
    </div>
    
    <div class="main-date-container">
        <div class="lunar-badge">${lunar.month}<br>${lunar.day}${lunar.jieqi ? '<br>('+simplifiedToTraditional(lunar.jieqi)+')' : ''}</div>
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
            <div id="weather-display" class="weather-section">
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
            <div class="mini-calendar-weekday">
                <span>星期${WEEKDAYS_CHINESE[dayIdx]}</span>
                <span>${WEEKDAYS_ENGLISH[dayIdx]}</span>
            </div>
        </div>
    </div>

    <div class="hour-auspice-container">
        <div class="hour-auspice-title">【${date.getMonth()+1}月${date.getDate()}日】時辰吉凶</div>
        <div class="hour-auspice-text">
            <div class="auspice-row"><span class="auspice-label good">吉時</span> ${lunar.hourAuspice.good.join(' ')}</div>
            <div class="auspice-row"><span class="auspice-label bad">凶時</span> ${lunar.hourAuspice.bad.join(' ')}</div>
        </div>
    </div>`;

    document.getElementById('prevDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() - 1); updateCalendar(currentDisplayDate); };
    document.getElementById('nextDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() + 1); updateCalendar(currentDisplayDate); };
    startClock();
}

// 核心更新函數
async function updateCalendar(date) {
    const [lat, lon] = CITY_SELECTOR.value.split(',');
    const cityName = CITY_SELECTOR.options[CITY_SELECTOR.selectedIndex].textContent;
    
    // Step 1: 立即渲染日曆資訊 (使用空的 weather object)
    renderPageContent(date, { city: cityName, description: "載入中...", temperature: "" });

    // Step 2: 異步更新天氣 (不影響日曆主體)
    const weather = await fetchWeatherForecast(lat, lon, cityName);
    const weatherEl = document.getElementById('weather-display');
    if (weatherEl) {
        weatherEl.innerHTML = `<span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} <span class="weather-temp">${weather.temperature}</span>`;
    }
}

// 處理選單變動
window.handleMiniCalendarSelection = function() {
    const y = document.getElementById('mini-calendar-year').value;
    const m = document.getElementById('mini-calendar-month').value;
    // 將日期設定為該月的第一天
    currentDisplayDate = new Date(y, m, 1);
    updateCalendar(currentDisplayDate);
}

// 啟動點
document.addEventListener('DOMContentLoaded', () => {
    TAIWAN_CITIES.forEach(c => CITY_SELECTOR.add(new Option(c.name, `${c.lat},${c.lon}`)));
    CITY_SELECTOR.onchange = () => updateCalendar(currentDisplayDate);
    updateCalendar(currentDisplayDate);
});
