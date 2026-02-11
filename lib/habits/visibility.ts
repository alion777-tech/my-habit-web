// lib/habits/visibility.ts
import type { Habit } from "@/types/appTypes";

export const isHabitVisibleOnDate = (h: Habit, dateStr: string) => {
  if (h.type === "daily") return true;

  // weekly: dateStr の曜日で判定
  const d = new Date(dateStr); // "YYYY-MM-DD"
  const dow = d.getDay(); // 0(日)〜6(土)

  return Array.isArray(h.daysOfWeek) && h.daysOfWeek.includes(dow);
};
