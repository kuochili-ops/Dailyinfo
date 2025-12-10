const STACK_CONTAINER = document.getElementById('calendar-stack');
const TEAR_BUTTON = document.getElementById('tear-button');
const STORAGE_KEY = 'activeDate';

// I. Local Storage 處理 (保持不變)
function getInitialDate() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const now = new Date();
    if (saved) {
        try {
            const dateObj = JSON.parse(saved);
            return new Date(dateObj.year, dateObj.month, dateObj.day);
        } catch (e) {
            localStorage.removeItem(STORAGE_KEY);
            return now;
        }
    }
    return now;
}

function saveCurrentDate(date) {
    const dateObj = {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dateObj));
}


// II. 日期邏輯與渲染 (簡化為 DIV + FLOAT)
const LUNAR_DATES = {
    "2025-12-10": "十月初十", "2025-12-11": "十月十一", "2025-12-12": "十月十二"
};

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderPageContent(element, date) {
    const dayNumber = date.getDate();
    const dateKey = formatDateKey(date);
    const lunarDate = LUNAR_DATES[dateKey] || "農曆資訊";
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });

    // 設定日曆頁面的基礎行內樣式
    element.className = 'calendar-page';
    element.style.cssText = `
        position: absolute; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        box-sizing: border-box; 
        background-color: #fefdfb; 
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1); 
        padding: 10px;
    `;
    
    // ----------------------------------------------------
    // 使用 DIV 和 FLOAT 實現簡單排版
    // ----------------------------------------------------
    
    let content = '<div style="height: 100%;">';

    // 1. 頂部資訊 (使用 FLOAT 分左右)
    content += `<div style="overflow: auto; border-bottom: 1px solid #eee; padding-bottom: 5px;">
        <span style="float: left; font-size: 0.8em;">114年 兔年</span>
        <span style="float: right; font-size: 0.8em;">${date.getFullYear()}</span>
    </div>`;
    
    // 2. 主體內容
    content += `<div style="height: calc(100% - 100px); padding: 10px 0;">`; // 留空間給頂部和底部

    // 左側：農曆紅條 (僅能水平顯示)
    content += `<div style="float: left; width: 80px; background-color: #cc0000; color: white; padding: 5px; font-size: 0.9em; text-align: center; margin-right: 10px;">
        農曆 ${lunarDate}
    </div>`;

    // 中間：大日期數字
    content += `<div style="float: left; width: 100px; font-size: 5em; font-weight: 900; color: #004d99; text-align: center; line-height: 1.2;">
        ${dayNumber}
    </div>`;
    
    // 右側：小資訊
    content += `<div style="float: left; padding: 5px; font-size: 0.8em;">
        ${date.getMonth() + 1}月 NOV
    </div>`;

    content += `</div>`; // 主體內容結束

    // 3. 底部星期/宜忌 (使用 CLEAR FIX 確保在底部)
    content += `<div style="clear: both; border-top: 1px solid #eee; padding-top: 10px; text-align: center; position: absolute; bottom: 10px; width: 95%;">
        <div style="font-size: 1.5em; color: #333; margin-bottom: 5px;">${weekdayName}</div>
        <div>宜：嫁娶 | 忌：動土</div>
    </div>`;

    content += `</div>`; 
    
    element.innerHTML = content;
}

// III. 堆疊與切換控制 (無動畫，純行內樣式)
let currentDate = getInitialDate();

function renderInitialStack() {
    STACK_CONTAINER.innerHTML = ''; 
    
    // 1. 渲染下一張紙 (底層)
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextPage = document.createElement('div');
    renderPageContent(nextPage, tomorrow);
    nextPage.classList.add('next-page'); 
    
    // 行內樣式實現堆疊錯開效果
    nextPage.style.zIndex = 1; 
    nextPage.style.transform = 'translate(1px, 1px)'; 
    nextPage.style.opacity = 0.98;
    
    STACK_CONTAINER.appendChild(nextPage);

    // 2. 渲染當前紙張 (頂層)
    const currentPage = document.createElement('div');
    renderPageContent(currentPage, currentDate);
    currentPage.classList.add('current-page');
    
    // 行內樣式實現頂層效果
    currentPage.style.zIndex = 2; 
    
    STACK_CONTAINER.appendChild(currentPage);
    
    saveCurrentDate(currentDate); 
}

function handleTearSequence() {
    const currentPage = document.querySelector('#calendar-stack .calendar-page.current-page');
    
    if (!currentPage) return;
    
    // 舊頁面即時消失 (無動畫)
    currentPage.remove(); 
    
    // 更新日期狀態
    currentDate.setDate(currentDate.getDate() + 1); 
    saveCurrentDate(currentDate); 

    // 渲染新的下一張紙
    const newNextPage = document.createElement('div');
    const dayAfterTomorrow = new Date(currentDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    renderPageContent(newNextPage, dayAfterTomorrow);
    newNextPage.classList.add('next-page'); 
    
    newNextPage.style.zIndex = 1; 
    newNextPage.style.transform = 'translate(1px, 1px)'; 
    newNextPage.style.opacity = 0.98;

    STACK_CONTAINER.appendChild(newNextPage);
    
    // 提升當前頁
    const newCurrentPage = document.querySelector('#calendar-stack .calendar-page.next-page');
    if (newCurrentPage) {
         newCurrentPage.classList.remove('next-page');
         newCurrentPage.classList.add('current-page');
         
         newCurrentPage.style.zIndex = 2; 
         newCurrentPage.style.transform = ''; 
         newCurrentPage.style.opacity = 1;
    }
}

// IV. 啟動應用程式
renderInitialStack();
TEAR_BUTTON.addEventListener('click', handleTearSequence);
