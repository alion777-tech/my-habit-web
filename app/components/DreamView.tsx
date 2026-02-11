//app/components/DreamView.tsx
"use client";

import React from "react";
import type { Goal, UserProfile } from "@/types/appTypes";
import { saveUserProfile } from "@/lib/profileActions";
import {
  addGoal as addGoalAction,
  updateGoal as updateGoalAction,
  deleteGoal as deleteGoalAction,
} from "@/lib/goalActions";

type Props = {
  uid: string | null;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  dreamInput: string;
  setDreamInput: (v: string) => void;
  isEditingDream: boolean;
  setIsEditingDream: (v: boolean) => void;
  goals: Goal[];
  goalInput: string;
  setGoalInput: (v: string) => void;
  deadline: string;
  setDeadline: (v: string) => void;
  editingGoalId: string | null;
  setEditingGoalId: (v: string | null) => void;
  editingGoalText: string;
  setEditingGoalText: (v: string) => void;
  tabButtonStyle: React.CSSProperties;
  isDarkMode?: boolean;
  checkLimit: (type: "goals" | "todos" | "habits") => boolean;
  incrementStats: (type: "goals" | "todos" | "habits") => Promise<void>;
};

export default function DreamView({
  uid,
  profile,
  setProfile,
  dreamInput,
  setDreamInput,
  isEditingDream,
  setIsEditingDream,
  goals,
  goalInput,
  setGoalInput,
  deadline,
  setDeadline,
  editingGoalId,
  setEditingGoalId,
  editingGoalText,
  setEditingGoalText,
  tabButtonStyle,
  isDarkMode = false,
  checkLimit,
  incrementStats,
}: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 16, color: isDarkMode ? "#fff" : "#000" }}>🌈 私の夢</h2>

      {/* 夢のセクション */}
      <div style={{ marginBottom: 16 }}>
        {!profile.dream && !isEditingDream ? (
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={dreamInput}
              onChange={(e) => setDreamInput(e.target.value)}
              placeholder="あなたの夢を入力してください"
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
                background: isDarkMode ? "#374151" : "#fff",
                color: isDarkMode ? "#fff" : "#000"
              }}
            />
            <button
              onClick={async () => {
                if (!uid || !dreamInput.trim()) return;
                const trimmed = dreamInput.trim();
                console.log("[DreamSave] saving:", trimmed);
                await saveUserProfile(uid, { dream: trimmed });
                setProfile(prev => ({ ...prev, dream: trimmed }));
                setDreamInput("");
              }}
              style={{ padding: "8px 16px", borderRadius: 8, background: isDarkMode ? "#6366f1" : "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              保存
            </button>
          </div>
        ) : (
          <div>
            {isEditingDream ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={dreamInput}
                  onChange={(e) => setDreamInput(e.target.value)}
                  autoFocus
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 8,
                    border: isDarkMode ? "1px solid #6366f1" : "1px solid #ccc",
                    background: isDarkMode ? "#374151" : "#fff",
                    color: isDarkMode ? "#fff" : "#000"
                  }}
                />
                <button
                  onClick={async () => {
                    if (!uid) return;
                    const trimmed = dreamInput.trim();
                    await saveUserProfile(uid, { dream: trimmed });
                    setProfile(prev => ({ ...prev, dream: trimmed }));
                    setIsEditingDream(false);
                  }}
                  style={{ padding: "8px 16px", borderRadius: 8, background: isDarkMode ? "#6366f1" : "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
                >
                  更新
                </button>
                <button
                  onClick={() => setIsEditingDream(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    background: isDarkMode ? "#4b5563" : "#e5e7eb",
                    color: isDarkMode ? "#fff" : "#000",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <div
                onDoubleClick={() => {
                  setDreamInput(profile.dream);
                  setIsEditingDream(true);
                }}
                style={{
                  padding: "8px 16px",
                  background: isDarkMode ? "#2e1065" : "#f5f3ff",
                  borderRadius: 12,
                  border: isDarkMode ? "2px dashed #a855f7" : "1px dashed #c084fc",
                  cursor: "pointer",
                  textAlign: "center"
                }}
              >
                <p style={{ fontSize: 20, fontWeight: "bold", color: isDarkMode ? "#e9d5ff" : "#6d28d9", margin: 0 }}>
                  “{profile.dream}”
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <hr style={{ border: "none", borderTop: isDarkMode ? "1px solid #374151" : "1px solid #eee", marginBottom: 16 }} />

      {/* 目標セクション */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, marginBottom: 8, color: isDarkMode ? "#d1d5db" : "#000" }}>🎯 目標を設定する</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            placeholder="次に達成したい具体的な目標"
            style={{
              padding: 10,
              borderRadius: 8,
              border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
              background: isDarkMode ? "#374151" : "#fff",
              color: isDarkMode ? "#fff" : "#000"
            }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
                background: isDarkMode ? "#374151" : "#fff",
                color: isDarkMode ? "#fff" : "#000"
              }}
            />
            <button
              onClick={async () => {
                if (!uid || !goalInput.trim()) return;
                if (!checkLimit("goals")) return;

                await addGoalAction(uid, goalInput.trim(), deadline || undefined);
                await incrementStats("goals");

                setGoalInput("");
                setDeadline("");
              }}
              style={{ padding: "10px 24px", borderRadius: 8, background: "#10b981", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              目標を追加
            </button>
          </div>
        </div>
      </div>

      {/* 目標一覧 */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {goals.map((g) => (
          <div
            key={g.id}
            style={{
              padding: 12,
              borderRadius: 10,
              background: g.done
                ? (isDarkMode ? "#1f2937" : "#f9fafb")
                : (isDarkMode ? "#374151" : "#ffffff"),
              border: g.done
                ? (isDarkMode ? "1px solid #111827" : "1px solid #e5e7eb")
                : (isDarkMode ? "1px solid #4b5563" : "1px solid #ddd"),
              display: "flex",
              alignItems: "center",
              gap: 12,
              opacity: g.done ? 0.7 : 1,
            }}
          >
            <input
              type="checkbox"
              checked={g.done}
              onChange={async () => {
                if (!uid) return;
                await updateGoalAction(uid, g.id, { done: !g.done });
              }}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />

            <div style={{ flex: 1 }}>
              {editingGoalId === g.id ? (
                <input
                  value={editingGoalText}
                  onChange={(e) => setEditingGoalText(e.target.value)}
                  onBlur={async () => {
                    if (!uid || !editingGoalText.trim()) {
                      setEditingGoalId(null);
                      return;
                    }
                    await updateGoalAction(uid, g.id, { title: editingGoalText.trim() });
                    setEditingGoalId(null);
                  }}
                  autoFocus
                  style={{
                    width: "100%",
                    padding: 4,
                    background: isDarkMode ? "#111827" : "#fff",
                    color: isDarkMode ? "#fff" : "#000",
                    border: "1px solid #6366f1"
                  }}
                />
              ) : (
                <div
                  onDoubleClick={() => {
                    setEditingGoalId(g.id);
                    setEditingGoalText(g.title);
                  }}
                  style={{
                    textDecoration: g.done ? "line-through" : "none",
                    fontWeight: g.done ? "normal" : "600",
                    color: g.done
                      ? (isDarkMode ? "#9ca3af" : "#9ca3af")
                      : (isDarkMode ? "#f3f4f6" : "#1f2937")
                  }}
                >
                  {g.title}
                </div>
              )}
              {g.deadline && (
                <div style={{ fontSize: 11, color: g.done ? (isDarkMode ? "#4b5563" : "#d1d5db") : (isDarkMode ? "#9ca3af" : "#6b7280"), marginTop: 2 }}>
                  📅 期限: {g.deadline}
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                if (!uid || !window.confirm("この目標を削除しますか？")) return;
                await deleteGoalAction(uid, g.id);
              }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: isDarkMode ? "#9ca3af" : "#888" }}
            >
              🗑
            </button>
          </div>
        ))}
        {goals.length === 0 && (
          <p style={{ textAlign: "center", color: isDarkMode ? "#6b7280" : "#9ca3af", fontSize: 14, marginTop: 12 }}>
            まだ目標がありません。小さな一歩から始めましょう！
          </p>
        )}
      </div>
    </div>
  );
}
