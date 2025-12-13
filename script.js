// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終清潔與並排修正版)
// 修正重點：修復 Uncaught SyntaxError (移除檔案末尾多餘的 } )。
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
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
const WEEKDAYS_CHINESE = ['日', '一', '二', '三', '四', '五', '六'];

function simplifiedToTraditional(text) {
    if (!text) return '';
    const map = { 
        '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', '盖': '蓋', '纳': '納', '結': '結', '办': '辦', // 注意這裡保留了舊版可能的問題，但由於 map 是單純的對象字面量，語法上是安全的
        '迁': '遷', '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會', '备': '備', '园': '園', 
        '买': '買', '卖': '賣', '发': '發', '設': '設', '坛': '壇', '饰': '飾', '馀': '餘', '疗': '療', 
        '理': '理', '归': '歸', '灶': '竈' 
    };
    return text.split('').map(c => map[c] || c).join('');
}

function getLunarData(date) { 
    if (typeof Solar === 'undefined') return { month: '農曆', day: '載入中', yi: '', ji: '', jieqi: '', ganzhi: '載入中' };
    const lunar = Solar.fromDate(date).getLunar();
    return {
        month: lunar.getMonthInChinese() + '月',
        day: lunar.getDayInChinese(),
        yi: simplifiedToTraditional(lunar.getDayYi().slice(0, 5).join(' ')), 
        ji: simplifiedToTraditional(lunar.getDayJi().slice(0, 5).join(' ')), 
        jieqi: lunar.getJieQi(),
        ganzhi: lunar.getYearInGanZhi() 
    };
}

async function fetchWeatherForecast(lat, lon, cityName) { 
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod != 200) throw new Error();
        
        const dateKey = new Date().toLocaleDateString();
        let maxT = -Infinity, minT = Infinity, desc = data.list[0].weather[0].description;
        
        data.list.forEach(item => {
            const itemDate = new Date(item.dt_txt).toLocaleDateString();
            if (itemDate === dateKey) {
                maxT = Math.max(maxT, item.main.temp_max); 
                minT = Math.min(minT, item.main.temp_min); 
                desc = item.weather[0].description;
            }
        });

        if (maxT === -Infinity) return { description: "數據不足", temperature: "--°C", city: cityName };

        return { description: desc, temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`, city: cityName };
    } catch (e) { 
        console.error("天氣API錯誤:", e);
        return { description: "天氣更新失敗", temperature: "--°C", city: cityName }; 
    }
}

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
    let html = '<table><thead><tr>';
    WEEKDAYS_CHINESE.forEach(d => html += `<th style="color:${d==='日'?'#cc0000':'#333'};">${d}</th>`);
    html += '</tr></thead><tbody><tr>';
    let cells = 0;
    for (let i = 0; i < firstDay; i++) { html += '<td></td>'; cells++; }
    for (let d = 1; d <= daysInMonth; d++) {
        if (cells % 7 === 0 && cells !== 0) html += '</tr><tr>';
        let style = (d === date.getDate() && month === date.getMonth() && year === currentDisplayDate.getFullYear()) ? 'background:#004d99;color:white;border-radius:3px;font-weight:bold;' : '';
        if (cells % 7 === 0 && !style.includes('color')) style += 'color:#cc0000;';
        
        html += `<td style="${style}" data-day="${d}" onclick="handleMiniCalendarClick(${year}, ${month}, ${d})">${d}</td>`;
        cells++;
    }
    html += '</tr></tbody></table>';
    return html;
}

function renderPageContent(date, lunar, weather) {
    const dayIdx = date.getDay();
    const lunarHtml = `${lunar.month}<br>${lunar.day}${lunar.jieqi ? '<br>('+simplifiedToTraditional(lunar.jieqi)+')' : ''}`;
    
    PAGE_CONTAINER.innerHTML = `
    <div class="top-info">
        <span id="lunar-year-info">${date.getFullYear()-1911}年 歲次${lunar.ganzhi}</span>
        <span>${date.getFullYear()}</span>
    </div>
    
    <div class="main-date-container">
        <div class="lunar-badge">${lunarHtml}</div>
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
            <div class="auspice-good">吉時: 子 寅 卯 午 申 酉</div> 
            <div class="auspice-bad">凶時: 丑 辰 巳 未 戌 亥</div>
        </div>
    </div>`; 

    // 重新綁定事件
    document.getElementById('prevDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() - 1); updateCalendar(currentDisplayDate); };
    document.getElementById('nextDayBtn').onclick = () => { currentDisplayDate.setDate(currentDisplayDate.getDate() + 1); updateCalendar(currentDisplayDate); };
    startClock();
}

async function updateCalendar(date) {
    try {
        const lunar = getLunarData(date);
        const [lat, lon] = CITY_SELECTOR.value.split(',');
        const cityName = CITY_SELECTOR.options[CITY_SELECTOR.selectedIndex].textContent;
        
        renderPageContent(date, lunar, { city: cityName, description: "載入中", temperature: "" });
        
        const weather = await fetchWeatherForecast(lat, lon, cityName);
        
        const weatherBox = document.getElementById('weather-box');
        if (weatherBox) {
            weatherBox.innerHTML = `<span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} <span class="weather-temp">${weather.temperature}</span>`;
        }

        const miniCalTable = document.querySelector('.mini-calendar-table');
        if (miniCalTable) {
            miniCalTable.innerHTML = generateMiniCalendar(date);
        }
    } catch (error) {
        console.error("更新日曆時發生嚴重錯誤:", error);
        PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 50px; color: #cc0000; font-weight: bold;">日曆載入失敗 (JS 錯誤)<br>錯誤: ' + error.message + '<br>提示: 請確認 lunar.js 和 solar.js 已正確載入。</div>';
    }
}

window.handleMiniCalendarSelection = function() {
    const y = document.getElementById('mini-calendar-year').value;
    const m = document.getElementById('mini-calendar-month').value;
    currentDisplayDate.setFullYear(y);
    currentDisplayDate.setMonth(m);
    updateCalendar(currentDisplayDate);
}; 

window.handleMiniCalendarClick = function(year, month, day) {
    currentDisplayDate = new Date(year, month, day);
    updateCalendar(currentDisplayDate);
};

document.addEventListener('DOMContentLoaded', () => {
    TAIWAN_CITIES.forEach(c => CITY_SELECTOR.add(new Option(c.name, `${c.lat},${c.lon}`)));
    CITY_SELECTOR.onchange = () => updateCalendar(currentDisplayDate);
    
    updateCalendar(currentDisplayDate);
}); 
// 檔案結束
