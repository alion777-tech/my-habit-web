// lib/habits/dateUtils.ts

/**
 * 日本時間 (JST) での日付文字列 (YYYY-MM-DD) を取得する
 */
export const formatDateToJST = (date: Date): string => {
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const y = jstDate.getFullYear();
    const m = String(jstDate.getMonth() + 1).padStart(2, "0");
    const d = String(jstDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

/**
 * 日本時間 (JST) での曜日 (0:日, 1:月, ..., 6:土) を取得する
 */
export const getJSTDayOfWeek = (date: Date): number => {
    const jstDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    return jstDate.getDay();
};
