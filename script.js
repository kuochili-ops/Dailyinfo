const STACK_CONTAINER = document.querySelector('.calendar-stack');
const TEAR_BUTTON = document.getElementById('tear-button');
const STORAGE_KEY = 'activeDate';

// ------------------------------------------
// I. Local Storage 處理 (G 部分)
// ------------------------------------------

// 載入或獲取當前日期
function getInitialDate() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const now = new Date();
    
    if (saved) {
        try {
            // 安全解析 JSON，防止資料損壞
            const dateObj = JSON.parse(saved);
            return new Date(dateObj.year, dateObj.month, dateObj.day);
        } catch (e) {
            console.error("Local Storage 資料損壞，重置為當前日期。", e);
            localStorage.removeItem(STORAGE_KEY);
            return now;
        }
    }
    return now;
}

// 儲存當前日期
function saveCurrentDate(date) {
    const dateObj = {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dateObj));
}

// ------------------------------------------
// II. 日期邏輯與渲染 (C, E 部分)
// ------------------------------------------

// 模擬節日數據 (E 部分)
const HOLIDAYS = {
    "2025-12-25": "聖誕節",
    "2025-12-10": "人權日", 
    "2026-01-01": "元旦"
};

function formatDateKey(date) {
    const year = date.getFullYear();
    // month + 1, 然後補零
    const month = String(date.getMonth() + 1).padStart(2, '0');
    // day 補零
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function renderPageContent(element, date) {
    const dayOfWeek = date.getDay(); // 0=週日, 6=週六
    const dayNumber = date.getDate();
    const month = date.toLocaleString('zh-Hant', { month: 'long' });
    const year = date.getFullYear();
    const dateKey = formatDateKey(date);

    let content = `<div class="day-display">`;
    content += `<span class="day-number">${dayNumber}</span>`;
    content += `<span class="month-year">${month} ${year}</span>`;
    
    // 檢查節日或週末
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        element.classList.add('weekend');
    } else {
        element.classList.remove('weekend');
    }
    
    if (HOLIDAYS[dateKey]) {
        content += `<span class="holiday">${HOLIDAYS[dateKey]}</span>`;
        element.classList.add('is-holiday');
    } else {
        element.classList.remove('is-holiday');
    }
    
    content += `</div>`;
    element.innerHTML = content;
}

// ------------------------------------------
// III. 堆疊與互動控制 (B, D 部分)
// ------------------------------------------

let currentDate = getInitialDate();

function renderInitialStack() {
    STACK_CONTAINER.innerHTML = ''; // 清空容器
    
    // 1. 渲染下一張紙 (作為堆疊的底層)
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextPage = document.createElement('div');
    nextPage.classList.add('calendar-page', 'next-page');
    renderPageContent(nextPage, tomorrow);
    STACK_CONTAINER.appendChild(nextPage);

    // 2. 渲染當前紙張 (作為堆疊的頂層)
    const currentPage = document.createElement('div');
    currentPage.classList.add('calendar-page', 'current-page');
    renderPageContent(currentPage, currentDate);
    STACK_CONTAINER.appendChild(currentPage);
    
    // 儲存當前狀態
    saveCurrentDate(currentDate);
}

function handleTearSequence() {
    const currentPage = document.querySelector('.calendar-page.current-page');
    
    if (!currentPage) return;
    
    // 1. 觸發撕紙動畫
    currentPage.classList.add('is-torn');

    // 2. 0.6 秒後 (與 CSS transition 時間匹配) 處理 DOM
    setTimeout(() => {
        
        // --- 撕紙完成後的清理 ---
        currentPage.remove(); 
        
        // --- 更新日期狀態 ---
        currentDate.setDate(currentDate.getDate() + 1); // 日期前進一天
        saveCurrentDate(currentDate); // 儲存新日期

        // --- 渲染下一張紙 ---
        const nextNextPage = document.createElement('div');
        nextNextPage.classList.add('calendar-page', 'next-page');
        
        const dayAfterTomorrow = new Date(currentDate);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        renderPageContent(nextNextPage, dayAfterTomorrow);
        
        STACK_CONTAINER.appendChild(nextNextPage);
        
        // --- 提升當前頁 ---
        const newCurrentPage = document.querySelector('.calendar-page.next-page');
        if (newCurrentPage) {
             newCurrentPage.classList.remove('next-page');
             newCurrentPage.classList.add('current-page');
             
             // 重置其 transform 和 opacity，以防動畫影響
             newCurrentPage.style.transform = 'rotate(-1deg)'; 
             newCurrentPage.style.opacity = 1;
        }

    }, 600); 
}

// ------------------------------------------
// IV. 啟動應用程式
// ------------------------------------------

// 初始化日曆堆疊
renderInitialStack();

// 綁定撕紙按鈕事件
TEAR_BUTTON.addEventListener('click', handleTearSequence);
