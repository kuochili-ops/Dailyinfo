// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆、每日語錄，支持城市切換與日期切換。
// 狀態：最終優化版 (所有 CSS 已分離到 style.css)
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

// I. 農民曆計算邏輯 (修正為最穩定的檢查)
function getLunarData(date) { 
    if (typeof Solar !== 'function') { 
        return { month: '農曆', day: '載入中', yi: '請確保 Solar.js 載入', ji: '請確保 Solar.js 載入', jieqi: '' };
    }
    try {
        const lunar = Solar.fromDate(date).getLunar();
        const yiList = lunar.getDayYi();
        const jiList = lunar.getDayJi();
        const jieqi = lunar.getJieQi(); 

        return {
            month: lunar.getMonthInChinese() + '月',
            day: lunar.getDayInChinese(),
            yi: yiList.slice(0, 4).join(' '),
            ji: jiList.slice(0, 4).join(' '),
            jieqi: jieqi
        };
    } catch (e) {
         return { month: '農曆', day: '載入失敗', yi: '錯誤', ji: '錯誤', jieqi: '' };
    }
}

// 時辰吉凶計算與渲染邏輯 (已加入最高等級防禦)
function getHourAuspiceData(date) { 
    if (typeof Solar !== 'function') { 
        return []; 
    }
     try {
        return Solar.fromDate(date).getHourAuspice();
    } catch (e) {
        return [];
    }
}

function generateHourAuspiceTable(data) { 
    if (!data || data.length === 0) return ''; 

    const HOUR_MAP = {
        '子': '23-01', '丑': '01-03', '寅': '03-05', '卯': '05-07', 
        '辰': '07-09', '巳': '09-11', '午': '11-13', '未': '13-15', 
        '申': '15-17', '酉': '17-19', '戌': '19-21', '亥': '21-23'
    };

    let tableHtml = `<div class="hour-auspice-container">`;
    tableHtml += `<div class="hour-auspice-title">時辰吉凶</div>`;
    tableHtml += `<table class="hour-auspice-table">`;
    
    // 樣式已轉移到 style.css
    const getColorClass = (tip) => {
        if (tip === '吉') return 'color-good';
        if (tip === '凶') return 'color-bad';
        return 'color-neutral';
    };

    // 時間區間
    tableHtml += `<thead><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            tableHtml += `<th>${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr></thead>`;

    // 時辰 (子, 丑, 寅...)
    tableHtml += `<tbody><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            const colorClass = getColorClass(item.tip);
            tableHtml += `<td>
                <div class="hour-text ${colorClass}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 吉凶提示 (吉, 凶, 平)
    data.slice(0, 6).forEach(item => { 
        if (item && item.tip) { 
            const colorClass = getColorClass(item.tip);
            tableHtml += `<td>
                <div class="tip-text ${colorClass}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr><td colspan="6" class="auspice-gap"></td></tr><tr>`; 

    // 第二行 6 個 - 時間區間
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            tableHtml += `<th>${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr><tr>`;
    
    // 第二行 6 個 - 時辰
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            const colorClass = getColorClass(item.tip);
            tableHtml += `<td>
                <div class="hour-text ${colorClass}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 第二行 6 個 - 吉凶提示
    data.slice(6, 12).forEach(item => {
        if (item && item.tip) { 
            const colorClass = getColorClass(item.tip);
            tableHtml += `<td>
                <div class="tip-text ${colorClass}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr></tbody></table>`;
    tableHtml += `</div>`;
    
    return tableHtml;
}


// II. 每日語錄 API (略，內容不變)
async function fetchQuote() { /* ... (內容不變) */
    const url = 'https://type.fit/api/quotes';
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); 

        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json(); 
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomQuote = data[randomIndex];
        return `${randomQuote.text} — ${randomQuote.author || 'Unknown'}`;
    } catch (error) {
        console.warn("Quote API failed, switching to Clock mode.");
        return null; 
    }
}

// III. 天氣 API 擷取邏輯 (略，內容不變)
async function fetchWeatherForecast(lat, lon, cityName) { /* ... (內容不變) */
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();
        if (data.cod != 200) return { description: "API 查詢失敗", temperature: "??°", city: cityName };

        const today = new Date().toDateString();
        let maxT = -Infinity;
        let minT = Infinity;
        for (const item of data.list) {
            const itemDate = new Date(item.dt_txt).toDateString();
            if (itemDate === today) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
            }
        }
        return {
            description: data.list[0].weather[0].description,
            temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`,
            city: cityName
        };
    } catch (error) {
        return { description: "網路錯誤", temperature: "??°", city: cityName };
    }
}

// IV. 時鐘功能函式 (略，內容不變)
function startClock() { /* ... (內容不變) */
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

// VI. 生成小月曆函式 (已優化，使用 Class)
function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const todayDay = date.getDate(); 
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    let html = '';
    html += `<div class="mini-calendar-table">`; // 新增容器 Class
    html += `<table>`;
    html += `<thead style="background-color: #f7f7f7;"><tr class="header-row">`;
    weekdays.forEach((day, index) => {
        const colorClass = (index === 0) ? 'sunday' : ''; // 週日紅色
        html += `<th class="${colorClass}">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;

    let cellCount = 0; 
    for (let i = 0; i < firstDayOfWeek; i++) { html += `<td></td>`; cellCount++; }
    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) { html += `</tr><tr>`; }
        const isToday = day === todayDay;
        
        let dayClasses = '';
        if (isToday) dayClasses += ' mini-calendar-today';
        if (cellCount % 7 === 0) dayClasses += ' sunday';

        html += `<td class="day-cell${dayClasses}">${day}</td>`;
        cellCount++;
    }
    while (cellCount % 7 !== 0) { html += `<td></td>`; cellCount++; }
    html += `</tr></tbody></table>`;
    html += `</div>`; // 結束容器 Class
    return html;
}

// VII. 渲染邏輯 (已優化，使用 Class)
function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const lunarData = getLunarData(date);
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;
    const AD_HEIGHT_PX = 90; 
    
    // 使用 padding-bottom Class
    let content = `<div class="content-wrapper" style="padding-bottom: ${AD_HEIGHT_PX + 20}px;">`; 

    // 1. 頂部資訊 (年號)
    content += `<div class="top-info">
        <span class="top-info-left">${date.getFullYear() - 1911}年 歲次${typeof Solar === 'function' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : ''}</span>
        <span class="top-info-right">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：大日期區塊
    content += `<div class="main-date-container">`; 
    
    // 日期切換按鈕容器
    content += `<div class="date-shift-controls">
        <button id="prev-day-btn" class="shift-btn">
            &#x23EA;
        </button>
        <button id="next-day-btn" class="shift-btn">
            &#x23E9;
        </button>
    </div>`;

    // (A) 左側：農曆紅條
    content += `<div class="lunar-badge">
        ${lunarHtml}
    </div>`;

    // (B) 中央：大日期
    content += `<div class="date-number-wrapper">
        <div class="big-date-number">
            ${dayNumber}
        </div>
    </div>`;

    // (C) 右側：月份 
    content += `<div class="month-info">
        <div class="month-short">${monthShort}</div>
        <span class="month-long-wrapper">
            <div class="month-long">${month}月</div>
        </span>
    </div>`;
    content += `</div>`; 
    
    // 3. 星期 
    content += `<div class="weekday-display">
        <div class="weekday-text">
            ${weekdayName}
        </div>
    </div>`;
    
    // 3.5. 小月曆
    content += `<div class="mini-calendar-container">
        ${generateMiniCalendar(date)}
    </div>`;

    // 4. 宜/忌 
    content += `<div class="yi-ji-section">
        <div class="yi-ji-wrapper">
            <div class="yi-col"><div class="yi-title">**宜**</div><div class="yi-text">${lunarData.yi || '諸事不宜'}</div></div>
            <div class="ji-col"><div class="ji-title">**忌**</div><div class="ji-text">${lunarData.ji || '諸事不宜'}</div></div>
        </div>
    </div>`;
    
    // 4.5. 時辰吉凶表
    const hourAuspiceData = getHourAuspiceData(date);
    content += generateHourAuspiceTable(hourAuspiceData);


    // 5. 每日語錄 或 現在時刻 
    if (quote) {
        content += `<div class="quote-clock-section">
            <span class="quote-text">"${quote}"</span>
        </div>`;
    } else {
        // 時鐘
        content += `<div class="quote-clock-section">
            <span id="live-clock" class="live-clock-text">--:--:--</span>
        </div>`;
    }

    // 6. 縣市天氣 
    content += `<div class="weather-section">
        <span class="weather-city-name">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span class="weather-temp">(${weather.temperature})</span>
    </div>`;
    
    // 7. 底部廣告空間 
    content += `<div class="ad-space"></div>`;

    content += `</div>`; 
    PAGE_CONTAINER.innerHTML = content;

    if (!quote) {
        startClock();
    }
    
    // 事件綁定
    document.getElementById('prev-day-btn').addEventListener('click', () => {
        shiftDate(-1); 
    });
    document.getElementById('next-day-btn').addEventListener('click', () => {
        shiftDate(1);  
    });
}

// ... (VIII. 日期切換核心邏輯 和 IX. 初始化與事件 保持不變) ...
function isToday(someDate) {
    const today = new Date();
    return someDate.getDate() === today.getDate() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getFullYear() === today.getFullYear();
}

function shiftDate(days) {
    const oldDate = currentDisplayDate;
    const newDate = new Date(oldDate);
    newDate.setDate(oldDate.getDate() + days); 

    const [lat, lon] = CITY_SELECTOR.value.split(',');
    const cityName = CITY_SELECTOR.options[CITY_SELECTOR.selectedIndex].textContent;

    updateCalendar(newDate, lat, lon, cityName);
}

async function updateCalendar(date, lat, lon, cityName) {
    if (clockInterval) clearInterval(clockInterval); 
    
    currentDisplayDate = date; 
    
    let weatherData = { description: "載入中", temperature: "??°", city: cityName };
    let quoteData = null;

    if (isToday(date)) {
        [weatherData, quoteData] = await Promise.all([
            fetchWeatherForecast(lat, lon, cityName),
            fetchQuote() 
        ]);
    } else {
        weatherData.description = "僅顯示今日天氣";
        weatherData.temperature = "----";
    }

    renderPageContent(date, weatherData, quoteData); 
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
        const currentDate = currentDisplayDate; 
        const [lat, lon] = event.target.value.split(',');
        const cityName = event.target.options[event.target.selectedIndex].textContent;
        updateCalendar(currentDate, lat, lon, cityName);
    });
    
    const defaultCity = TAIWAN_CITIES[0];
    const today = new Date(); 
    updateCalendar(today, defaultCity.lat, defaultCity.lon, defaultCity.name);
}

initApp();
