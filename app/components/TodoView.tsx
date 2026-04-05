//app/components/TodoView.tsx
"use client";

import React from "react";
import type { Todo } from "@/types/appTypes";
import { addTodo, toggleTodo, deleteTodo, updateTodo } from "@/lib/todoActions";

const UI = {
  radius: 8,
  font: 13,        // ← 上のタブが 13 なので合わせる
  inputPad: 10,    // ← 入力欄の高さ（大きくしたければ 12）
  btnPad: 10,      // ← 追加ボタンの高さ（大きくしたければ 12）
};


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

import { useTranslations } from "next-intl";

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
  const t = useTranslations("Todo");

  return (
    <div>
      <h2 style={{ fontSize: 18, marginBottom: 16, color: isDarkMode ? "#fff" : "#000" }}>
        {t("title")}
      </h2>


      {/* 入力 */}
      <input
        value={todoInput}
        onChange={(e) => setTodoInput(e.target.value)}
        placeholder={t("placeholder")}
        style={{
          width: "100%",
          padding: UI.inputPad,
          marginBottom: 12,
          borderRadius: UI.radius,
          border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
          background: isDarkMode ? "#374151" : "#fff",
          color: isDarkMode ? "#fff" : "#000",
          fontSize: UI.font,
        }}

      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={async () => {
            if (!todoInput.trim()) return;
            if (!checkLimit("todos")) return;

            await addTodo(uid, todoInput);
            await incrementStats("todos");
            setTodoInput("");
          }}
          style={{
            flex: 1,
            padding: UI.btnPad,
            background: isDarkMode ? "#6366f1" : "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: UI.radius,
            fontSize: UI.font,
            fontWeight: "bold",
            cursor: "pointer",
          }}

        >
          {t("addButton")}
        </button>
      </div>

      {/* 一覧 */}
      <ul style={{ marginTop: 24, padding: 0, listStyle: "none" }}>
        {/* ===== 未完了 ===== */}
        {todos
          .filter((t) => !t.done)
          .map((item) => (
            <li key={item.id} style={{
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
                checked={item.done}
                onChange={() => {

                  toggleTodo(uid, item.id, item.done);
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />

              {/* ✏ 編集 */}
              {editingTodoId === item.id ? (
                <input
                  value={editingTodoText}
                  onChange={(e) => setEditingTodoText(e.target.value)}
                  onBlur={async () => {
  
                    if (!editingTodoText.trim()) return;

                    await updateTodo(uid, item.id, editingTodoText);

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
                    fontSize: UI.font,
                    color: isDarkMode ? "#f3f4f6" : "#1f2937"
                  }}
                  onDoubleClick={() => {
                    setEditingTodoId(item.id);
                    setEditingTodoText(item.text);
                  }}
                >
                  {item.text}
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

                  deleteTodo(uid, item.id);
                }}
              >
                🗑
              </button>
            </li>
          ))}

        {/* ===== 完了 ===== */}
        {todos
          .filter((t) => t.done)
          .map((item) => (
            <li
              key={item.id}
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
                checked={item.done}
                onChange={async () => {

                  await toggleTodo(uid, item.id, item.done);
                }}
                style={{ width: 18, height: 18, cursor: "pointer" }}
              />

              <span style={{
                flex: 1,
                marginLeft: 10,
                textDecoration: "line-through",
                color: isDarkMode ? "#9ca3af" : "#888",
                fontSize: UI.font,
              }}>
                {item.text}
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

                  deleteTodo(uid, item.id);
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
