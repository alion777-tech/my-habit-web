"use client";

import React, { useEffect, useState, useRef } from "react";
import type { BucketListData, BucketListItem } from "@/types/appTypes";
import { getBucketList, saveBucketList } from "@/lib/bucketListActions";

type Props = {
    uid: string | null;
    isDarkMode?: boolean;
};

export default function BucketListView({ uid, isDarkMode = false }: Props) {
    const [data, setData] = useState<BucketListData>({
        title: "死ぬまでにしたい100のこと",
        subtitle: "Bucket List 100",
        items: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            text: "",
            isCompleted: false,
            // deadline is removed from UI but kept in type for compatibility if needed
        }))
    });

    const [isLoading, setIsLoading] = useState(true);
    const [editingTitle, setEditingTitle] = useState(false);
    const [editingSubtitle, setEditingSubtitle] = useState(false);

    // Double-click edit states for list items
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editingItemText, setEditingItemText] = useState("");

    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Load data
    useEffect(() => {
        if (!uid) return;

        const load = async () => {
            setIsLoading(true);
            const saved = await getBucketList(uid);
            if (saved) {
                // Ensure we always have 100 items even if data is old/partial
                const mergedItems = Array.from({ length: 100 }, (_, i) => {
                    const found = saved.items.find(item => item.id === i + 1);
                    return found || { id: i + 1, text: "", isCompleted: false };
                });

                setData({
                    title: saved.title || "死ぬまでにしたい100のこと",
                    subtitle: saved.subtitle || "Bucket List 100",
                    targetDate: saved.targetDate || null,
                    items: mergedItems
                });
            }
            setIsLoading(false);
        };

        load();
    }, [uid]);

    // Auto-save logic
    useEffect(() => {
        if (!hasUnsavedChanges || !uid) return;

        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            console.log("Auto-saving bucket list...");
            await saveBucketList(uid, data);
            setHasUnsavedChanges(false);
        }, 1000); // 1 second debounce

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [data, hasUnsavedChanges, uid]);

    const updateData = (newData: Partial<BucketListData>) => {
        setData(prev => ({ ...prev, ...newData }));
        setHasUnsavedChanges(true);
    };

    const updateItem = (id: number, updates: Partial<BucketListItem>) => {
        const newItems = data.items.map(item =>
            item.id === id ? { ...item, ...updates } : item
        );
        updateData({ items: newItems });
    };

    const handleReset = async () => {
        if (!window.confirm("全てのリストをリセットしますか？この操作は取り消せません。")) return;

        const newData = {
            title: "死ぬまでにしたい100のこと",
            subtitle: "Bucket List 100",
            targetDate: null,
            items: Array.from({ length: 100 }, (_, i) => ({
                id: i + 1,
                text: "",
                isCompleted: false,
            }))
        };

        setData(newData);
        if (uid) await saveBucketList(uid, newData);
    };

    const completedCount = data.items.filter(i => i.isCompleted).length;
    const progress = completedCount; // Max 100, so count == percentage
    const isAllCompleted = completedCount === 100;

    if (isLoading) {
        return <div style={{ padding: 20, textAlign: "center", color: isDarkMode ? "#ccc" : "#666" }}>Loading...</div>;
    }

    return (
        <div style={{ color: isDarkMode ? "#f3f4f6" : "#1f2937" }}>
            {/* Header Section */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
                {editingSubtitle ? (
                    <input
                        value={data.subtitle}
                        onChange={(e) => updateData({ subtitle: e.target.value })}
                        onBlur={() => setEditingSubtitle(false)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingSubtitle(false); }}
                        autoFocus
                        style={{
                            fontSize: 14,
                            color: isDarkMode ? "#9ca3af" : "#6b7280",
                            textAlign: "center",
                            background: "transparent",
                            border: "none",
                            borderBottom: "1px solid #6366f1",
                            outline: "none",
                            width: "80%"
                        }}
                    />
                ) : (
                    <div
                        onClick={() => setEditingSubtitle(true)}
                        style={{ fontSize: 14, color: isDarkMode ? "#9ca3af" : "#6b7280", cursor: "pointer", minHeight: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                        {data.subtitle} <span style={{ fontSize: 12, opacity: 0.7 }}>✏️</span>
                    </div>
                )}

                {(() => {
                    const suffix = "までにしたい100のこと";
                    const hasSuffix = data.title.endsWith(suffix);
                    const prefix = hasSuffix ? data.title.slice(0, -suffix.length) : data.title;

                    return editingTitle ? (
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 2, marginBottom: 16 }}>
                            <input
                                value={prefix}
                                onChange={(e) => updateData({ title: e.target.value + suffix })}
                                onBlur={() => setEditingTitle(false)}
                                onKeyDown={(e) => { if (e.key === "Enter") setEditingTitle(false); }}
                                autoFocus
                                placeholder=""
                                style={{
                                    fontSize: 24,
                                    fontWeight: "bold",
                                    textAlign: "right",
                                    background: "transparent",
                                    border: "none",
                                    borderBottom: "2px solid #6366f1",
                                    outline: "none",
                                    color: isDarkMode ? "#fff" : "#000",
                                    width: "auto",
                                    minWidth: 60,
                                    maxWidth: "50%"
                                }}
                            />
                            <span style={{ fontSize: 24, fontWeight: "bold", whiteSpace: "nowrap" }}>{suffix}</span>
                        </div>
                    ) : (
                        <h1
                            onClick={() => setEditingTitle(true)}
                            style={{
                                fontSize: 24,
                                fontWeight: "bold",
                                margin: "4px 0 16px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexWrap: "wrap",
                                gap: 4
                            }}
                        >
                            <span>{prefix}</span>
                            <span style={{ whiteSpace: "nowrap" }}>{suffix} <span style={{ fontSize: 16, opacity: 0.5 }}>✏️</span></span>
                        </h1>
                    );
                })()}

                {/* Global Deadline Picker */}
                <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, marginRight: 8, color: isDarkMode ? "#9ca3af" : "#6b7280" }}>
                        📅 達成目標日:
                    </label>
                    <input
                        type="date"
                        value={data.targetDate || ""}
                        onChange={(e) => updateData({ targetDate: e.target.value })}
                        style={{
                            padding: "4px 8px",
                            borderRadius: 6,
                            border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
                            background: isDarkMode ? "#1f2937" : "#fff",
                            color: isDarkMode ? "#fff" : "#000",
                            cursor: "pointer"
                        }}
                    />
                </div>

                {/* Progress Bar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{
                        flex: 1,
                        height: 10,
                        background: isDarkMode ? "#374151" : "#e5e7eb",
                        borderRadius: 5,
                        overflow: "hidden"
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #6366f1, #a855f7)",
                            transition: "width 0.5s ease"
                        }} />
                    </div>
                    <div style={{ fontWeight: "bold", minWidth: 40, textAlign: "right" }}>{progress}%</div>
                </div>
            </div>

            {/* Congratulatory Message */}
            {isAllCompleted && (
                <div style={{
                    padding: 20,
                    background: "linear-gradient(135deg, #fce7f3, #e0e7ff)",
                    borderRadius: 12,
                    marginBottom: 24,
                    textAlign: "center",
                    border: "2px solid #fbcfe8",
                    color: "#1f2937"
                }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                    <h3 style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>おめでとうございます！</h3>
                    <p style={{ fontSize: 14, marginBottom: 16 }}>
                        100個のリストをすべて達成しました！<br />
                        素晴らしい成果です。新たな夢に向かって進みましょう。
                    </p>
                    <button
                        onClick={handleReset}
                        style={{
                            padding: "8px 16px",
                            background: "#fff",
                            border: "1px solid #db2777",
                            color: "#db2777",
                            borderRadius: 20,
                            fontWeight: "bold",
                            cursor: "pointer"
                        }}
                    >
                        リストをリセットして再挑戦
                    </button>
                </div>
            )}

            {/* List Items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.items.map((item) => {
                    // Global deadline check
                    const isOverdue = data.targetDate && data.targetDate < new Date().toISOString().split("T")[0] && !item.isCompleted;

                    return (
                        <div
                            key={item.id}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "8px 12px",
                                background: item.isCompleted
                                    ? (isDarkMode ? "#1f2937" : "#f9fafb")
                                    : (isDarkMode ? "#374151" : "#fff"),
                                borderRadius: 8,
                                border: isDarkMode ? "1px solid #4b5563" : "1px solid #e5e7eb",
                                opacity: item.isCompleted ? 0.6 : 1,
                                transition: "all 0.2s"
                            }}
                        >
                            <div style={{
                                minWidth: 24,
                                fontSize: 12,
                                fontWeight: "bold",
                                color: isDarkMode ? "#9ca3af" : "#9ca3af"
                            }}>
                                {item.id}.
                            </div>

                            {/* Checkbox */}
                            <input
                                type="checkbox"
                                checked={item.isCompleted}
                                onChange={() => updateItem(item.id, { isCompleted: !item.isCompleted })}
                                disabled={!item.text}
                                style={{ cursor: "pointer", width: 16, height: 16 }}
                            />

                            {/* Text Input (Double click to edit) */}
                            <div style={{ flex: 1, position: "relative" }}>
                                {editingItemId === item.id ? (
                                    <input
                                        value={editingItemText}
                                        onChange={(e) => setEditingItemText(e.target.value)}
                                        onBlur={() => {
                                            updateItem(item.id, { text: editingItemText });
                                            setEditingItemId(null);
                                        }}
                                        autoFocus
                                        placeholder="したいことを入力..."
                                        style={{
                                            width: "100%",
                                            padding: "4px 8px",
                                            borderRadius: 4,
                                            border: "1px solid #6366f1",
                                            background: isDarkMode ? "#1f2937" : "#fff",
                                            color: isDarkMode ? "#fff" : "#000",
                                            outline: "none"
                                        }}
                                    />
                                ) : (
                                    <div
                                        onDoubleClick={() => {
                                            setEditingItemId(item.id);
                                            setEditingItemText(item.text);
                                        }}
                                        style={{
                                            padding: "4px 8px",
                                            cursor: "text",
                                            minHeight: 24,
                                            color: isOverdue
                                                ? "#ef4444" // Red for overdue
                                                : (item.isCompleted ? (isDarkMode ? "#9ca3af" : "#9ca3af") : (isDarkMode ? "#fff" : "#000")),
                                            textDecoration: item.isCompleted ? "line-through" : "none"
                                        }}
                                    >
                                        {item.text || <span style={{ color: isDarkMode ? "#6b7280" : "#d1d5db", fontSize: 12 }}>（ダブルクリックで入力）</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
