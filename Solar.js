/* solar.js - 簡化的結構模板，確保您的 script.js 不會崩潰 */
/* 請注意：這不是完整的農民曆函式庫！它只包含最低限度的定義，讓您的主程式 (script.js) 不會閃退。
   如果頁面恢復正常但顯示「載入失敗」或「測試農曆」，您需要導入完整的 solar.js 函式庫。
*/

// 定義一個簡單的 Solar 函式，這是您的 script.js 正在尋找的物件。
function Solar(date) {
    this.date = date;
}

// 實作 fromDate 靜態方法
Solar.fromDate = function(date) {
    return new Solar(date);
};

// 實作 getLunar 方法，返回所需的基本結構 (用於宜/忌)
Solar.prototype.getLunar = function() {
    return {
        // 這些值將顯示在宜/忌欄位中
        getMonthInChinese: () => "測試農曆",
        getDayInChinese: () => "初一",
        getDayYi: () => ["諸", "事", "不", "宜"],
        getDayJi: () => ["諸", "事", "不", "宜"],
        getJieQi: () => "",
        getYearInGanZhi: () => "歲次戊子"
    };
};

// 實作 getHourAuspice 方法，返回所需的時辰結構 (用於時辰吉凶表)
Solar.prototype.getHourAuspice = function() {
    // 返回一組假數據，確保表格結構不崩潰
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return hours.map(h => ({
        hour: h,
        tip: "假", // 測試數據
        description: "時辰假數據"
    }));
};
