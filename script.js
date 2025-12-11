// ====================================================================
// 專案名稱：極簡日曆儀表板
// 功能：顯示天氣、農民曆(自動計算)、每日語錄
// 特點：整合 lunar-javascript 實現自動宜忌與節氣；農曆三行垂直顯示
// ====================================================================

const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表
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

// ------------------------------------------
// I. 農民曆與節氣計算邏輯 (使用 lunar-javascript)
// ------------------------------------------

function getLunarData(date) {
    // 使用 Solar.fromDate 將公曆轉為農曆物件
    const lunar = Solar.fromDate(date).getLunar();
    
    // 獲取宜忌 (返回的是陣列，我們取前 3-4 個項目以防版面過長)
    const yiList = lunar.getDayYi();
    const jiList = lunar.getDayJi();
    
    // 獲取節氣 (如果當天不是節氣日，會返回空字串)
    const jieqi = lunar.getJieQi(); 

    return {
        month: lunar.getMonthInChinese() + '月', // 例如：十一月
        day: lunar.getDayInChinese(),           // 例如：廿一
        yi: yiList.slice(0, 4).join(' '),       // 取前4個宜
        ji: jiList.slice(0, 4).join(' '),       // 取前4個忌
        jieqi: jieqi                            // 節氣名稱
    };
}

// ------------------------------------------
// II. 每日語錄 API 擷取邏輯
// ------------------------------------------

async function fetchQuote() {
    const url = 'https://type.fit/api/quotes';
    try {
        const response = await fetch(url);
        const data = await response.json(); 
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomQuote = data[randomIndex];
        return `${randomQuote.text} — ${randomQuote.author || 'Unknown'}`;
    } catch (error) {
        return 'Daily Quote: Error fetching quote. (Quotes are in English)';
    }
}

// ------------------------------------------
// III. 天氣 API 擷取邏輯
// ------------------------------------------

async function fetchWeatherForecast(lat, lon, cityName) {
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();
        if (data.cod != 200) return { description: "API 查詢失敗", temperature: "??°", city: cityName };

        const today = new Date().toDateString();
        let maxT = -Infinity;
        let minT = Infinity;
        // 簡單計算今日高低溫
        for (const item of data.list) {
            const itemDate = new Date(item.dt_txt).toDateString();
            if (itemDate === today) {
                maxT = Math.max(maxT, item.main.temp_max);
                minT = Math.min(minT, item.main.temp_min);
            }
        }
        const description = data.list[0].weather[0].description;
        return {
            description: description,
            temperature: `${Math.round(minT)}°C ~ ${Math.round(maxT)}°C`,
            city: cityName
        };
    } catch (error) {
        return { description: "網路錯誤", temperature: "??°", city: cityName };
    }
}

// ------------------------------------------
// IV. 渲染邏輯 (整合自動農曆資訊)
// ------------------------------------------

function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    
    // 【核心修改】主動計算農曆資料
    const lunarData = getLunarData(date);
    
    // 處理農曆紅條顯示邏輯
    // 如果今天有節氣 (例如：大雪)，顯示節氣名稱；否則顯示「農曆」
    const topLabel = lunarData.jieqi ? lunarData.jieqi : '農曆';
    
    // 農曆 HTML 結構 (三行：標題/月/日)
    const lunarHtml = `<div>${topLabel}</div><div>${lunarData.month}</div><div>${lunarData.day}</div>`;

    // 廣告區域高度
    const AD_HEIGHT_PX = 90; 
    
    let content = `<div style="height: 100%; position: relative; padding-bottom: ${AD_HEIGHT_PX + 20}px; max-width: 400px; margin: 0 auto; box-sizing: border-box;">`;

    // 1. 頂部資訊
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">${date.getFullYear() - 1911}年 歲次${Solar.fromDate(date).getLunar().getYearInGanZhi()}</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容
    content += `<div style="clear: both; display: flex; align-items: flex-start; margin-top: 15px;">`; 

    // 左側：農曆紅條 (若有節氣，第一行會顯示節氣名稱)
    content += `<div style="background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; margin-right: 15px; flex-shrink: 0; box-shadow: 2px 2px 5px rgba(0,0,0,0.1); line-height: 1.2;">
        ${lunarHtml}
    </div>`;

    // 中央區：大日期、月份
    content += `<div style="flex-grow: 1; display: flex; align-items: center; justify-content: center;">
        <div style="display: flex; align-items: center; width: 100%;">
            <div style="font-size: 6em; font-weight: 900; color: #004d99; line-height: 1.0; margin-right: auto;">
                ${dayNumber}
            </div>
            <div style="font-size: 1.5em; font-weight: bold; color: #cc0000; line-height: 1.1; text-align: right;">
                <div>${monthShort}</div>
                <div style="font-size: 0.8em; color: #333;">${month}月</div>
            </div>
        </div>
    </div>`;

    // 右側：佔位符
    content += `<div style="width: 45px; flex-shrink: 0; margin-left: 15px;"></div>`; 
    content += `</div>`; 
    
    // 3. 星期
    content += `<div style="clear: both; margin-top: 15px; text-align: center;">
        <div style="font-size: 1.3em; font-weight: bold; color: #333; margin-bottom: 10px;">
            ${weekdayName}
        </div>
    </div>`;
    
    // 4. 宜/忌 (自動計算)
    content += `<div style="margin: 0 10px; padding: 10px 0; text-align: center; border-top: 1px dashed #ccc; border-bottom: 1px dashed #ccc;">
        <div style="display: flex; justify-content: space-around; text-align: center; font-size: 0.8em; line-height: 1.5;">
            <div style="width: 48%; border-right: 1px solid #eee;">
                <div style="font-weight: bold; color: green; margin-bottom: 5px;">**宜：**</div>
                <div style="white-space: pre-wrap; padding: 0 5px;">${lunarData.yi || '諸事不宜'}</div>
            </div>
            <div style="width: 48%;">
                <div style="font-weight: bold; color: #cc0000; margin-bottom: 5px;">**忌：**</div>
                <div style="white-space: pre-wrap; padding: 0 5px;">${lunarData.ji || '諸事不宜'}</div>
            </div>
        </div>
    </div>`;
    
    // 5. 每日語錄
    content += `<div style="margin-top: 15px; padding: 5px 10px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.8em; color: #555; height: 60px; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center;">
        ${quote}
    </div>`;

    // 6. 縣市天氣
    content += `<div style="padding: 10px; text-align: center; font-size: 0.85em; color: #666; margin-top: 10px;">
        <span style="font-weight: bold; color: #333;">${weather.city} 天氣:</span> 
        ${weather.description} 
        <span style="font-weight: bold; color: #e60000;">(${weather.temperature})</span>
    </div>`;
    
    // 7. 底部廣告空間
    content += `<div style="position: absolute; bottom: 0; left: 0; width: 100%; height: ${AD_HEIGHT_PX}px; background-color: #ddd;"></div>`;

    content += `</div>`; 
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// V. 初始化
// ------------------------------------------

async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
    // 簡單 loading
    if(PAGE_CONTAINER.innerHTML.includes('載入中')) {
         // 初次載入
    }
    
    const [weatherData, quoteData] = await Promise.all([
        fetchWeatherForecast(lat, lon, cityName),
        fetchQuote() 
    ]);
    renderPageContent(today, weatherData, quoteData); 
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
        updateCalendar(lat, lon, cityName);
    });
    const defaultCity = TAIWAN_CITIES[0];
    updateCalendar(defaultCity.lat, defaultCity.lon, defaultCity.name);
}

initApp();
