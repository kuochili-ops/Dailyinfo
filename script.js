const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表及其經緯度
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

// 手動維護的宜忌和農曆清單 (僅供演示，需您自行填充更多日期)
const YIJIS = {
    '2025-12-11': { 
        yi: '祭祀, 納財, 開市', 
        ji: '動土, 安床, 移徙', 
        lunar: '農曆十一月 廿一' 
    },
    '2025-12-12': { 
        yi: '嫁娶, 訂盟, 祈福', 
        ji: '入宅, 安門, 蓋屋', 
        lunar: '農曆十一月 廿二' 
    },
    '2025-12-13': { 
        yi: '出行, 簽約, 求醫', 
        ji: '破土, 交易, 納畜', 
        lunar: '農曆十一月 廿三' 
    },
};


// ------------------------------------------
// I. 每日語錄 API 擷取邏輯 (一言 API)
// ------------------------------------------

async function fetchQuote() {
    // 查詢一句隨機語錄 (二次元, 小說, 動畫類)
    const url = 'https://v1.hitokoto.cn/?encode=json&charset=utf-8&select=hitokoto&c=a&c=d&c=e&c=f';
    try {
        const response = await fetch(url);
        const data = await response.json();
        const from = data.from || '未知來源';
        return `${data.hitokoto} — ${from}`;
    } catch (error) {
        console.error("Quote Fetch Error:", error);
        return '今日一句：讀萬卷書，行萬里路。';
    }
}


// ------------------------------------------
// II. 天氣 API 擷取邏輯 (OpenWeatherMap 2.5 - 使用經緯度)
// ------------------------------------------

async function fetchWeatherForecast(lat, lon, cityName) {
    const forecast_url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=zh_tw`;
    
    try {
        const response = await fetch(forecast_url);
        const data = await response.json();

        if (data.cod != 200) {
            console.error("OpenWeatherMap 2.5 API 錯誤:", data.message);
            return { description: "API 查詢失敗", temperature: "??° ~ ??°", city: cityName };
        }

        const todayList = data.list[0];
        const description = todayList.weather[0].description;
        
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
        
        const tempMax = maxT === -Infinity ? '??' : Math.round(maxT);
        const tempMin = minT === Infinity ? '??' : Math.round(minT);
        
        return {
            description: description,
            temperature: `${tempMin}°C ~ ${tempMax}°C`,
            city: cityName
        };

    } catch (error) {
        console.error("Fetch Error:", error);
        return { description: "網路連線錯誤", temperature: "??° ~ ??°", city: cityName };
    }
}

// ------------------------------------------
// III. 渲染邏輯 (已修改：讀取宜忌和語錄數據)
// ------------------------------------------

function renderPageContent(date, weather, quote) { // 接收 quote 參數
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    
    // 獲取宜忌和農曆數據
    const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const yijiData = YIJIS[dateKey] || { 
        yi: '無', 
        ji: '無', 
        lunar: '農曆資訊不足' 
    };
    
    let content = '<div style="height: 100%;">';

    // 1. 頂部資訊
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">114年 兔年</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容
    content += `<div style="height: calc(100% - 100px); padding: 10px 0; overflow: auto;">`; 

    // 左側：農曆紅條 (使用動態農曆)
    content += `<div style="float: left; width: 80px; background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; margin-right: 10px;">
        ${yijiData.lunar}
    </div>`;

    // 中間：大日期數字
    content += `<div style="float: left; width: 100px; font-size: 5em; font-weight: 900; color: #004d99; text-align: center; line-height: 1.2;">
        ${dayNumber}
    </div>`;
    
    // 右側：天氣資訊
    content += `<div style="float: left; padding: 5px; font-size: 0.8em; text-align: left; border: 1px solid #eee; width: 80px;">
        <div style="font-weight: bold;">${month}月 ${date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</div>
        <div style="margin-top: 10px; font-size: 1.1em; color: #333;">${weather.city}</div>
        <div>${weather.description}</div>
        <div style="font-weight: bold; color: #e60000;">${weather.temperature}</div>
    </div>`;

    content += `</div>`; // 主體內容結束
    
    // 2.5 每日語錄 (新增區塊)
    content += `<div style="clear: both; margin-top: 10px; padding: 5px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.75em; color: #555; height: 50px; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center;">
        ${quote}
    </div>`;

    // 3. 底部星期/宜忌 (使用動態宜忌)
    // 調整定位，以便為語錄留出空間
    content += `<div style="clear: both; border-top: 1px solid #eee; padding-top: 10px; text-align: center; position: absolute; bottom: 10px; width: 95%;">
        <div style="font-size: 1.5em; color: #333; margin-bottom: 5px;">${weekdayName}</div>
        <div>**宜：** ${yijiData.yi} | **忌：** ${yijiData.ji}</div>
    </div>`;

    content += `</div>`; 
    
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// IV. 應用程式啟動與事件處理
// ------------------------------------------

// 核心啟動和更新邏輯
async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
    // 顯示載入狀態
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取 ' + cityName + ' 天氣與今日語錄中...</div>';
    
    // 同時請求天氣和語錄
    const [weatherData, quoteData] = await Promise.all([
        fetchWeatherForecast(lat, lon, cityName),
        fetchQuote()
    ]);
    
    renderPageContent(today, weatherData, quoteData);
}

// 載入城市選單 (保持不變)
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
