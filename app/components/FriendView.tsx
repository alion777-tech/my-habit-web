"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
    searchUsers,
    followUser,
    unfollowUser,
    getFollowingUsers
} from "@/lib/socialActions";
import { saveUserProfile } from "@/lib/profileActions";
import type { UserProfile } from "@/types/appTypes";

type Props = {
    uid: string | null;
    currentUserName: string;
    isDarkMode?: boolean;
};

export default function FriendView({ uid, currentUserName, isDarkMode = false }: Props) {
    const isAnonymous = auth.currentUser?.isAnonymous;

    // 名前がない場合に登録モードへ
    const [isRegistering, setIsRegistering] = useState(currentUserName === "");
    const [regName, setRegName] = useState("");
    const [regGender, setRegGender] = useState<"male" | "female" | "">("");
    const [regStep, setRegStep] = useState<"input" | "confirm">("input");

    const [activeTab, setActiveTab] = useState<"feed" | "following" | "search">("feed");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [followingList, setFollowingList] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // プロフィールが更新された際、まだ登録中で且つ名前が入ったなら登録モードを抜ける
    useEffect(() => {
        if (isRegistering && currentUserName !== "") {
            setIsRegistering(false);
        }
    }, [currentUserName, isRegistering]);

    useEffect(() => {
        if (!uid || isAnonymous || isRegistering) return;
        loadFollowing();
    }, [uid, activeTab, isAnonymous, isRegistering]);

    const loadFollowing = async () => {
        if (!uid) return;
        const list = await getFollowingUsers(uid);
        setFollowingList(list);
    };

    const handleSearch = async () => {
        if (!uid || !searchTerm.trim()) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const res = await searchUsers(searchTerm, uid);
            setSearchResults(res);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUid: string) => {
        if (!uid) return;
        setActionLoading(targetUid);
        try {
            await followUser(uid, targetUid);
            await loadFollowing();
        } catch (e) {
            alert("フォローに失敗しました");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfollow = async (targetUid: string) => {
        if (!uid) return;
        if (!confirm("フォローを解除しますか？")) return;
        setActionLoading(targetUid);
        try {
            await unfollowUser(uid, targetUid);
            await loadFollowing();
        } catch (e) {
            alert("解除に失敗しました");
        } finally {
            setActionLoading(null);
        }
    };

    // 新規登録 or 名前再設定処理 (公開確認ステップ付)
    const handleRegister = async (isPublic: boolean) => {
        if (!uid || !regName.trim()) {
            alert("名前を入力してください");
            return;
        }
        if (!regGender || (regGender !== "male" && regGender !== "female")) {
            alert("性別を選択してください");
            return;
        }
        try {
            await saveUserProfile(uid, {
                name: regName.trim(),
                gender: regGender || "other",
                isPublic: isPublic,
            });
            setIsRegistering(false);
            alert("設定を保存しました！");
        } catch (e) {
            console.error(e);
            alert("保存に失敗しました");
        }
    };

    if (isAnonymous) return <div style={{ padding: 20, textAlign: "center", color: "#888" }}>Google連携が必要です</div>;

    // 新規登録UI (名前・性別 -> 公開確認)
    if (isRegistering) {
        return (
            <div style={{
                padding: "24px 16px",
                background: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: 12,
                border: isDarkMode ? "1px solid #374151" : "1px solid #eee",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                textAlign: "center"
            }}>
                {regStep === "input" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h3 style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" }}>👤 プロフィール登録</h3>
                        <p style={{ fontSize: 13, color: isDarkMode ? "#d1d5db" : "#666" }}>フレンド機能を使うために、<br />名前と性別を入力してください。</p>
                        <input
                            placeholder="名前 (ニックネーム)"
                            value={regName}
                            onChange={(e) => setRegName(e.target.value)}
                            style={{
                                padding: 12,
                                borderRadius: 8,
                                border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
                                background: isDarkMode ? "#374151" : "#fff",
                                color: isDarkMode ? "#fff" : "#000",
                                fontSize: 16
                            }}
                        />
                        <div style={{ display: "flex", gap: 8 }}>
                            <button
                                onClick={() => setRegGender("male")}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: 8,
                                    border: regGender === "male" ? "2px solid #3b82f6" : "1px solid #ccc",
                                    background: regGender === "male" ? "#eff6ff" : "transparent",
                                    color: regGender === "male" ? "#1d4ed8" : (isDarkMode ? "#fff" : "#000"),
                                    fontWeight: "bold"
                                }}
                            >
                                👨 男性
                            </button>
                            <button
                                onClick={() => setRegGender("female")}
                                style={{
                                    flex: 1, padding: "10px", borderRadius: 8,
                                    border: regGender === "female" ? "2px solid #f472b6" : "1px solid #ccc",
                                    background: regGender === "female" ? "#fdf2f8" : "transparent",
                                    color: regGender === "female" ? "#be185d" : (isDarkMode ? "#fff" : "#000"),
                                    fontWeight: "bold"
                                }}
                            >
                                👩 女性
                            </button>
                        </div>
                        <button
                            disabled={!regName.trim()}
                            onClick={() => setRegStep("confirm")}
                            style={{
                                marginTop: 8,
                                padding: "14px",
                                background: !regName.trim() ? "#d1d5db" : "#4f46e5",
                                color: "#fff",
                                border: "none",
                                borderRadius: 8,
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontSize: 16
                            }}
                        >
                            次へ
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h3 style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" }}>🌍 公開設定の確認</h3>
                        <p style={{ fontSize: 14, color: isDarkMode ? "#d1d5db" : "#4b5563", lineHeight: 1.5 }}>
                            プロフィールを<strong>公開</strong>して、<br />
                            他のユーザーから検索できるようにしますか？
                        </p>
                        <div style={{ padding: 12, background: isDarkMode ? "#374151" : "#f9fafb", borderRadius: 8, fontSize: 12, color: "#888", textAlign: "left" }}>
                            ※公開すると、他のユーザーがあなたを検索してフォローできるようになります。後からいつでも変更可能です。
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                            <button
                                onClick={() => handleRegister(true)}
                                style={{ padding: "14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
                            >
                                公開して始める
                            </button>
                            <button
                                onClick={() => handleRegister(false)}
                                style={{ padding: "12px", background: "transparent", color: "#888", border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
                            >
                                非公開で始める
                            </button>
                        </div>
                        <button onClick={() => setRegStep("input")} style={{ background: "none", border: "none", color: "#999", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}>戻る</button>
                    </div>
                )}
            </div>
        );
    }

    // 基本ページタブ風スタイル
    const tabStyle = (isActive: boolean): React.CSSProperties => ({
        flex: 1,
        padding: "10px 4px",
        textAlign: "center",
        cursor: "pointer",
        borderRadius: 8,
        fontWeight: "bold",
        fontSize: 12,
        transition: "all 0.2s",
        background: isActive ? "#4f46e5" : (isDarkMode ? "transparent" : "#e5e7eb"),
        color: isActive ? "#fff" : (isDarkMode ? "#fff" : "#374151"),
        border: isActive ? "none" : (isDarkMode ? "1.5px solid #fff" : "none"),
    });

    // 🕒 ログイン日数のフォーマット (一日単位)
    const formatLastLogin = (lastLogin: any) => {
        if (!lastLogin) return null;
        const date = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "今日ログインあり";
        if (diffDays === 1) return "1日ログインなし";
        if (diffDays >= 7) return "7日以上ログインなし";
        return `${diffDays}日ログインなし`;
    };

    const UserCard = ({ user, showActivity = false }: { user: UserProfile, showActivity?: boolean }) => {
        const isFollowing = followingList.some(u => u.uid === user.uid);
        const isMe = user.uid === uid;
        const loginStatus = user.showLastLogin ? formatLastLogin(user.lastLoginAt) : null;

        return (
            <div style={{
                padding: 12,
                background: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: 12,
                marginBottom: 10,
                border: isDarkMode ? "1px solid #374151" : "1px solid #eee",
            }}>
                {showActivity && user.recentAction && (
                    <div style={{
                        marginBottom: 10,
                        padding: "8px 12px",
                        background: isDarkMode ? "rgba(99,102,241,0.1)" : "#f5f3ff",
                        borderLeft: "4px solid #6366f1",
                        borderRadius: "0 8px 8px 0",
                        fontSize: 12,
                        color: isDarkMode ? "#a5b4fc" : "#4338ca",
                        fontWeight: "bold"
                    }}>
                        📢 {user.name}が {user.recentAction.type === "dream" ? "夢" : "目標"}：{user.recentAction.text} を達成しました！
                    </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold", fontSize: 14, color: isDarkMode ? "#fff" : "#000", display: "flex", alignItems: "center", gap: 4 }}>
                            <span style={{ color: user.gender === "female" ? "#f472b6" : user.gender === "male" ? "#3b82f6" : "#888" }}>
                                {user.gender === "female" ? "👩" : user.gender === "male" ? "👨" : "👤"}
                            </span>
                            {user.name}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                            {user.showDream && (
                                <div style={{ fontSize: 11, color: "#6366f1" }}>🌈 {user.dream || "夢は秘密"}</div>
                            )}
                            {loginStatus && (
                                <div style={{ fontSize: 11, color: "#888" }}>🕒 {loginStatus}</div>
                            )}
                        </div>
                    </div>
                    {!isMe && (
                        <button
                            disabled={actionLoading === user.uid}
                            onClick={() => isFollowing ? handleUnfollow(user.uid) : handleFollow(user.uid)}
                            style={{
                                fontSize: 11, padding: "5px 12px", borderRadius: 15, fontWeight: "bold", cursor: "pointer",
                                border: isFollowing ? "1px solid #ccc" : "none",
                                background: isFollowing ? "transparent" : "#4f46e5",
                                color: isFollowing ? "#888" : "#fff",
                                opacity: actionLoading === user.uid ? 0.7 : 1
                            }}
                        >
                            {isFollowing ? "フォロー中" : "フォロー"}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: "0 4px" }}>
            <h2 style={{ fontSize: 18, marginBottom: 16, color: isDarkMode ? "#fff" : "#000", textAlign: "center" }}>🤝 フレンド</h2>

            {/* 囲われたタブ選択エリア */}
            <div style={{
                display: "flex", gap: 6, padding: "8px",
                background: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: 12, border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                marginBottom: 16
            }}>
                <div onClick={() => { setActiveTab("feed"); setHasSearched(false); }} style={tabStyle(activeTab === "feed")}>みんなの近況</div>
                <div onClick={() => { setActiveTab("following"); setHasSearched(false); }} style={tabStyle(activeTab === "following")}>フォロー中</div>
                <div onClick={() => { setActiveTab("search"); setHasSearched(false); }} style={tabStyle(activeTab === "search")}>検索</div>
            </div>

            {/* 囲われたメインコンテンツエリア */}
            <div style={{
                padding: "16px 12px",
                minHeight: 300,
                background: isDarkMode ? "rgba(31,41,55,0.5)" : "rgba(255,255,255,0.5)",
                borderRadius: 12,
                border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb"
            }}>
                {activeTab === "feed" && (
                    <>
                        {followingList
                            .filter(u => u.recentAction)
                            .sort((a, b) => {
                                const dateA = a.recentAction?.date?.toDate?.() || new Date(0);
                                const dateB = b.recentAction?.date?.toDate?.() || new Date(0);
                                return dateB.getTime() - dateA.getTime();
                            })
                            .map(u => <UserCard key={u.uid} user={u} showActivity={true} />)}
                        {followingList.filter(u => u.recentAction).length === 0 && (
                            <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>近況はありません</p>
                        )}
                    </>
                )}

                {activeTab === "following" && (
                    <>
                        {followingList.map(u => <UserCard key={u.uid} user={u} />)}
                        {followingList.length === 0 && <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>フォローしている人はいません</p>}
                    </>
                )}

                {activeTab === "search" && (
                    <>
                        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                            <input
                                placeholder="名前や夢で検索..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                style={{
                                    flex: 1, height: 32, padding: "0 10px", borderRadius: 6,
                                    border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
                                    background: isDarkMode ? "#374151" : "#fff",
                                    color: isDarkMode ? "#fff" : "#000",
                                    fontSize: 13
                                }}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                style={{
                                    height: 32, padding: "0 12px", borderRadius: 6,
                                    background: "#4f46e5", color: "#fff", border: "none",
                                    fontSize: 12, fontWeight: "bold", cursor: "pointer"
                                }}
                            >
                                {loading ? "..." : "検索"}
                            </button>
                        </div>
                        {searchResults.map(u => <UserCard key={u.uid} user={u} />)}
                        {hasSearched && !loading && searchResults.length === 0 && (
                            <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>
                                ユーザーが見つかりませんでした
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
