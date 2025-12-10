// ... (I. Local Storage 處理 和 II. 日期邏輯與渲染的頂部部分保持不變)

// 核心修正：確保 HTML 內容結構輸出完整
function renderPageContent(element, date) {
    // ... (日期計算保持不變) ...
    
    // ----------------------------------------------------
    // 組合新的 Grid 內容
    // ----------------------------------------------------
    let content = `<div class="page-content-grid">`;

    // 1. 頂部資訊 (Header Info)
    content += `<div class="grid-area header-info">`;
    content += `<span>114年 兔年</span>`;
    content += `<span class="small-calendar">10月 ${dayNumber}日</span>`;
    content += `<span>${year}</span>`;
    content += `</div>`;
    
    // 2. 左側小資訊 (Left side)
    content += `<div class="grid-area left-info">11月 2025 小日曆</div>`; // 增加可見的測試文字
    
    // 3. 農曆直排 (Lunar Area)
    content += `<div class="grid-area lunar-area">農曆 ${lunarDate}</div>`;
    
    // 4. 大日期數字 (Main Date)
    content += `<div class="grid-area main-date">${dayNumber}</div>`;
    
    // 5. 右側小資訊 (Right side)
    content += `<div class="grid-area right-info">${month}月 NOV</div>`; // 增加可見的測試文字
    
    // 6. 底部星期/宜忌 (Footer Info)
    content += `<div class="grid-area footer-info">`;
    content += `<span class="weekday-display">${weekdayName}</span>`;
    content += `<span>宜：嫁娶 | 忌：動土</span>`; 
    content += `</div>`;

    content += `</div>`; // page-content-grid 結束
    
    element.innerHTML = content;
}

// ... (其餘部分保持不變)
