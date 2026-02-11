"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
    searchUsers,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend
} from "@/lib/friendActions";
import { getUserProfile } from "@/lib/profileActions";
import type { UserProfile, Goal } from "@/types/appTypes";

type Props = {
    uid: string | null;
    currentUserName: string;
    isDarkMode?: boolean;
};

type FriendRequest = {
    fromUid: string;
    fromName: string;
    createdAt: any;
};

type FriendWithActivity = UserProfile & {
    recentGoals: string[];
};

export default function FriendView({ uid, currentUserName, isDarkMode = false }: Props) {
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [friends, setFriends] = useState<FriendWithActivity[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // フレンドリストと最近の成果の監視
    useEffect(() => {
        if (!uid) return;

        const unsub = onSnapshot(collection(db, "users", uid, "friends"), async (snap) => {
            const friendIds = snap.docs.map(d => d.id);
            const profiles = await Promise.all(
                friendIds.map(async (fId) => {
                    try {
                        const profile = await getUserProfile(fId);
                        if (!profile) return null;

                        // 成果の取得：インデックスエラーを避けるため、単純なクエリで取得してからJSでフィルタリング
                        let recentGoals: string[] = [];
                        try {
                            const goalSnap = await getDocs(query(
                                collection(db, "users", fId, "goals"),
                                where("visibility", "in", ["friends", "public"]),
                                limit(50)
                            ));
                            recentGoals = goalSnap.docs
                                .map(d => ({ id: d.id, ...d.data() } as any))
                                .filter(g => g.done === true)
                                // achievedAt（達成日）の降順、なければcreatedAt（作成日）
                                .sort((a, b) => {
                                    const timeA = a.achievedAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0;
                                    const timeB = b.achievedAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0;
                                    return timeB - timeA;
                                })
                                .slice(0, 3)
                                .map(g => g.title);
                        } catch (e) {
                            console.warn(`[FriendView] Could not fetch goals for ${fId}:`, e);
                        }

                        return { ...profile, recentGoals };
                    } catch (e) {
                        console.error(`[FriendView] Error loading profile ${fId}:`, e);
                        return null;
                    }
                })
            );
            setFriends(profiles.filter((p): p is FriendWithActivity => p !== null));
        });

        return () => unsub();
    }, [uid]);

    // フレンド申請の監視
    useEffect(() => {
        if (!uid) return;

        const q = query(
            collection(db, "users", uid, "friendRequests"),
            orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snap) => {
            const list = snap.docs.map(d => ({
                fromUid: d.id,
                ...d.data()
            })) as FriendRequest[];
            setRequests(list);
        });

        return () => unsub();
    }, [uid]);

    const handleSearch = async () => {
        if (!uid || !searchTerm.trim()) return;
        setLoading(true);
        try {
            const res = await searchUsers(searchTerm, uid);
            setSearchResults(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 12 }}>
            <h2 style={{ fontSize: 20, marginBottom: 16, color: isDarkMode ? "#fff" : "#000" }}>🤝 フレンド</h2>

            {/* 検索セクション */}
            <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, marginBottom: 8, color: isDarkMode ? "#d1d5db" : "#000" }}>ユーザーを検索</h3>
                <div style={{ display: "flex", gap: 8 }}>
                    <input
                        placeholder="名前や夢で検索..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        onClick={handleSearch}
                        disabled={loading}
                        style={{ padding: "8px 16px", borderRadius: 8, background: isDarkMode ? "#6366f1" : "#4f46e5", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold" }}
                    >
                        {loading ? "検索中..." : "検索"}
                    </button>
                </div>

                {searchResults.length > 0 && (
                    <ul style={{
                        padding: 0,
                        marginTop: 12,
                        listStyle: "none",
                        border: isDarkMode ? "1px solid #4b5563" : "1px solid #eee",
                        borderRadius: 8,
                        background: isDarkMode ? "#1f2937" : "#fff"
                    }}>
                        {searchResults.map(user => (
                            <li key={user.uid} style={{
                                padding: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #eee"
                            }}>
                                <div>
                                    <div style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>{user.name}</div>
                                    <div style={{ fontSize: 12, color: isDarkMode ? "#9ca3af" : "#666" }}>🌈 {user.dream || (user as any).dreams || "夢は秘密"}</div>
                                </div>
                                <button
                                    onClick={async () => {
                                        try {
                                            await sendFriendRequest(uid!, user.uid, currentUserName);
                                            alert(`${user.name}さんにフレンド申請を送りました`);
                                            setSearchResults([]);
                                            setSearchTerm("");
                                        } catch (e) {
                                            alert("申請に失敗しました。ルールを確認してください。");
                                        }
                                    }}
                                    style={{
                                        fontSize: 12,
                                        padding: "6px 12px",
                                        background: isDarkMode ? "#312e81" : "#eef2ff",
                                        color: isDarkMode ? "#c7d2fe" : "#4f46e5",
                                        border: isDarkMode ? "1px solid #4338ca" : "1px solid #4f46e5",
                                        borderRadius: 6,
                                        cursor: "pointer",
                                        fontWeight: "bold"
                                    }}
                                >
                                    申請を送る
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 申請セクション */}
            {requests.length > 0 && (
                <div style={{
                    marginBottom: 24,
                    padding: 16,
                    background: isDarkMode ? "#3f2b10" : "#fffbeb",
                    borderRadius: 12,
                    border: isDarkMode ? "1px solid #78350f" : "1px solid #fef3c7"
                }}>
                    <h3 style={{ fontSize: 16, marginBottom: 12, color: isDarkMode ? "#fbbf24" : "#92400e" }}>📩 届いている申請 ({requests.length})</h3>
                    <ul style={{ padding: 0, listStyle: "none" }}>
                        {requests.map(req => (
                            <li key={req.fromUid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                                <span style={{ fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>{req.fromName}</span>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <button
                                        onClick={async () => {
                                            try {
                                                await acceptFriendRequest(uid!, req.fromUid);
                                            } catch (e) {
                                                console.error(e);
                                            }
                                        }}
                                        style={{ padding: "6px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
                                    >
                                        承認
                                    </button>
                                    <button
                                        onClick={async () => await rejectFriendRequest(uid!, req.fromUid)}
                                        style={{ padding: "6px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: "bold" }}
                                    >
                                        拒否
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* フレンドリスト */}
            <div>
                <h3 style={{ fontSize: 16, marginBottom: 12, color: isDarkMode ? "#d1d5db" : "#000" }}>フレンドリスト ({friends.length})</h3>
                {friends.length === 0 ? (
                    <p style={{ fontSize: 14, color: "#888", textAlign: "center", padding: 20 }}>まだフレンドはいません。</p>
                ) : (
                    <ul style={{ padding: 0, listStyle: "none" }}>
                        {friends.map(friend => (
                            <li key={friend.uid} style={{
                                padding: 16,
                                background: isDarkMode ? "#1f2937" : "#fff",
                                borderRadius: 12,
                                marginBottom: 12,
                                border: isDarkMode ? "1px solid #374151" : "1px solid #eee"
                            }}>
                                <div style={{ fontWeight: "bold", fontSize: 16, color: isDarkMode ? "#fff" : "#000" }}>
                                    <span style={{
                                        color: friend.gender === "female" ? "#f472b6" : friend.gender === "male" ? "#3b82f6" : (isDarkMode ? "#9ca3af" : "#000"),
                                        marginRight: 4,
                                        fontSize: "1.1em"
                                    }}>
                                        {friend.gender === "female" ? "👩" : friend.gender === "male" ? "👨" : "👤"}
                                    </span>
                                    {friend.name}
                                    {friend.dreamAchievedCount && friend.dreamAchievedCount > 0 ? (
                                        <span style={{
                                            marginLeft: 8,
                                            fontSize: 11,
                                            color: isDarkMode ? "#fbbf24" : "#d97706",
                                            background: isDarkMode ? "#451a03" : "#fffbeb",
                                            padding: "1px 6px",
                                            borderRadius: 4,
                                            border: isDarkMode ? "1px solid #92400e" : "1px solid #fcd34d"
                                        }}>
                                            🎖️ x{friend.dreamAchievedCount}
                                        </span>
                                    ) : null}
                                </div>
                                {(friend.dream || (friend as any).dreams) && (
                                    <div style={{ fontSize: 14, color: isDarkMode ? "#818cf8" : "#6366f1", marginTop: 4, fontWeight: "500" }}>🌈 {friend.dream || (friend as any).dreams}</div>
                                )}

                                {/* 最終ログインの表示 */}
                                <div style={{ fontSize: 11, color: isDarkMode ? "#6b7280" : "#9ca3af", marginTop: 6 }}>
                                    {(() => {
                                        if (!friend.lastLoginAt) return "最終ログイン不明";
                                        const last = friend.lastLoginAt.toDate ? friend.lastLoginAt.toDate() : new Date(friend.lastLoginAt);
                                        const now = new Date();
                                        const diffMs = now.getTime() - last.getTime();
                                        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

                                        if (diffDays === 0) return "今日ログイン";
                                        if (diffDays === 1) return "昨日ログイン";
                                        if (diffDays < 7) return `${diffDays}日前にログイン`;
                                        return "1週間以上ログインなし";
                                    })()}
                                </div>

                                {friend.showGoal && (
                                    <div style={{ marginTop: 16 }}>
                                        <div style={{ fontSize: 11, color: isDarkMode ? "#9ca3af" : "#6b7280", fontWeight: "bold", marginBottom: 6 }}>✨ 最近の成果</div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                            {friend.recentGoals.length > 0 ? (
                                                friend.recentGoals.map((g, i) => (
                                                    <div key={i} style={{
                                                        fontSize: 13,
                                                        color: isDarkMode ? "#6ee7b7" : "#059669",
                                                        background: isDarkMode ? "#064e3b" : "#ecfdf5",
                                                        padding: "6px 10px",
                                                        borderRadius: 8,
                                                        fontWeight: "500"
                                                    }}>
                                                        ✅ {g}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontSize: 12, color: "#9ca3af" }}>達成した目標はまだありません</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                                    <button
                                        onClick={async () => {
                                            if (window.confirm("フレンドを解除しますか？")) {
                                                await removeFriend(uid!, friend.uid);
                                            }
                                        }}
                                        style={{ fontSize: 11, color: isDarkMode ? "#f87171" : "#ef4444", background: "none", border: "none", cursor: "pointer", opacity: 0.8 }}
                                    >
                                        フレンド解除
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
