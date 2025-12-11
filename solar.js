/* solar.js - 最小結構定義，用於防止主程式崩潰 (請注意：這是測試模板，非完整的日曆函式庫) */

function Solar(date) {
    this.date = date;
}

Solar.fromDate = function(date) {
    return new Solar(date);
};

Solar.prototype.getLunar = function() {
    return {
        getMonthInChinese: () => "測試農曆",
        getDayInChinese: () => "初一",
        getDayYi: () => ["諸", "事", "不", "宜"],
        getDayJi: () => ["諸", "事", "不", "宜"],
        getJieQi: () => "功能已穩定",
        getYearInGanZhi: () => "歲次戊子"
    };
};

Solar.prototype.getHourAuspice = function() {
    const hours = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return hours.map(h => ({
        hour: h,
        tip: "假",
        description: "時辰假數據"
    }));
};
