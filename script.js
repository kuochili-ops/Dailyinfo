const STACK_CONTAINER = document.querySelector('.calendar-stack');
const TEAR_BUTTON = document.getElementById('tear-button');
const STORAGE_KEY = 'activeDate';

// ------------------------------------------
// I. Local Storage 處理
// ------------------------------------------

function getInitialDate() {
    const saved = localStorage.getItem(STORAGE_KEY);
    const now = new Date();
    
    if (saved) {
        try {
            const dateObj = JSON.parse(saved);
            // 注意：月份需要減 1
            return new Date(dateObj.year, dateObj.month, dateObj.day);
        } catch (e) {
            console.error("Local Storage 資料損壞，重置為當前日期。", e);
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

// ------------------------------------------
// II. 日期邏輯與渲染
// ------------------------------------------

const HOLIDAYS = {
    "2025-12-25": "聖誕節",
    "2025-12-10": "人權日", 
    "2026-01-01": "元旦"
};
// 模擬農曆 (實際專案需要複雜的計算庫，這裡只用固定文字)
const LUNAR_DATES = {
    "2025-12-10": "十月初十",
    "2025-12-11": "十月十一",
    "2025-12-12": "十月十二"
};

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 核心渲染函式
function renderPageContent(element, date) {
    const dayOfWeek = date.getDay(); 
    const dayNumber = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateKey = formatDateKey(date);
    
    const lunarDate = LUNAR_DATES[dateKey] || "農曆資訊"; // 從模擬數據中獲取
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });

    element.className = 'calendar-page'; // 重置 base class

    if (dayOfWeek === 0 || dayOfWeek === 6) {
        element.classList.add('weekend');
    }
    if (HOLIDAYS[dateKey]) {
        element.classList.add('is-holiday');
    }
    
    // ----------------------------------------------------
    // 組合 Grid 內容
    // ----------------------------------------------------
    let content = `<div class="page-content-grid">`;

    // 1. 頂部資訊 
    content += `<div class="grid-area header-info">`;
    content += `<span>114年 兔年</span>`;
    content += `<span class="small-calendar">10月 ${dayNumber}日</span>`;
    content += `<span>${year}</span>`;
    content += `</div>`;
    
    // 2. 左側小資訊 (小日曆區)
    content += `<div class="grid-area left-info">小日曆</div>`; 
    
    // 3. 農曆直排 (紅色紅條)
    content += `<div class="grid-area lunar-area">農曆 ${lunarDate}</div>`;
    
    // 4. 大日期數字 (核心)
    content += `<div class="grid-area main-date">${dayNumber}</div>`;
    
    // 5. 右側小資訊 (月份資訊區)
    content += `<div class="grid-area right-info">${month}月 NOV</div>`;
    
    // 6. 底部星期/宜忌
    content += `<div class="grid-area footer-info">`;
    content += `<span class="weekday-display">${weekdayName}</span>`;
    content += `<span>宜：嫁娶 | 忌：動土</span>`; 
    content += `</div>`;

    content += `</div>`; 
    
    element.innerHTML = content;
}

// ------------------------------------------
// III. 堆疊與互動控制
// ------------------------------------------

let currentDate = getInitialDate();

function renderInitialStack() {
    STACK_CONTAINER.innerHTML = ''; 
    
    // 1. 渲染下一張紙 (堆疊的底層)
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextPage = document.createElement('div');
    renderPageContent(nextPage, tomorrow);
    nextPage.classList.add('next-page'); 
    STACK_CONTAINER.appendChild(nextPage);

    // 2. 渲染當前紙張 (堆疊的頂層)
    const currentPage = document.createElement('div');
    renderPageContent(currentPage, currentDate);
    currentPage.classList.add('current-page');
    STACK_CONTAINER.appendChild(currentPage);
    
    saveCurrentDate(currentDate); 
}

function handleTearSequence() {
    const currentPage = document.querySelector('.calendar-page.current-page');
    
    if (!currentPage) return;
    
    currentPage.classList.add('is-torn');

    setTimeout(() => {
        
        // --- 撕紙完成後的清理與狀態更新 ---
        currentPage.remove(); 
        currentDate.setDate(currentDate.getDate() + 1); 
        saveCurrentDate(currentDate); 

        // --- 渲染新的下一張紙 ---
        const newNextPage = document.createElement('div');
        const dayAfterTomorrow = new Date(currentDate);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        renderPageContent(newNextPage, dayAfterTomorrow);
        newNextPage.classList.add('next-page'); 
        
        STACK_CONTAINER.appendChild(newNextPage);
        
        // --- 提升當前頁 ---
        const newCurrentPage = document.querySelector('.calendar-page.next-page');
        if (newCurrentPage) {
             newCurrentPage.classList.remove('next-page');
             newCurrentPage.classList.add('current-page');
             newCurrentPage.style.transform = 'rotate(-1deg)'; 
             newCurrentPage.style.opacity = 1;
        }

    }, 600); 
}

// ------------------------------------------
// IV. 啟動應用程式
// ------------------------------------------

renderInitialStack();
TEAR_BUTTON.addEventListener('click', handleTearSequence);
