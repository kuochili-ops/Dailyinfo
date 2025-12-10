const STACK_CONTAINER = document.getElementById('calendar-stack');
const TEAR_BUTTON = document.getElementById('tear-button');
const STORAGE_KEY = 'activeDate';

// ------------------------------------------
// I. Local Storage 處理 (保持不變)
// ------------------------------------------
function getInitialDate() {
    // ... (Local Storage 邏輯保持不變) ...
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
    // ... (Local Storage 邏輯保持不變) ...
    const dateObj = {
        year: date.getFullYear(),
        month: date.getMonth(),
        day: date.getDate()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dateObj));
}


// ------------------------------------------
// II. 日期邏輯與渲染 (使用表格和行內樣式)
// ------------------------------------------

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

function renderPageContent(element, date) {
    const dayNumber = date.getDate();
    const dateKey = formatDateKey(date);
    
    const lunarDate = LUNAR_DATES[dateKey] || "農曆資訊";
    const weekdayName = date.toLocaleString('zh-Hant', { weekday: 'long' });

    // ----------------------------------------------------
    // 使用 TABLE 模擬 GRID 佈局 (行內樣式)
    // ----------------------------------------------------
    
    // 將主要的樣式直接寫入 DOM 元素
    element.className = 'calendar-page'; // 保持 class 名稱用於 JS 查詢
    element.style.cssText = `
        position: absolute; 
        top: 0; left: 0; 
        width: 100%; height: 100%; 
        box-sizing: border-box; 
        background-color: #fefdfb; 
        box-shadow: 0 5px 10px rgba(0, 0, 0, 0.1); 
        padding: 10px;
    `;
    
    let content = '<table style="width: 100%; height: 100%; border-collapse: collapse;">';
    
    // 1. 頂部資訊 (Header Info) - 佔用 4 欄
    content += `
        <tr style="height: 40px;">
            <td colspan="4" style="border: 1px solid #eee; background-color: #f9f9f9; font-size: 0.8em; text-align: left; padding: 5px;">
                <span style="float: left;">114年 兔年</span>
                <span style="float: right;">${date.getFullYear()}</span>
            </td>
        </tr>
    `;
    
    // 2. 主體內容 (Main Body) - 三列
    content += '<tr style="height: calc(100% - 120px);">'; // 扣除頭部和腳部高度 (40px + 80px)

    // 左側小資訊 (60px)
    content += `<td style="width: 60px; border: 1px solid #eee; vertical-align: top; padding: 5px;">
        小日曆
    </td>`;

    // 農曆紅條 (20px) - 無法實現 CSS `writing-mode: vertical-rl`，只能橫排
    content += `<td style="width: 20px; border: 1px solid #eee; background-color: #cc0000; color: white; vertical-align: top; padding: 5px; font-size: 0.8em;">
        農曆 ${lunarDate}
    </td>`;

    // 大日期數字 (1fr)
    content += `<td style="border: 1px solid #eee; text-align: center; font-size: 10em; font-weight: 900; color: #004d99; vertical-align: middle;">
        ${dayNumber}
    </td>`;

    // 右側小資訊 (60px)
    content += `<td style="width: 60px; border: 1px solid #eee; vertical-align: top; padding: 5px; font-size: 0.8em;">
        ${month}月 NOV
    </td>`;

    content += '</tr>';

    // 3. 底部星期/宜忌 (Footer Info) - 佔用 4 欄
    content += `
        <tr style="height: 80px;">
            <td colspan="4" style="border: 1px solid #eee; background-color: #f9f9f9; text-align: center; padding: 5px;">
                <div style="font-size: 1.5em; color: #333; margin-bottom: 5px;">${weekdayName}</div>
                <div>宜：嫁娶 | 忌：動土</div>
            </td>
        </tr>
    `;
    
    content += '</table>';
    
    element.innerHTML = content;
}

// ------------------------------------------
// III. 堆疊與切換控制 (無動畫)
// ------------------------------------------

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
    
    // --- 舊頁面即時消失 (無動畫) ---
    currentPage.remove(); 
    
    // --- 更新日期狀態 ---
    currentDate.setDate(currentDate.getDate() + 1); 
    saveCurrentDate(currentDate); 

    // --- 渲染新的下一張紙 ---
    const newNextPage = document.createElement('div');
    const dayAfterTomorrow = new Date(currentDate);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    renderPageContent(newNextPage, dayAfterTomorrow);
    newNextPage.classList.add('next-page'); 
    
    // 行內樣式實現堆疊錯開效果
    newNextPage.style.zIndex = 1; 
    newNextPage.style.transform = 'translate(1px, 1px)'; 
    newNextPage.style.opacity = 0.98;

    STACK_CONTAINER.appendChild(newNextPage);
    
    // --- 提升當前頁 (即時切換) ---
    const newCurrentPage = document.querySelector('#calendar-stack .calendar-page.next-page');
    if (newCurrentPage) {
         newCurrentPage.classList.remove('next-page');
         newCurrentPage.classList.add('current-page');
         
         // 行內樣式提升到頂層
         newCurrentPage.style.zIndex = 2; 
         newCurrentPage.style.transform = ''; 
         newCurrentPage.style.opacity = 1;
    }
}

// ------------------------------------------
// IV. 啟動應用程式
// ------------------------------------------

renderInitialStack();
TEAR_BUTTON.addEventListener('click', handleTearSequence);
