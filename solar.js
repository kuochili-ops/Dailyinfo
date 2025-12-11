/* solar.js - 最小結構定義，用於防止主程式崩潰 */

// 1. 定義 Solar 函式，這是 script.js 正在尋找的核心物件。
function Solar(date) {
    this.date = date;
}

// 2. 實作靜態方法 fromDate
Solar.fromDate = function(date) {
    return new Solar(date);
};

// 3. 實作 getLunar 方法，提供農曆假資料結構
Solar.prototype.getLunar = function() {
    return {
        // 確保這些函式存在，讓 script.js 不會崩潰
        getMonthInChinese: () => "測試農曆",
        getDayInChinese: () => "初一",
        getDayYi: () => ["諸", "事", "不", "宜"],
        getDayJi: () => ["諸", "事", "不", "宜"],
        getJieQi: () => "功能已穩定", // 將顯示在農曆上方
        getYearInGanZhi: () => "歲次戊子"
    };
};

// 4. 實作 getHourAuspice 方法，提供時辰假數據結構
Solar.prototype.getHourAuspice = function() {
    // 必須返回 12 個時辰，確保表格渲染不崩潰
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return hours.map(h => ({
        hour: h,
        tip: "假", // 測試數據
        description: "時辰假數據"
    }));
};
