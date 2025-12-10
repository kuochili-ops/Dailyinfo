const PAGE_CONTAINER = document.getElementById('calendar-page-container');
const CITY_SELECTOR = document.getElementById('city-selector');
const API_KEY = 'Dcd113bba5675965ccf9e60a7e6d06e5'; 

// 臺灣主要縣市列表及其經緯度 (不變)
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

// 手動維護的宜忌和農曆清單 (不變)
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

// 【新增】簡體字到繁體字的基礎對應表
const SIMPLIFIED_TO_TRADITIONAL = {
    '个': '個', '们': '們', '与': '與', '乐': '樂', '书': '書', 
    '买': '買', '丽': '麗', '产': '產', '亲': '親', '亿': '億',
    '从': '從', '会': '會', '体': '體', '來': '來', '价': '價',
    '兒': '兒', '關': '關', '劃': '劃', '劉': '劉', '區': '區',
    '卻': '卻', '圓': '圓', '團': '團', '國': '國', '圖': '圖',
    '場': '場', '寧': '寧', '廣': '廣', '應': '應', '廠': '廠',
    '開': '開', '戶': '戶', '態': '態', '愛': '愛', '懷': '懷',
    '憂': '憂', '戶': '戶', '報': '報', '擁': '擁', '應': '應',
    '戰': '戰', '才': '才', '掃': '掃', '戶': '戶', '揚': '揚',
    '時': '時', '書': '書', '會': '會', '來': '來', '長': '長',
    '間': '間', '問': '問', '點': '點', '邊': '邊', '風': '風',
    '飛': '飛', '馬': '馬', '麗': '麗', '黃': '黃', '黨': '黨',
    '發': '發', '門': '門', '無': '無', '話': '話', '讓': '讓',
    '頭': '頭', '對': '對', '對': '對', '幾': '幾', '機': '機',
    '業': '業', '萬': '萬', '與': '與', '專': '專', '種': '種',
    '確': '確', '視': '視', '覺': '覺', '讓': '讓', '難': '難',
    '體': '體', '藝': '藝', '術': '術', '語': '語', '論': '論',
    '說': '說', '這': '這', '邊': '邊', '過': '過', '進': '進',
    '還': '還', '郵': '郵', '錢': '錢', '鐘': '鐘', '針': '針',
    '長': '長', '門': '門', '開': '開', '閉': '閉', '關': '關',
    '間': '間', '聞': '聞', '問': '問', '門': '門', '簡': '簡',
    '寫': '寫', '為': '為', '東': '東', '習': '習', '認': '認',
    '論': '論', '說': '說', '這': '這', '遠': '遠', '雙': '雙',
    '雖': '雖', '裡': '裏', '里': '裏', '面': '麵', '麵': '麵',
    '點': '點', '帶': '帶', '當': '當', '總': '總', '幾': '幾',
    '歲': '歲', '強': '強', '張': '張', '愛': '愛', '學': '學',
    '幫': '幫', '應': '應', '樣': '樣', '個': '個', '們': '們',
    '無': '無', '話': '話', '讓': '讓', '頭': '頭', '對': '對',
    '幾': '幾', '機': '機', '業': '業', '萬': '萬', '與': '與',
    '專': '專', '種': '種', '確': '確', '視': '視', '覺': '覺',
    '難': '難', '體': '體', '藝': '藝', '術': '術', '語': '語',
    '論': '論', '說': '說', '這': '這', '遠': '遠', '雙': '雙',
    '雖': '雖', '裏': '裡', '點': '點', '帶': '帶', '當': '當',
    '總': '總', '幾': '幾', '歲': '歲', '強': '強', '張': '張',
    '愛': '愛', '學': '學', '幫': '幫', '應': '應', '樣': '樣',
    '麼': '麼', '隻': '隻', '裡': '裡', '幹': '乾', '才': '纔',
    '面': '麵', '后': '後', '发': '發', '国': '國', '系': '係',
    '只': '隻', '见': '見', '个': '個', '这': '這', '们': '們',
    '为': '為', '来': '來', '过': '過', '时': '時', '间': '間',
    '里': '裡', '边': '邊', '风': '風', '飞': '飛', '马': '馬',
    '丽': '麗', '黄': '黃', '党': '黨', '门': '門', '无': '無',
    '话': '話', '让': '讓', '头': '頭', '对': '對', '几': '幾',
    '机': '機', '业': '業', '万': '萬', '与': '與', '专': '專',
    '种': '種', '确': '確', '视': '視', '觉': '覺', '难': '難',
    '体': '體', '艺': '藝', '术': '術', '语': '語', '论': '論',
    '说': '說', '远': '遠', '双': '雙', '虽': '雖', '带': '帶',
    '当': '當', '总': '總', '岁': '歲', '强': '強', '张': '張',
    '爱': '愛', '学': '學', '帮': '幫', '应': '應', '样': '樣',
    '么': '麼', '只': '隻', '干': '乾', '才': '纔', '面': '麵',
    '后': '後'
};

/**
 * 簡易簡體中文到繁體中文的轉換函式
 * @param {string} text 簡體中文文本
 * @returns {string} 轉換後的繁體中文文本
 */
function toTraditionalChinese(text) {
    let result = '';
    for (const char of text) {
        // 如果字元在對應表中，則替換；否則保持原樣
        result += SIMPLIFIED_TO_TRADITIONAL[char] || char;
    }
    return result;
}


// ------------------------------------------
// I. 每日語錄 API 擷取邏輯 (一言 API)
// ------------------------------------------

async function fetchQuote() {
    const url = 'https://v1.hitokoto.cn/?encode=json&charset=utf-8&select=hitokoto&c=a&c=d&c=e&c=f';
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const simplifiedQuote = data.hitokoto || '讀萬卷書，行萬里路。';
        const simplifiedFrom = data.from || '未知來源';
        
        // 【新增】執行簡體到繁體的轉換
        const traditionalQuote = toTraditionalChinese(simplifiedQuote);
        const traditionalFrom = toTraditionalChinese(simplifiedFrom);
        
        return `${traditionalQuote} — ${traditionalFrom}`;
        
    } catch (error) {
        console.error("Quote Fetch Error:", error);
        return '今日一句：讀萬卷書，行萬里路。';
    }
}


// ------------------------------------------
// II. 天氣 API 擷取邏輯 (不變)
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
// III. 渲染邏輯 (不變)
// ------------------------------------------

function renderPageContent(date, weather, quote) { 
    const dayNumber = date.getDate();
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });
    const month = date.getMonth() + 1;
    
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

    // 左側：農曆紅條
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
    
    // 2.5 每日語錄
    content += `<div style="clear: both; margin-top: 10px; padding: 5px; border: 1px dashed #ccc; background-color: #f9f9f9; font-size: 0.75em; color: #555; height: 50px; overflow: hidden; display: flex; align-items: center; justify-content: center; text-align: center;">
        ${quote}
    </div>`;

    // 3. 底部星期/宜忌
    content += `<div style="clear: both; border-top: 1px solid #eee; padding-top: 10px; text-align: center; position: absolute; bottom: 10px; width: 95%;">
        <div style="font-size: 1.5em; color: #333; margin-bottom: 5px;">${weekdayName}</div>
        <div>**宜：** ${yijiData.yi} | **忌：** ${yijiData.ji}</div>
    </div>`;

    content += `</div>`; 
    
    PAGE_CONTAINER.innerHTML = content;
}

// ------------------------------------------
// IV. 應用程式啟動與事件處理 (不變)
// ------------------------------------------

async function updateCalendar(lat, lon, cityName) {
    const today = new Date();
    PAGE_CONTAINER.innerHTML = '<div style="text-align: center; margin-top: 150px; color: #666;">獲取 ' + cityName + ' 天氣與今日語錄中...</div>';
    
    const [weatherData, quoteData] = await Promise.all([
        fetchWeatherForecast(lat, lon, cityName),
        fetchQuote() // 將獲取到的繁體語錄
    ]);
    
    renderPageContent(today, weatherData, quoteData); // 傳遞給渲染函式
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
