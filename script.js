/* ====================================================================
   style.css - 極簡日曆 dashboard 樣式 (最終並排修正版)
   ==================================================================== */

body {
    font-family: 'Arial', sans-serif;
    margin: 0; 
    background-color: #f0f0f0;
    display: flex; 
    justify-content: center;
}
.calendar-card {
    width: 100%; 
    max-width: 400px; 
    background: white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
    margin: 10px 0;
}
.city-selection-container { 
    padding: 10px; 
    background: #f7f7f7; 
    text-align: center; 
}
#city-selector { 
    padding: 8px; 
    width: 90%; 
}

.top-info { 
    display: flex; 
    justify-content: space-between; 
    padding: 5px 15px; 
    font-size: 0.8em; 
    color: #999; 
}

/* 主日期 */
.main-date-container {
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 10px 15px; 
    border-bottom: 1px solid #eee; 
    min-height: 120px;
}
.lunar-badge { 
    width: 25%; 
    text-align: center; 
    color: #004d99; 
    font-weight: bold; 
    border-right: 1px dashed #ccc; 
}
.center-date-info { 
    flex-grow: 1; 
    text-align: center; 
}
.big-date-number { 
    font-size: 6em; 
    font-weight: 900; 
    line-height: 0.8; 
    transform: scaleY(1.3); 
    color: #333; 
}
.main-day-of-week { 
    font-size: 1.2em; 
    font-weight: bold; 
    color: #e60000; 
    margin-top: 25px; 
}
.month-info { 
    width: 25%; 
    text-align: right; 
    color: #666; 
    font-size: 0.9em; 
}

/* 宜忌 */
.yi-ji-section { 
    display: flex; 
    border-bottom: 1px solid #eee; 
}
.yi-section, .ji-section { 
    flex: 1; 
    padding: 10px 15px; 
    font-weight: bold; 
    font-size: 0.9em; 
}
.yi-section { 
    color: #e60000; 
    border-right: 1px dashed #eee; 
}
.ji-section { 
    color: #333; 
}

/* 底部欄位 */
.bottom-row-container { 
    display: flex; 
    justify-content: space-between; 
    padding: 15px; 
    border-bottom: 1px solid #eee; 
}
.left-info-column { 
    width: 55%; 
    display: flex; 
    flex-direction: column; 
}
.weather-section { 
    font-size: 0.85em; 
    color: #666; 
    min-height: 45px; 
}
.clock-section { 
    margin-top: 10px; 
    border-top: 1px solid #eee; 
    padding-top: 10px; 
}
#live-clock { 
    font-size: 1.5em; 
    color: #004d99; 
    font-weight: bold; 
    font-family: monospace; 
}

/* 小月曆 */
.mini-calendar-container { 
    width: 42%; 
    font-size: 0.7em; 
    border: 1px solid #eee; 
    border-radius: 4px; 
}
.mini-calendar-select-wrapper { 
    display: flex; 
    background: #f7f7f7; 
    padding: 2px; 
}
.mini-calendar-select-wrapper select { 
    flex: 1; 
    border: none; 
    background: transparent; 
}
.mini-calendar-table table { 
    width: 100%; 
    text-align: center; 
}
.mini-calendar-footer { 
    display: flex; 
    justify-content: space-around; 
    padding: 5px; 
    border-top: 1px solid #eee; 
    background: #fafafa; 
}
.shift-mini-btn { 
    border: 1px solid #ccc; 
    background: white; 
    cursor: pointer; 
    border-radius: 3px; 
}

/* ====================================================================
   時辰吉凶 (最終並排修正)
   ==================================================================== */
.hour-auspice-container { 
    padding: 10px 15px 20px 15px; 
    border-top: 1px solid #eee; 
}

.hour-auspice-text {
    /* 關鍵：啟用 Flexbox 實現左右並排 */
    display: flex; 
    gap: 10px; 
    font-size: 0.9em; 
    font-weight: 500;
    flex-wrap: wrap; 
}

/* 吉時/凶時卡片樣式 */
.auspice-good,
.auspice-bad {
    /* 關鍵：讓兩者平均分配空間 */
    flex: 1; 
    padding: 8px 10px; 
    border-radius: 5px;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1); 
    text-align: center; 
}

/* 吉時 -> 紅色背景，白色文字 */
.auspice-good { 
    color: white; 
    background-color: #e60000; 
}

/* 凶時 -> 黑色背景，白色文字 */
.auspice-bad { 
    color: white; 
    background-color: #333; 
}

/* 響應式調整：當視窗小於 350px 時，轉為垂直堆疊 */
@media (max-width: 350px) {
    .hour-auspice-text {
        flex-direction: column;
        gap: 8px;
    }
    .auspice-good,
    .auspice-bad {
        flex: none;
        width: 100%;
    }
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
