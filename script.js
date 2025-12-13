// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終動態時辰版 - 修正 TypeError)
// 修正重點：修復 lunar.getDayBranch is not a function 錯誤，改用 getDayInGanZhi 提取日地支。
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
const HOUR_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']; // 十二地支

function simplifiedToTraditional(text) {
    if (!text) return '';
    const map = { 
        '开': '開', '动': '動', '修': '修', '造': '造', '谢': '謝', '盖': '蓋', '納': '納', '结': '結', '办': '辦', 
        '迁': '遷', '进': '進', '习': '習', '医': '醫', '启': '啟', '会': '會', '備': '備', '园': '園', 
        '买': '買', '卖': '賣', '发': '發', '设': '設', '坛': '壇', '饰': '飾', '馀': '餘', '疗': '療', 
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
        // 確保這裡的 ganzhi 是日子的干支
        ganzhi: lunar.getDayInGanZhi() 
    };
}

// ====================================================================
// 動態計算時辰吉凶的函式 (已修復日地支取得問題)
// ====================================================================
function getDynamicAuspiceHours(date) {
    if (typeof Solar === 'undefined') return { good: ['載入中'], bad: ['載入中'] };
    
    const lunar = Solar.fromDate(date).getLunar();
    
    // *** 修正點：通過 getDayInGanZhi 獲取干支，然後提取日地支 (最後一個字) ***
    const dayGanZhi = lunar.getDayInGanZhi(); 
    const dayBranch = dayGanZhi.substring(1); // 日地支 (e.g., 如果是 "甲申"，則為 "申")
    // ***************************************************************
    
    let startBranchName;

    // 1. 確定黃道起始時辰 (根據日地支查表)
    switch (dayBranch) {
        case '子': case '午': startBranchName = '申'; break; // 子午日，申時為黃道(吉)始
        case '丑': case '未': startBranchName = '戌'; break; // 丑未日，戌時為黃道(吉)始
        case '寅': case '申': startBranchName = '子'; break; // 寅申日，子時為黃道(吉)始
        case '卯': case '酉': startBranchName = '寅'; break; // 卯酉日，寅時為黃道(吉)始
        case '辰': case '戌': startBranchName = '辰'; break; // 辰戌日，辰時為黃道(吉)始
        case '巳': case '亥': startBranchName = '午'; break; // 巳亥日，午時為黃道(吉)始
        default: return { good: ['-'], bad: ['-'] };
    }

    let goodHours = [];
    let badHours = [];
    const startBranchIndex = HOUR_BRANCHES.indexOf(startBranchName);

    // 2. 依照 黃道(吉)/黑道(凶) 順序循環 12 次
    for (let i = 0; i < 12; i++) {
        const branchIndex = (startBranchIndex + i) % 12;
        const branchName = HOUR_BRANCHES[branchIndex];
        
        // 從起始時辰開始，序號 i=0, 2, 4... 是吉時 (黃道)
        if (i % 2 === 0) {
            goodHours.push(branchName);
        } else {
            badHours.push(branchName);
        }
    }

    return { good: goodHours, bad: badHours };
}

// --------------------------------------------------------------------

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

function renderPageContent(date, lunar, weather, auspiceHours) {
    const dayIdx = date.getDay();
    // 注意：這裡顯示的 ganzhi 已經是日干支，但通常日曆上會顯示年干支，這裡採用年干支來匹配常見習慣
    const lunarYearGanzhi = Solar.fromDate(date).getLunar().getYearInGanZhi(); 
    
    const lunarHtml = `${lunar.month}<br>${lunar.day}${lunar.jieqi ? '<br>('+simplifiedToTraditional(lunar.jieqi)+')' : ''}`;
    
    PAGE_CONTAINER.innerHTML = `
    <div class="top-info">
        <span id="lunar-year-info">${date.getFullYear()-1911}年 歲次${lunarYearGanzhi}</span>
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
            <div class="auspice-good">吉時: ${auspiceHours.good.join(' ')}</div> 
            <div class="auspice-bad">凶時: ${auspiceHours.bad.join(' ')}</div>
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
        
        // NEW: 計算動態的時辰吉凶
        const auspiceHours = getDynamicAuspiceHours(date);

        // 首次渲染，顯示「載入中」天氣
        renderPageContent(date, lunar, { city: cityName, description: "載入中", temperature: "" }, auspiceHours);
        
        // 異步獲取並更新天氣數據
        const weather = await fetchWeatherForecast(lat, lon, cityName);
        
        const weatherBox = document.getElementById('weather-box');
        if (weatherBox) {
            weatherBox.innerHTML = `<span class="weather-city-name">${weather.city} 天氣:</span> ${weather.description} <span class="weather-temp">${weather.temperature}</span>`;
        }

        // 局部更新小日曆
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
