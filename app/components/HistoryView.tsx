//app/components/HistoryView.tsx
"use client";

import type { Habit, PointHistoryItem } from "@/types/appTypes";

type Props = {
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;

  calendarDays: string[]; // "YYYY-MM-DD"
  selectedDate: string | null;
  setSelectedDate: (d: string | null) => void;

  habits: Habit[];
  isDarkMode?: boolean;
};

import { useTranslations } from "next-intl";

export default function HistoryView({
  currentMonth,
  setCurrentMonth,
  calendarDays,
  selectedDate,
  setSelectedDate,
  habits,
  isDarkMode = false,
}: Props) {
  const t = useTranslations("History");

  const goPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const items: { habit: Habit; dayPoints: PointHistoryItem[] }[] =
    selectedDate
      ? habits
        .map((h) => {
          const dayPoints = (h.pointHistory ?? []).filter(
            (p) => p.date === selectedDate
          );
          return { habit: h, dayPoints };
        })
        .filter((x) => x.dayPoints.length > 0)
      : [];

  const navButtonStyle = {
    padding: "6px 12px",
    borderRadius: 8,
    border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
    background: isDarkMode ? "#374151" : "#fff",
    color: isDarkMode ? "#fff" : "#000",
    cursor: "pointer",
    fontSize: 12,
  };

  return (
    <div>
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>📈 {t("title")}</h2>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
        <button onClick={goPrevMonth} style={navButtonStyle}>{t("prevMonth")}</button>
        <div style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>
          {currentMonth.getFullYear()} / {currentMonth.getMonth() + 1}
        </div>
        <button onClick={goNextMonth} style={navButtonStyle}>{t("nextMonth")}</button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 6,
          marginBottom: 16,
        }}
      >
        {calendarDays.map((date) => {
          const isSelected = selectedDate === date;
          return (
            <div
              key={date}
              onClick={() => setSelectedDate(date)}
              style={{
                padding: "8px 0",
                fontSize: 12,
                textAlign: "center",
                borderRadius: 8,
                cursor: "pointer",
                background: isSelected
                  ? (isDarkMode ? "#4f46e5" : "#93c5fd")
                  : (isDarkMode ? "#374151" : "#e5e7eb"),
                color: isSelected
                  ? "#fff"
                  : (isDarkMode ? "#d1d5db" : "#374151"),
                transition: "all 0.2s",
                fontWeight: isSelected ? "bold" : "normal"
              }}
            >
              {Number(date.slice(8, 10))}
            </div>
          );
        })}
      </div>

      {!selectedDate && (
        <p style={{ fontSize: 12, color: "#888", textAlign: "center", padding: 10 }}>
          {t("selectDate")}
        </p>
      )}

      {selectedDate && (
        <div style={{
          background: isDarkMode ? "#111827" : "#f1f5f9",
          padding: 12,
          borderRadius: 12,
          minHeight: 60
        }}>
          {items.length === 0 ? (
            <p style={{ fontSize: 12, color: "#888", textAlign: "center", margin: 0 }}>
              {t("noPoints")}
            </p>
          ) : (
            items.map(({ habit, dayPoints }) => (
              <div key={habit.id} style={{
                marginBottom: 10,
                paddingBottom: 8,
                borderBottom: isDarkMode ? "1px solid #1f2937" : "1px solid #e2e8f0"
              }}>
                <div style={{ fontWeight: "bold", fontSize: 13, color: isDarkMode ? "#fff" : "#000" }}>{habit.text}</div>
                {dayPoints.map((p, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#fbbf24", fontWeight: "bold" }}>
                    +{p.point}pt
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
