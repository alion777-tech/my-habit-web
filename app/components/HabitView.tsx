//app/components/HabitView.tsx
"use client";

import type React from "react";
import type { Habit } from "@/types/appTypes";

type Props = {
  // =========================
  // 入力（新しい習慣を追加）
  // =========================
  habit: string;
  setHabit: (v: string) => void;
  onAddHabit: () => void;

  // =========================
  // テスト日付（開発用）
  // =========================
  isDev: boolean;
  todayStr: string;
  setTestDayOffset: React.Dispatch<React.SetStateAction<number>>;

  // =========================
  // 習慣の種類（daily / weekly）
  // =========================
  habitType: "daily" | "weekly";
  setHabitType: React.Dispatch<React.SetStateAction<"daily" | "weekly">>;

  // =========================
  // weekly の曜日選択
  // =========================
  daysOfWeek: number[];
  setDaysOfWeek: React.Dispatch<React.SetStateAction<number[]>>;

  // =========================
  // 一覧表示（今日表示する習慣だけ）
  // =========================
  uid: string | null;
  visibleHabits: Habit[];

  // =========================
  // 一覧の編集（ダブルクリック編集）
  // =========================
  editingId: string | null;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  editingText: string;
  setEditingText: React.Dispatch<React.SetStateAction<string>>;

  // =========================
  // 一覧の操作（Home側の関数を呼ぶ）
  // =========================
  onToggleHabit: (habitId: string) => void;
  onSaveEdit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  isDarkMode?: boolean;
};

export default function HabitView({
  habit,
  habitType,
  setHabitType,
  setHabit,
  daysOfWeek,
  setDaysOfWeek,
  uid,
  visibleHabits,

  editingId,
  setEditingId,
  editingText,
  setEditingText,
  onToggleHabit,
  onSaveEdit,
  onDeleteHabit,

  onAddHabit,
  isDev,
  todayStr,
  setTestDayOffset,
  isDarkMode = false,
}: Props) {


  return (
    <div>
      <input
        type="text"
        placeholder="例：英語を5分"
        value={habit}
        onChange={(e) => setHabit(e.target.value)}
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 12,
          borderRadius: 8,
          border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
          background: isDarkMode ? "#374151" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
        }}
      />
      <div style={{ marginBottom: 12, color: isDarkMode ? "#d1d5db" : "#000" }}>
        <label style={{ cursor: "pointer" }}>
          <input
            type="radio"
            checked={habitType === "daily"}
            onChange={() => setHabitType("daily")}
          />
          毎日の習慣
        </label>

        <label style={{ marginLeft: 12, cursor: "pointer" }}>
          <input
            type="radio"
            checked={habitType === "weekly"}
            onChange={() => setHabitType("weekly")}
          />
          曜日だけの習慣
        </label>
      </div>
      {habitType === "weekly" && (
        <div style={{ marginBottom: 12, color: isDarkMode ? "#d1d5db" : "#000" }}>
          {["日", "月", "火", "水", "木", "金", "土"].map((label, i) => (
            <label key={i} style={{ marginRight: 6, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={daysOfWeek.includes(i)}
                onChange={() => {
                  setDaysOfWeek((prev) =>
                    prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]
                  );
                }}
              />
              {label}
            </label>
          ))}
        </div>
      )}

      <button
        onClick={onAddHabit}
        style={{
          width: "100%",
          padding: "12px 0",
          borderRadius: 8,
          border: "none",
          background: isDarkMode ? "#6366f1" : "#4f46e5",
          color: "#fff",
          fontSize: 16,
          fontWeight: "bold",
          marginBottom: 16,
          cursor: "pointer",
        }}
      >
        追加する
      </button>

      {visibleHabits.length === 0 && (
        <p style={{ color: "#888", textAlign: "center", padding: 20 }}>まだ習慣がありません</p>
      )}
      <ul style={{ paddingLeft: 0 }}>
        {visibleHabits.map((h) => {
          const isDoneToday = (h.pointHistory ?? []).some((p) => p.date === todayStr);

          // ダークモードとライトモードの配色
          const itemBg = isDoneToday
            ? (isDarkMode ? "#064e3b" : "#d1fae5")
            : (isDarkMode ? "#374151" : "#f1f5f9");
          const textColor = isDoneToday
            ? (isDarkMode ? "#6ee7b7" : "#065f46")
            : (isDarkMode ? "#f3f4f6" : "#000");

          return (
            <li
              key={h.id}
              style={{
                listStyle: "none",
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 8,
                background: itemBg,
                color: textColor,
                textDecoration: isDoneToday ? "line-through" : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                transition: "all 0.2s"
              }}
            >
              <div style={{ cursor: "pointer", display: "flex", alignItems: "center", flex: 1 }}>
                <input
                  type="checkbox"
                  checked={isDoneToday}
                  onChange={() => {
                    if (!uid) return;
                    onToggleHabit(h.id);
                  }}
                  style={{ marginRight: 10, width: 18, height: 18 }}
                />

                {editingId === h.id ? (
                  <input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => onSaveEdit(h.id)}
                    autoFocus
                    style={{
                      flex: 1,
                      marginRight: 8,
                      padding: "4px 8px",
                      borderRadius: 4,
                      border: "1px solid #4f46e5",
                      background: isDarkMode ? "#1f2937" : "#fff",
                      color: isDarkMode ? "#fff" : "#000"
                    }}
                  />
                ) : (
                  <span
                    onDoubleClick={() => {
                      setEditingId(h.id);
                      setEditingText(h.text);
                    }}
                    style={{ flex: 1 }}
                  >
                    <div style={{ fontWeight: "bold" }}>{h.text}</div>
                    <div style={{ fontSize: 11, color: isDoneToday ? (isDarkMode ? "#34d399" : "#047857") : (isDarkMode ? "#9ca3af" : "#666"), marginTop: 2 }}>🔥 連続 {h.dailyStreak} 日</div>
                  </span>
                )}
              </div>

              <button
                onClick={() => onDeleteHabit(h.id)}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 16,
                  color: isDarkMode ? "#9ca3af" : "#888",
                  padding: "4px 8px"
                }}
              >
                🗑
              </button>
            </li>
          );
        })}
      </ul>

    </div>
  );
}
