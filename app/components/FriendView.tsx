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

import { useTranslations } from "next-intl";

export default function FriendView({ uid, currentUserName, isDarkMode = false }: Props) {
    const t = useTranslations("Friend");
    const tc = useTranslations("Common");
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
            alert(tc("saveError"));
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnfollow = async (targetUid: string) => {
        if (!uid) return;
        if (!confirm(tc("confirmDelete"))) return;
        setActionLoading(targetUid);
        try {
            await unfollowUser(uid, targetUid);
            await loadFollowing();
        } catch (e) {
            alert(tc("saveError"));
        } finally {
            setActionLoading(null);
        }
    };

    // 新規登録 or 名前再設定処理 (公開確認ステップ付)
    const handleRegister = async (isPublic: boolean) => {
        const profil_t = useTranslations("Profile");
        if (!uid || !regName.trim()) {
            alert(profil_t("enterName"));
            return;
        }
        if (!regGender || (regGender !== "male" && regGender !== "female")) {
            alert(profil_t("selectGender"));
            return;
        }
        try {
            await saveUserProfile(uid, {
                name: regName.trim(),
                gender: regGender || "other",
                isPublic: isPublic,
            });
            setIsRegistering(false);
            alert(profil_t("saveSuccess"));
        } catch (e) {
            console.error(e);
            alert(profil_t("saveError"));
        }
    };

    if (isAnonymous) return <div style={{ padding: 20, textAlign: "center", color: "#888" }}>{t("googleJoinRequired")}</div>;

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
                        <h3 style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" }}>{t("registerTitle")}</h3>
                        <p style={{ fontSize: 13, color: isDarkMode ? "#d1d5db" : "#666" }} dangerouslySetInnerHTML={{ __html: t("registerDesc") }} />
                        <input
                            placeholder={t("namePlaceholder")}
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
                                {t("maleButton")}
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
                                {t("femaleButton")}
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
                            {t("nextButton")}
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <h3 style={{ fontSize: 18, color: isDarkMode ? "#fff" : "#000", fontWeight: "bold" }}>{t("publicConfirmTitle")}</h3>
                        <p style={{ fontSize: 14, color: isDarkMode ? "#d1d5db" : "#4b5563", lineHeight: 1.5 }} dangerouslySetInnerHTML={{ __html: t("publicConfirmDesc") }} />
                        <div style={{ padding: 12, background: isDarkMode ? "#374151" : "#f9fafb", borderRadius: 8, fontSize: 12, color: "#888", textAlign: "left" }}>
                            {t("publicConfirmNote")}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
                            <button
                                onClick={() => handleRegister(true)}
                                style={{ padding: "14px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: "bold", cursor: "pointer", fontSize: 16 }}
                            >
                                {t("publicStartButton")}
                            </button>
                            <button
                                onClick={() => handleRegister(false)}
                                style={{ padding: "12px", background: "transparent", color: "#888", border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc", borderRadius: 8, cursor: "pointer" }}
                            >
                                {t("privateStartButton")}
                            </button>
                        </div>
                        <button onClick={() => setRegStep("input")} style={{ background: "none", border: "none", color: "#999", fontSize: 12, textDecoration: "underline", cursor: "pointer" }}>{t("backButton")}</button>
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
        let date: Date;
        if (lastLogin.toDate) {
            date = lastLogin.toDate();
        } else if (typeof lastLogin === "number" || typeof lastLogin === "string") {
            date = new Date(lastLogin);
        } else if (lastLogin instanceof Date) {
            date = lastLogin;
        } else {
            return null;
        }

        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return t("loginStatus.today");
        if (diffDays === 1) return t("loginStatus.yesterday");
        if (diffDays >= 7) return t("loginStatus.week");
        return t("loginStatus.days", { days: diffDays });
    };

    const UserCard = ({ user, showActivity = false }: { user: UserProfile, showActivity?: boolean }) => {
        const isFollowing = followingList.some(u => u.uid === user.uid);
        const isMe = user.uid === uid;
        const loginStatus = user.showLastLogin ? formatLastLogin(user.lastLoginAt) : null;

        if (showActivity && user.recentAction) {
            return (
                <div style={{
                    marginBottom: 10,
                    padding: "12px 16px",
                    background: isDarkMode ? "rgba(99,102,241,0.1)" : "#f5f3ff",
                    borderLeft: "4px solid #6366f1",
                    borderRadius: 8,
                    fontSize: 13,
                    color: isDarkMode ? "#a5b4fc" : "#4338ca",
                    fontWeight: "bold",
                    boxShadow: isDarkMode ? "0 2px 4px rgba(0,0,0,0.2)" : "0 1px 2px rgba(0,0,0,0.05)"
                }}>
                    {t("achievedFeed", {
                        name: user.name,
                        type: user.recentAction.type === "dream" ? t("dream") : t("goal"),
                        text: user.recentAction.text
                    })}
                </div>
            );
        }

        return (
            <div style={{
                padding: 12,
                background: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: 12,
                marginBottom: 10,
                border: isDarkMode ? "1px solid #374151" : "1px solid #eee",
            }}>
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
                                <div style={{ fontSize: 11, color: "#6366f1" }}>🌈 {user.dream || t("secretDream")}</div>
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
                            {isFollowing ? t("following") : t("follow")}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: "0 4px" }}>
            <h2 style={{ fontSize: 18, marginBottom: 16, color: isDarkMode ? "#fff" : "#000", textAlign: "center" }}>{t("title")}</h2>

            {/* 囲われたタブ選択エリア */}
            <div style={{
                display: "flex", gap: 6, padding: "8px",
                background: isDarkMode ? "#1f2937" : "#fff",
                borderRadius: 12, border: isDarkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                marginBottom: 16
            }}>
                <div onClick={() => { setActiveTab("feed"); setHasSearched(false); }} style={tabStyle(activeTab === "feed")}>{t("tabFeed")}</div>
                <div onClick={() => { setActiveTab("following"); setHasSearched(false); }} style={tabStyle(activeTab === "following")}>{t("tabFollowing")}</div>
                <div onClick={() => { setActiveTab("search"); setHasSearched(false); }} style={tabStyle(activeTab === "search")}>{t("tabSearch")}</div>
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
                            <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>{t("noAction")}</p>
                        )}
                    </>
                )}

                {activeTab === "following" && (
                    <>
                        {followingList.map(u => <UserCard key={u.uid} user={u} />)}
                        {followingList.length === 0 && <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>{t("noFollowing")}</p>}
                    </>
                )}

                {activeTab === "search" && (
                    <>
                        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                            <input
                                placeholder={t("searchPlaceholder")}
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
                                {loading ? t("searching") : t("searchButton")}
                            </button>
                        </div>
                        {searchResults.map(u => <UserCard key={u.uid} user={u} />)}
                        {hasSearched && !loading && searchResults.length === 0 && (
                            <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 40 }}>
                                {t("noUserFound")}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
