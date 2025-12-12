// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆、每日語錄，支持城市切換與日期切換。
// 狀態：最終完整版 (所有錯誤已修正)
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

// ====================================================================
// I. 農民曆計算邏輯 (修正後：確保函式在被呼叫前定義)
// ====================================================================
function getLunarData(date) { 
    if (typeof Solar === 'undefined') {
        // 現在這個訊息只會在 solar.js 載入失敗時顯示
        return { month: '農曆', day: '載入中', yi: 'Solar.js 尚未載入', ji: 'Solar.js 尚未載入', jieqi: '' };
    }
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
}

// ** II. 時辰吉凶數據擷取 (修正：從 Lunar 物件取得) **
function getHourAuspiceData(date) { 
    if (typeof Solar === 'undefined') { return []; }
    try {
        // 從 Solar 轉換到 Lunar，再呼叫 getHourAuspice()
        const lunar = Solar.fromDate(date).getLunar();
        return lunar.getHourAuspice();
    } catch (e) {
        console.error("Failed to get hour auspice data:", e);
        return []; 
    }
}

// ** III. 時辰吉凶表格生成 **
function generateHourAuspiceTable(data) { 
    if (!data || data.length === 0) return ''; 

    const HOUR_MAP = {
        '子': '23-01', '丑': '01-03', '寅': '03-05', '卯': '05-07', 
        '辰': '07-09', '巳': '09-11', '午': '11-13', '未': '13-15', 
        '申': '15-17', '酉': '17-19', '戌': '19-21', '亥': '21-23'
    };

    const getColorStyle = (tip) => {
        if (tip.includes('吉')) return 'color: green;';
        if (tip.includes('凶')) return 'color: #cc0000;';
        return 'color: #333;';
    };

    let tableHtml = `<div style="margin: 15px 5px; padding: 10px 0; border-bottom: 1px dashed #ccc; text-align: center;">`;
    tableHtml += `<div style="font-size: 1.1em; font-weight: bold; color: #004d99; margin-bottom: 5px;">時辰吉凶</div>`;
    tableHtml += `<table style="width: 100%; border-collapse: collapse; font-size: 0.9em; text-align: center;">`;
    
    // 時間區間 (上排)
    tableHtml += `<thead><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            tableHtml += `<th style="width: 16.66%; padding: 3px 0; font-weight: normal; color: #666;">${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr></thead>`;

    // 時辰 (上排)
    tableHtml += `<tbody><tr>`;
    data.slice(0, 6).forEach(item => { 
        if (item && item.hour) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 1.1em; ${colorStyle}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 吉凶提示 (上排)
    data.slice(0, 6).forEach(item => { 
        if (item && item.tip) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 0.8em; ${colorStyle}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr><td colspan="6" style="height: 10px;"></td></tr><tr>`; 

    // 時間區間 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            tableHtml += `<th style="width: 16.66%; padding: 3px 0; font-weight: normal; color: #666;">${HOUR_MAP[item.hour]}</th>`;
        }
    });
    tableHtml += `</tr><tr>`;
    
    // 時辰 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.hour) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 1.1em; ${colorStyle}">${item.hour}</div>
            </td>`;
        }
    });
    tableHtml += `</tr><tr>`;

    // 吉凶提示 (下排)
    data.slice(6, 12).forEach(item => {
        if (item && item.tip) { 
            const colorStyle = getColorStyle(item.tip);
            tableHtml += `<td style="padding: 3px 0; font-weight: bold;">
                <div style="font-size: 0.8em; ${colorStyle}">${item.tip}</div>
            </td>`;
        }
    });
    tableHtml += `</tr></tbody></table>`;
    tableHtml += `</div>`;
    
    return tableHtml;
}


// V. 天氣 API 擷取邏輯
async function fetchWeatherForecast(lat, lon, cityName) { 
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

// VI. 時鐘功能函式
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

// VII. 生成小月曆函式
function generateMiniCalendar(date) { 
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const todayDay = date.getDate(); 
    const firstDayOfWeek = new Date(year, month, 1).getDay(); 
    const daysInMonth = new Date(year, month + 1, 0).getDate(); 
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    
    let html = '';
    html += `<table style="width: 100%; border-collapse: collapse; font-size: 0.5em; text-align: center; border: 1px solid #eee;">`;
    html += `<thead style="background-color: #f7f7f7;"><tr>`;
    weekdays.forEach(day => {
        const color = day === '日' ? '#cc0000' : '#333';
        html += `<th style="padding: 0px 0; color: ${color}; font-weight: normal;">${day}</th>`;
    });
    html += `</tr></thead><tbody><tr>`;

    let cellCount = 0; 
    for (let i = 0; i < firstDayOfWeek; i++) { html += `<td style="padding: 0px;"></td>`; cellCount++; }
    for (let day = 1; day <= daysInMonth; day++) {
        if (cellCount % 7 === 0 && cellCount !== 0) { html += `</tr><tr>`; }
        const isToday = day === todayDay;
        const style = isToday 
            ? `background-color: #004d99; color: white; border-radius: 3px; font-weight: bold;` 
            : `color: #333;`;
        html += `<td style="padding: 0px; ${style}">${day}</td>`;
        cellCount++;
    }
    while (cellCount % 7 !== 0) { html += `<td style="padding: 0px;"></td>`; cellCount++; }
    html += `</tr></tbody></table>`;
    return html;
}

// VIII. 渲染邏輯
function renderPageContent(date, weather, quote) { 
    // 這裡會呼叫 getLunarData 和 getHourAuspiceData，必須確保它們在前面定義。
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    const lunarData = getLunarData(date);
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;
    
    let content = `<div style="height: 100%; position: relative; padding-bottom: 15px; max-width: 400px; margin: 0 auto; box-sizing: border-box;">`;

    // 1. 頂部資訊 (年號)
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 10px;">
        <span style="float: left; font-size: 0.8em;">${date.getFullYear() - 1911}年 歲次${typeof Solar !== 'undefined' ? Solar.fromDate(date).getLunar().getYearInGanZhi() : ''}</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容：大日期區塊
    content += `<div style="position: relative; height: 120px; margin-top: 15px; display: flex; align-items: flex-start; justify-content: center;">`; 
    
    // 日期切換按鈕容器 
    content += `<div style="position: absolute; top: 90%; width: 100%; transform: translateY(-50%); display: flex; justify-content: space-between; padding: 0 10px; z-index: 10;">
        <button id="prev-day-btn" style="background: none; border: none; font-size: 2.5em; color: #004d99; cursor: pointer; padding: 0 10px; outline: none; opacity: 0.5;">
            &#x23EA;
        </button>
        <button id="next-day-btn" style="background: none; border: none; font-size: 2.5em; color: #004d99; cursor: pointer; padding: 0 10px; outline: none; opacity: 0.5;">
            &#x23E9;
        </button>
    </div>`;

    // (A) 左側：農曆紅條
    content += `<div style="position: absolute; left: 0; background-color: #cc0000; color: white; padding: 5px; font-size: 1.1em; text-align: center; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); line-height: 1.2;">
        ${lunarHtml}
    </div>`;
    // (B) 中央：大日期
    content += `<div style="width: 100%; text-align: center;">
        <div style="font-size: 7.5em; font-weight: 900; color: #004d99; line-height: 1;">
            ${dayNumber}
        </div>
    </div>`;
    // (C) 右側：月份 
    content += `<div style="position: absolute; right: 0; text-align: right; line-height: 1.1; width: 160px;">
        <div style="font-size: 2.5em; font-weight: bold; color: #cc0000;">${monthShort}</div>
        <span style="display: block; transform: scale(2, 1.5); transform-origin: right top; margin-top: 5px;">
            <div style="font-size: 1.2em; font-weight: bold; color: #333;">${month}月</div>
        </span>
    </div>`;
    content += `</div>`; 
    
    // 3. 星期 
    content += `<div style="clear: both; margin-top: 10px; text-align: center; margin-bottom: 5px;">
        <div style="font-size: 1.5em; font-weight: bold; color: #333; margin-bottom: 5px;">
            ${weekdayName}
        </div>
    </div>`;
    
    // 3.5. 小月曆 (在星期下方，靠右)
    content += `<div style="text-align: right; margin-right: 5px; margin-bottom: 10px;">
        <div style="width: 160px; display: inline-block;">
            ${generateMiniCalendar(date)}
        </div>
    </div>`;

    // 4. 宜/忌 
    content += `<div style="margin: 0 5px; padding: 15px 0; text-align: center; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 1.1em; line-height: 1.6;">
            <div style="width: 48%; border-right: 1px solid #eee;"><div style="font-weight: bold; color: green; margin-bottom: 5px;">**宜**</div><div style="white-space: pre-wrap; color: #555;">${lunarData.yi || '諸事不宜'}</div></div>
            <div style="width: 48%;"><div style="font-weight: bold; color: #cc0000; margin-bottom: 5px;">**忌**</div><div style="white-space: pre-wrap; color: #555;">${lunarData.ji || '諸事不宜'}</div></div>
        </div>
    </div>`;
    
    // 4.5. 時辰吉凶表 
    const hourAuspiceData = getHourAuspiceData(date);
    content += generateHourAuspiceTable(hourAuspiceData);


   // 時鐘
   content += `<div style="margin-top: 20px; padding: 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 2.0em; font-weight: bold; color: #333; min-height: 50px; display: flex; align-items: center; justify-content: center; text-align: center;">
            <span id="live-clock">--:--:--</span>
        </div>`;

    // 6. 縣市天氣 
    content += `<div style="padding: 15px; text-align: center; font-size: 0.9em; color: #666;">
        <span style="font-weight: bold; color: #333;">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span style="font-weight: bold; color: #e60000;">(${weather.temperature})</span>
    </div>`;
    
    content += `</div>`; 
    PAGE_CONTAINER.innerHTML = content;

    if (!quote) {
        startClock();
    }
    
    // 按鈕事件綁定 (按鈕是動態生成的，所以必須在這裡綁定)
    document.getElementById('prev-day-btn').addEventListener('click', () => {
        shiftDate(-1); // 傳入 -1 表示前一天
    });
    document.getElementById('next-day-btn').addEventListener('click', () => {
        shiftDate(1);  // 傳入 1 表示後一天
    });
}

// ------------------------------------------
// IX. 日期切換核心邏輯
// ------------------------------------------

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
        // 只有在顯示「今天」時才獲取天氣和語錄
        [weatherData, quoteData] = await Promise.all([
            fetchWeatherForecast(lat, lon, cityName),
            fetchQuote() 
        ]);
    } else {
        weatherData.description = "僅顯示今日天氣";
        weatherData.temperature = "----";
        // 非今日不獲取語錄，強制切換到時鐘
        quoteData = null; 
    }

    renderPageContent(date, weatherData, quoteData); 
}

// ------------------------------------------
// X. 初始化與事件
// ------------------------------------------
function loadCitySelector() { 
    TAIWAN_CITIES.forEach((city) => {
        const option = document.createElement('option');
        option.value = `${city.lat},${city.lon}`; 
        option.textContent = city.name;
        // 這裡需要 CITY_SELECTOR (select id="city-selector") 存在
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
