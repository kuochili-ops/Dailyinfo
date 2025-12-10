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

function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 核心修正：確保 HTML 內容結構與 CSS 完全匹配
function renderPageContent(element, date) {
    const dayOfWeek = date.getDay(); 
    const dayNumber = date.getDate();
    // 使用更清晰的月份和年份格式
    const monthYear = date.toLocaleString('zh-Hant', { month: 'long', year: 'numeric' });
    const dateKey = formatDateKey(date);

    let content = `<div class="day-display">`;
    content += `<span class="day-number">${dayNumber}</span>`;
    content += `<span class="month-year">${monthYear}</span>`;
    
    // 清除舊的類別，重新賦予
    element.className = 'calendar-page';

    // 檢查節日或週末
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        element.classList.add('weekend');
    }
    
    if (HOLIDAYS[dateKey]) {
        content += `<span class="holiday">${HOLIDAYS[dateKey]}</span>`;
        element.classList.add('is-holiday');
    }
    
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
    nextPage.classList.add('next-page'); // 繼承於 renderPageContent 的 base class 'calendar-page'
    renderPageContent(nextPage, tomorrow);
    STACK_CONTAINER.appendChild(nextPage);

    // 2. 渲染當前紙張 (堆疊的頂層)
    const currentPage = document.createElement('div');
    currentPage.classList.add('current-page');
    renderPageContent(currentPage, currentDate);
    STACK_CONTAINER.appendChild(currentPage);
    
    saveCurrentDate(currentDate);
}

function handleTearSequence() {
    const currentPage = document.querySelector('.calendar-page.current-page');
    
    if (!currentPage) return;
    
    currentPage.classList.add('is-torn');

    setTimeout(() => {
        
        // --- 撕紙完成後的清理 ---
        currentPage.remove(); 
        
        // --- 更新日期狀態 ---
        currentDate.setDate(currentDate.getDate() + 1); 
        saveCurrentDate(currentDate); 

        // --- 渲染新的下一張紙 ---
        const newNextPage = document.createElement('div');
        // 不再手動添加 calendar-page，讓 renderPageContent 處理 base class
        const dayAfterTomorrow = new Date(currentDate);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
        renderPageContent(newNextPage, dayAfterTomorrow);
        newNextPage.classList.add('next-page'); // 添加 next-page class
        
        STACK_CONTAINER.appendChild(newNextPage);
        
        // --- 提升當前頁 ---
        const newCurrentPage = document.querySelector('.calendar-page.next-page');
        if (newCurrentPage) {
             newCurrentPage.classList.remove('next-page');
             newCurrentPage.classList.add('current-page');
             
             // 重置 transform 和 opacity，以防殘留動畫效果
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
