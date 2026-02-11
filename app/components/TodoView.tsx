//app/components/TodoView.tsx
"use client";

import React from "react";
import type { Todo } from "@/types/appTypes";
import { addTodo, toggleTodo, deleteTodo, updateTodo } from "@/lib/todoActions";

type Props = {
  uid: string | null;

  todos: Todo[];
  todoInput: string;
  setTodoInput: React.Dispatch<React.SetStateAction<string>>;

  editingTodoId: string | null;
  setEditingTodoId: React.Dispatch<React.SetStateAction<string | null>>;

  editingTodoText: string;
  setEditingTodoText: React.Dispatch<React.SetStateAction<string>>;
  isDarkMode?: boolean;
  checkLimit: (type: "goals" | "todos" | "habits") => boolean;
  incrementStats: (type: "goals" | "todos" | "habits") => Promise<void>;
};

export default function TodoView({
  uid,
  todos,
  todoInput,
  setTodoInput,
  editingTodoId,
  setEditingTodoId,
  editingTodoText,
  setEditingTodoText,
  isDarkMode = false,
  checkLimit,
  incrementStats,
}: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 20, marginBottom: 16, color: isDarkMode ? "#fff" : "#000" }}>📝 ToDo</h2>

      {/* 入力 */}
      <input
        value={todoInput}
        onChange={(e) => setTodoInput(e.target.value)}
        placeholder="やることを書く"
        style={{
          width: "100%",
          padding: 12,
          marginBottom: 12,
          borderRadius: 8,
          border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
          background: isDarkMode ? "#374151" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
        }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={async () => {
            if (!uid) return;
            if (!todoInput.trim()) return;
            if (!checkLimit("todos")) return;

            await addTodo(uid, todoInput);
            await incrementStats("todos");
            setTodoInput("");
          }}
          style={{
            flex: 1,
            padding: 12,
            background: isDarkMode ? "#6366f1" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: "bold",
            cursor: "pointer"
          }}
        >
          追加
        </button>
      </div>

      {/* 一覧 */}
      <ul style={{ marginTop: 24, padding: 0, listStyle: "none" }}>
        {/* ===== 未完了 ===== */}
        {todos
          .filter((t) => !t.done)
          .map((t) => (
            <li key={t.id} style={{
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              padding: "10px 12px",
              background: isDarkMode ? "#374151" : "#f8fafc",
              borderRadius: 8,
              border: isDarkMode ? "1px solid #4b5563" : "1px solid #e2e8f0"
            }}>
              {/* ✔ 完了チェック */}
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => {
                  if (!uid) return;
                  toggleTodo(uid, t.id, t.done);
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />

              {/* ✏ 編集 */}
              {editingTodoId === t.id ? (
                <input
                  value={editingTodoText}
                  onChange={(e) => setEditingTodoText(e.target.value)}
                  onBlur={async () => {
                    if (!uid) return;
                    if (!editingTodoText.trim()) return;

                    await updateTodo(uid, t.id, editingTodoText);

                    setEditingTodoId(null);
                    setEditingTodoText("");
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    padding: "4px 8px",
                    borderRadius: 4,
                    border: "1px solid #6366f1",
                    background: isDarkMode ? "#1f2937" : "#fff",
                    color: isDarkMode ? "#fff" : "#000"
                  }}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    marginLeft: 10,
                    cursor: "pointer",
                    fontWeight: "500",
                    color: isDarkMode ? "#f3f4f6" : "#1f2937"
                  }}
                  onDoubleClick={() => {
                    setEditingTodoId(t.id);
                    setEditingTodoText(t.text);
                  }}
                >
                  {t.text}
                </span>
              )}

              {/* 🗑 削除 */}
              <button
                style={{
                  marginLeft: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isDarkMode ? "#9ca3af" : "#888",
                  padding: 4
                }}
                onClick={() => {
                  if (!uid) return;
                  deleteTodo(uid, t.id);
                }}
              >
                🗑
              </button>
            </li>
          ))}

        {/* ===== 完了 ===== */}
        {todos
          .filter((t) => t.done)
          .map((t) => (
            <li
              key={t.id}
              style={{
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                padding: "10px 12px",
                background: isDarkMode ? "#1f2937" : "#f1f5f9",
                borderRadius: 8,
                opacity: 0.6,
                border: isDarkMode ? "1px solid #111827" : "1px solid #e5e7eb"
              }}
            >
              {/* ✔ 完了チェック（戻せる） */}
              <input
                type="checkbox"
                checked={t.done}
                onChange={async () => {
                  if (!uid) return;
                  await toggleTodo(uid, t.id, t.done);
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />

              <span style={{
                flex: 1,
                marginLeft: 10,
                textDecoration: "line-through",
                color: isDarkMode ? "#9ca3af" : "#888"
              }}>
                {t.text}
              </span>

              {/* 🗑 削除（完了後も可能） */}
              <button
                style={{
                  marginLeft: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isDarkMode ? "#6b7280" : "#888",
                  padding: 4
                }}
                onClick={() => {
                  if (!uid) return;
                  deleteTodo(uid, t.id);
                }}
              >
                🗑
              </button>
            </li>
          ))}
      </ul>
    </div>
  );
}
