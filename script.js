// ====================================================================
// 專案名稱：極簡日曆儀表板 (最終修正版)
// 功能：使用原始的數據邏輯，結合新的 CSS 版面
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
// 註冊 OpenWeatherMap API Key
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

let currentDisplayDate = new Date(); 
let clockIntervalId = null;

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
    { name: '屏東縣', lat: 22.6685, lon: 120.4855 },
    { name: '宜蘭縣', lat: 24.7554, lon: 121.7523 },
    { name: '花蓮縣', lat: 23.9733, lon: 121.6062 },
    { name: '臺東縣', lat: 22.7562, lon: 121.1524 }
];

// I. 輔助函式
function isToday(date) {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
}

function startClock() {
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
    }
    function updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-Hant', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const clockElement = document.getElementById('live-clock');
        if (clockElement) {
            clockElement.textContent = timeString;
        }
    }
    updateTime();
    clockIntervalId = setInterval(updateTime, 1000);
}

// II. 時辰吉凶數據擷取 (使用您的原始成功邏輯)
function getHourAuspiceData(date) { 
    if (typeof Solar === 'undefined') { return []; }
    try {
        const lunar = Solar.fromDate(date).getLunar();
        // ** 這是原始成功的調用函式 **
        return lunar.getHourAuspice(); 
    } catch (e) {
        console.error("Failed to get hour auspice data:", e);
        return []; 
    }
}

// III. 農民曆數據擷取
function getLunarData(date) {
    if (typeof Solar === 'undefined') { return {}; }
    try {
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        
        return {
            month: lunar.getMonthInChinese(),
            day: lunar.getDayInChinese(),
            yi: lunar.getDayYi(),
            ji: lunar.getDayJi(),
            jieqi: lunar.getJieQi()
        };
    } catch (e) {
        console.error("Failed to get lunar data:", e);
        return { month: '未知', day: '未知', yi: '載入失敗', ji: '載入失敗' };
    }
}

// IV. 天氣 API 請求 (保持不變)
async function fetchWeatherForecast(lat, lon, cityName) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        const weather = data.weather[0].description;
        const temp = Math.round(data.main.temp);
        
        return {
            description: weather,
            temperature: `${temp}°C`,
            city: cityName
        };
    } catch (error) {
        console.error("Weather API failed:", error);
        return {
            description: "天氣 API 失敗",
            temperature: "??°C",
            city: cityName
        };
    }
}

// V. 日期切換邏輯
function shiftDate(days) {
    currentDisplayDate.setDate(currentDisplayDate.getDate() + days);
    updateCalendar(currentDisplayDate, true); // 確保每次切換都重新載入
}

// VI. 小月曆 HTML 生成 (保持不變)
function generateMiniCalendar(date) {
    if (typeof Solar === 'undefined') { return '<table><tr><td></td></tr></table>'; }
    
    const today = new Date();
    const currentMonth = date.getMonth();
    const firstDayOfMonth = new Date(date.getFullYear(), currentMonth, 1);
    const solar = Solar.fromDate(firstDayOfMonth);

    let html = '<table>';
    html += '<thead><tr><th>日</th><th>一</th><th>二</th><th>三</th><th>四</th><th>五</th><th>六</th></tr></thead>';
    html += '<tbody><tr>';

    const startWeekday = solar.getWeek(); 
    for (let i = 0; i < startWeekday; i++) {
        html += '<td></td>';
    }

    let currentDay = solar;
    let cellCount = startWeekday;

    while (currentDay.getMonth() === currentMonth) {
        if (cellCount % 7 === 0) {
            html += '</tr><tr>';
        }

        let dayStyle = '';
        if (currentDay.equals(Solar.fromDate(today))) {
            dayStyle = ' style="background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;"';
        } else if (currentDay.getDate() === date.getDate() && currentDay.getYear() === date.getFullYear() && currentDay.getMonth() === date.getMonth()) {
            dayStyle = ' style="border: 1px solid #004d99; border-radius: 3px; font-weight: bold;"';
        }

        html += `<td${dayStyle}>${currentDay.getDay()}</td>`;
        currentDay = currentDay.next(1);
        cellCount++;
    }

    while (cellCount % 7 !== 0) {
        html += '<td></td>';
        cellCount++;
    }

    html += '</tr></tbody></table>';
    return html;
}

// VII. 時辰吉凶表格 HTML 生成 (保持優化樣式)
function generateHourAuspiceTable(data) {
    if (!data || data.length === 0) {
        // 使用友善提示
        return '<div style="color: #999; font-size: 0.9em; padding-bottom: 10px;">本日無時辰吉凶資料或載入失敗</div>';
    }

    let html = '<table class="hour-auspice-table"><thead><tr><th>時辰</th><th>吉凶</th><th>說明</th></tr></thead><tbody>';
    
    data.forEach(item => {
        let jiXiongColor = item.getJiXiong().includes('吉') ? 'green' : (item.getJiXiong().includes('凶') ? '#cc0000' : '#333');
        let jiXiong = item.getJiXiong().replace('吉', '★吉').replace('凶', '▲凶');
        
        html += `<tr>
            <td class="auspice-hour">${item.getMinHm()}-${item.getMaxHm()}<br/>(${item.getHour()})</td>
            <td style="color: ${jiXiongColor}; font-weight: bold;">${jiXiong}</td>
            <td class="auspice-tip">${item.getTianShen()} / ${item.getChongSha()}</td>
        </tr>`;
    });

    html += '</tbody></table>';
    return html;
}

// VIII. 渲染邏輯 (結合您的原始數據邏輯和我的優化版面 CSS Class)
function renderPageContent(date, weather, quote) { 
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const lunarData = getLunarData(date);
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;
    
    let content = `<div id="calendar-content-wrapper">`;

    // 1. 頂部資訊 (年號)
    content += `<div class="top-info">
        <span class="year-lunar">${date.getFullYear() - 1911}年 歲次${typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : ''}</span>
        <span class="year-ad">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：大日期區塊
    content += `<div class="date-main-section">`; 
    
    // 日期切換按鈕容器 
    content += `<div class="date-nav-buttons">
        <button id="prev-day-btn" title="前一天">
            &#x23EA;
        </button>
        <button id="next-day-btn" title="後一天">
            &#x23E9;
        </button>
    </div>`;

    // (A) 左側：農曆紅條
    content += `<div class="lunar-red-bar">
        ${lunarHtml}
    </div>`;
    // (B) 中央：大日期
    content += `<div class="day-number">
        ${dayNumber}
    </div>`;
    // (C) 右側：月份 
    content += `<div class="month-section">
        <div class="month-short">${monthShort}</div>
        <span class="month-full">
            <div>${month}月</div>
        </span>
    </div>`;
    content += `</div>`; // .date-main-section 結束
    
    // 3. 星期 
    content += `<div class="weekday-section">
        <div class="weekday-name">
            ${weekdayName}
        </div>
    </div>`;
    
    // 3.5. 小月曆 (在星期下方，靠右)
    content += `<div class="mini-calendar-container-right">
        <div class="mini-calendar-wrapper">
            ${generateMiniCalendar(date)}
        </div>
    </div>`;

    // 4. 宜/忌 
    content += `<div class="yi-ji-section">
        <div class="yi-ji-content">
            <div class="yi-item"><div class="title">**宜**</div><div class="value">${lunarData.yi || '諸事不宜'}</div></div>
            <div class="ji-item"><div class="title">**忌**</div><div class="value">${lunarData.ji || '諸事不宜'}</div></div>
        </div>
    </div>`;
    
    // 4.5. 時辰吉凶表 
    const hourAuspiceData = getHourAuspiceData(date);
    content += `<div class="hour-auspice-container">
        <div class="hour-auspice-title">時辰吉凶</div>
        ${generateHourAuspiceTable(hourAuspiceData)}
    </div>`;


    // 5. 每日語錄 或 現在時刻 
    if (quote) {
        content += `<div class="quote-clock-section">
            "${quote}"
        </div>`;
    } else {
        // 時鐘
        content += `<div class="quote-clock-section live-clock-style">
            <span id="live-clock">--:--:--</span>
        </div>`;
    }

    // 6. 縣市天氣 
    content += `<div class="weather-info-footer">
        <span class="city-name-bold">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span class="temp-bold">(${weather.temperature})</span>
    </div>`;
    
    content += `</div>`; // #calendar-content-wrapper 容器結束
    PAGE_CONTAINER.innerHTML = content;

    if (!quote) {
        startClock();
    }
    
    // 按鈕事件綁定
    document.getElementById('prev-day-btn').addEventListener('click', () => {
        shiftDate(-1); 
    });
    document.getElementById('next-day-btn').addEventListener('click', () => {
        shiftDate(1);
    });
}


// IX. 啟動與初始化
async function updateCalendar(date) {
    if (clockIntervalId) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
    }

    let lat, lon, cityName;
    if (CITY_SELECTOR && CITY_SELECTOR.options.length > 0) { // 確保選擇器不為空
        const selectedIndex = CITY_SELECTOR.selectedIndex >= 0 ? CITY_SELECTOR.selectedIndex : 0;
        const selectedOption = CITY_SELECTOR.options[selectedIndex];
        
        [lat, lon] = selectedOption.value.split(',');
        cityName = selectedOption.textContent;
    } else {
        // 預設台北市
        lat = TAIWAN_CITIES[0].lat;
        lon = TAIWAN_CITIES[0].lon;
        cityName = TAIWAN_CITIES[0].name;
    }

    let weatherData = { description: "載入中", temperature: "??°", city: cityName };

    // 只有顯示今日才嘗試載入天氣
    if (isToday(date)) { 
        [weatherData] = await Promise.all([fetchWeatherForecast(lat, lon, cityName)]);
    } else { 
        weatherData.description = "非今日天氣不顯示"; 
        weatherData.temperature = "----"; 
    }
    
    // 不再嘗試獲取 Quote API，直接渲染時鐘
    renderPageContent(date, weatherData, null); 
}

function loadCitySelector() { 
    if (!CITY_SELECTOR) return;
    TAIWAN_CITIES.forEach((city) => {
        const option = document.createElement('option');
        option.value = `${city.lat},${city.lon}`; 
        option.textContent = city.name;
        CITY_SELECTOR.appendChild(option);
    });
    // 預設選擇第一個城市 (台北市)
    CITY_SELECTOR.value = `${TAIWAN_CITIES[0].lat},${TAIWAN_CITIES[0].lon}`;
}

function initApp() {
    loadCitySelector();
    if (CITY_SELECTOR) {
        CITY_SELECTOR.addEventListener('change', (event) => {
            currentDisplayDate = new Date(); // 重設為今天
            updateCalendar(currentDisplayDate);
        });
    }
    updateCalendar(currentDisplayDate);
}

// 應用程式初始化
window.onload = initApp;
