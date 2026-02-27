"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import HabitView from "../components/HabitView";
import {
  addHabit,
  deleteHabit as deleteHabitAction,
} from "@/lib/habitActions";
import { updateHabitFields } from "@/lib/habits/updateHabitFields";
import { calcToggleHabit } from "@/lib/habits/calcToggleHabit";
import type { DailyStat, Habit, Goal, Todo, UserProfile, PointHistoryItem } from "@/types/appTypes";
import { isHabitVisibleOnDate } from "@/lib/habits/visibility";
import { useHabitCalendar } from "@/hooks/useHabitCalendar";
import StatsView from "../components/StatsView";
import AuthBox from "../components/AuthBox";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile, saveUserProfile, updateLastLogin } from "@/lib/profileActions";
import TitleView from "../components/TitleView";
import ProfileView from "../components/ProfileView";
import TodoView from "../components/TodoView";
import DreamView from "../components/DreamView";
import HistoryView from "../components/HistoryView";
import FriendView from "../components/FriendView";
import BucketListView from "../components/BucketListView";
import { deleteGoal as deleteGoalAction } from "@/lib/goalActions";




import { TITLE_DEFINITIONS } from "@/lib/titles";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

export default function Home() {
  const isDev = process.env.NODE_ENV === "development";
  const t = useTranslations();
  const th = useTranslations("Habit");
  const tc = useTranslations("Common");
  const ta = useTranslations("Auth");
  const tp = useTranslations("Profile");
  const tg = useTranslations("Goal");
  const td = useTranslations("Dream");
  const ts = useTranslations("Stats");
  const tt = useTranslations("Tabs");

  const [habit, setHabit] = useState("");
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [habitType, setHabitType] = useState<"daily" | "weekly">("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [isEditingDream, setIsEditingDream] = useState(false);
  const [dreamInput, setDreamInput] = useState("");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalInput, setGoalInput] = useState("");
  const [deadline, setDeadline] = useState("");
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingGoalText, setEditingGoalText] = useState("");
  const [todos, setTodos] = useState<Todo[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [todoInput, setTodoInput] = useState("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingTodoText, setEditingTodoText] = useState("");
  const [earnedTitles, setEarnedTitles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const playCharing = () => {
    try {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3");
      audio.volume = 0.5;
      audio.play();
    } catch (e) {
      console.warn("Could not play sound:", e);
    }
  };
  const [profile, setProfile] = useState<UserProfile>({
    uid: "",
    name: "",
    gender: "",
    dream: "",
    isPublic: false,
    showDream: false,
    showGoal: false,
    earnedTitles: [],
    dreamAchievedCount: 0,
  });

  const {
    testDayOffset,
    setTestDayOffset,
    base,
    todayStr,
    yesterdayStr,
    todayDow,
    currentMonth,
    setCurrentMonth,
    calendarDays,
    dailyStats,
  } = useHabitCalendar(habits);



  // 🔄 全情報のクリア (ログアウト時などに使用)
  const resetAllData = () => {
    setProfile({
      uid: "",
      name: "",
      gender: "",
      dream: "",
      isPublic: false,
      showDream: false,
      showGoal: false,
      earnedTitles: [],
      dreamAchievedCount: 0,
    });
    setHabits([]);
    setGoals([]);
    setTodos([]);
    setEarnedTitles([]);
    setDreamInput("");
    setGoalInput("");
    setTodoInput("");
    setIsLoading(false);
  };

  // 👤 プロフィールのリアルタイム監視
  useEffect(() => {
    if (!uid) {
      resetAllData();
      return;
    }

    console.log("[ProfileSync] starting snapshot for:", uid);
    // 新しいユーザーへ切り替わる際、以前のデータをクリアしておく（混ざるのを防ぐ）

    setIsLoading(true);

    const unsub = onSnapshot(doc(db, "users", uid), async (snap) => {
      try {
        if (snap.exists()) {
          const data = snap.data();

          // ログイン状態などは status から取得
          let lastLoginAt = data.lastLoginAt;
          try {
            const statusRef = doc(db, "users", uid, "public", "status");
            const statusSnap = await getDoc(statusRef);
            if (statusSnap.exists()) {
              lastLoginAt = statusSnap.data().lastLoginAt;
            }
          } catch (e) {
            // サイレントに
          }

          const p: UserProfile = {
            ...data, // 既存のフィールドを維持 (stats等)
            uid: uid,
            name: data.name ?? "",
            gender: data.gender ?? "",
            dream: data.dream ?? data.dreams ?? "",
            isPublic: !!data.isPublic,
            showDream: !!data.showDream || !!data.showDreams,
            showGoal: !!data.showGoal || !!data.showGoals,
            earnedTitles: Array.isArray(data.earnedTitles) ? data.earnedTitles : [],
            dreamAchievedCount: data.dreamAchievedCount ?? 0,
            lastLoginAt: lastLoginAt ?? null,
          };
          console.log("[ProfileSync] data received at users/", uid);

          setProfile(prev => {
            const merged = { ...prev, ...p };
            if (p.name === "" && prev.name !== "") {
              merged.name = prev.name;
            }
            if (p.gender === "" && prev.gender !== "") {
              merged.gender = prev.gender;
            }
            return merged;
          });
          setEarnedTitles(p.earnedTitles);
        } else {
          console.log("[ProfileSync] document does not exist yet at users/", uid);
          // 補完
          const p = await getUserProfile(uid);
          if (p) {
            setProfile(p);
            setEarnedTitles(p.earnedTitles);
          }
        }
      } catch (e) {
        console.error("[ProfileSync] Error processing snapshot:", e);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error(`[ProfileSync] Permission error on users/${uid}:`, error);
      setIsLoading(false);
    });

    return () => unsub();
  }, [uid]);





  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "goals"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Goal[] = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            title: data.title ?? "",
            deadline: data.deadline ?? null,
            done: !!data.done,
          };
        });

        setGoals(list);

        // 🔹 統計データの整合性チェック (既存ユーザーのデータ移行用)
        if (profile.uid && !isLoading) {
          const achievedCount = list.filter(g => g.done).length;
          const currentCount = profile.stats?.goalsAchievedCount || 0;

          // 実際の達成数と統計がズレていたら修正
          if (achievedCount !== currentCount) {
            console.log(`[StatsCorrection] Fixing goalsAchievedCount: ${currentCount} -> ${achievedCount}`);

            // 差分個数 × 100pt を加算（減算）
            const diffCount = achievedCount - currentCount;
            const currentBonus = profile.bonusPoints || 0;
            const newBonus = Math.max(0, currentBonus + (diffCount * 100));

            const newStats = { ...(profile.stats || {}), goalsAchievedCount: achievedCount };

            saveUserProfile(uid, {
              stats: newStats,
              bonusPoints: newBonus
            });
            setProfile(prev => ({
              ...prev,
              stats: newStats,
              bonusPoints: newBonus
            }));
          }
        }
      },
      (error) => {
        console.error("[onSnapshot goals] error:", error);
      }
    );

    return () => unsub();
  }, [uid]);



  // handleAddHabit moved below with limit check

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "todos"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            text: data.text ?? "",
            done: !!data.done,
          };
        });

        setTodos(list);
      },
      (error) => {
        console.error("[onSnapshot todos] error:", error);
      }
    );

    return () => unsub();
  }, [uid]);




  // titles are now imported from lib/titles as TITLE_DEFINITIONS

  // 🧭 画面切り替え用
  const [view, setView] = useState<
    "habit" | "history" | "stats" | "dream" | "todo" | "title" | "profile" | "friend" | "bucketList"
  >("habit");

  // 📅 カレンダー用
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 初回読み込み時にローカルストレージからダークモード設定を取得
  useEffect(() => {
    const saved = localStorage.getItem("isDarkMode");
    if (saved === "true") setIsDarkMode(true);
  }, []);

  // 設定変更時に保存
  const toggleDarkMode = () => {
    const newVal = !isDarkMode;
    setIsDarkMode(newVal);
    localStorage.setItem("isDarkMode", String(newVal));
  };

  // 夢達成長押し用
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const startLongPress = () => {
    setIsPressing(true);
    const timer = setTimeout(() => {
      handleDreamAchieved();
      setIsPressing(false);
    }, 10000); // 10秒
    setPressTimer(timer);
  };

  const cancelLongPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
    setPressTimer(null);
    setIsPressing(false);
  };

  const handleDreamAchieved = async () => {
    if (!uid || !profile.dream) return;

    // 回数制限チェック
    if ((profile.dreamAchievedCount || 0) >= 5) {
      alert(td("limitReach"));
      return;
    }

    if (!window.confirm(td("achievedConfirm"))) return;

    const res = window.confirm(t("Dream.congratsMessage"));

    if (res) {
      // 目標維持
      if (window.confirm(t("Dream.maintainConfirm"))) {
        await saveUserProfile(uid, {
          dream: "",
          dreamAchievedCount: (profile.dreamAchievedCount || 0) + 1,
        });
        const { updateRecentAction } = await import("@/lib/socialActions");
        await updateRecentAction(uid, profile.dream, "dream");
      }
    } else {
      // 目標リセット
      if (window.confirm(t("Dream.resetConfirm"))) {
        // 目標をすべて削除
        const goalPromises = goals.map(g => deleteGoalAction(uid, g.id));
        await Promise.all(goalPromises);
        await saveUserProfile(uid, {
          dream: "",
          dreamAchievedCount: (profile.dreamAchievedCount || 0) + 1,
        });
        const { updateRecentAction } = await import("@/lib/socialActions");
        await updateRecentAction(uid, profile.dream, "dream");
      }
    }
  };


  // タブボタン共通スタイル
  const tabButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: "10px 0",
    borderRadius: 8,
    border: "1px solid #c7d2fe",
    background: "#eef2ff",
    fontWeight: 600,
    cursor: "pointer",
  };



  //（起動時1回）
  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("[Auth] User logged in:", user.uid, user.isAnonymous ? "(Anonymous)" : "(Permanent)");
        setUid(user.uid);
        setIsAnonymous(user.isAnonymous);
        updateLastLogin(user.uid); // 最終ログイン更新
      } else {
        console.log("[Auth] No user found.");
        setUid(null);
        setIsAnonymous(false);
        setIsLoading(false);
        resetAllData();
      }
    });
  }, []);





  // 🔹 初回読み込み（Firestore → 画面）
  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "habits"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Habit[] = snapshot.docs.map((doc) => {
          const data = doc.data();

          let createdAt: Date | null = null;
          if (data.createdAt) {
            if (data.createdAt.toDate) {
              createdAt = data.createdAt.toDate(); // Firestore Timestamp
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt; // JS Date
            }
          }

          return {
            id: doc.id,
            text: data.text,
            createdAt,
            type: data.type ?? "daily",
            daysOfWeek: data.daysOfWeek ?? undefined,
            dailyStreak: data.dailyStreak ?? 0,
            lastCompletedDate: data.lastCompletedDate ?? null,
            point: typeof data.point === "number" ? data.point : 0,
            pointHistory: Array.isArray(data.pointHistory)
              ? (data.pointHistory
                .filter((p: any) => p && typeof p.date === "string" && typeof p.point === "number")
                .map((p: any) => ({ date: p.date, point: p.point })) as PointHistoryItem[])
              : [],
          };
        });

        setHabits(list);
      },
      (error) => {
        console.error("[onSnapshot habits] error:", error);
      }
    );



    return () => unsub();
  }, [uid]);


  const saveEdit = async (id: string) => {
    if (!editingText.trim()) return;
    if (!uid) return;

    await updateHabitFields(uid, id, { text: editingText });

    setEditingId(null);
    setEditingText("");
  };

  const handleToggleHabit = async (habitId: string) => {
    const h = habits.find(h => h.id === habitId);
    if (!h) return;

    const result = calcToggleHabit(h, todayStr, yesterdayStr);
    if (!uid) return;
    await updateHabitFields(uid, h.id, result.fields);

    if (result.alertMessage) alert(result.alertMessage);
  };

  const handleDeleteHabit = async (id: string) => {
    if (!uid) return;
    if (!window.confirm(th("confirmDelete"))) return;
    try {
      await deleteHabitAction(uid, id);
    } catch (e) {
      console.error("削除エラー", e);
    }
  };

  const handleSaveProfile = async () => {
    if (!uid) return;
    if (!profile.name.trim()) {
      alert(tp("enterName"));
      return;
    }
    if (!profile.gender || (profile.gender !== "male" && profile.gender !== "female")) {
      alert(tp("selectGender"));
      return;
    }
    try {
      const updateData = {
        name: profile.name.trim(),
        gender: profile.gender || "other",
        isPublic: !!profile.isPublic,
        showDream: !!profile.showDream,
        showGoal: !!profile.showGoal,
        showLastLogin: !!profile.showLastLogin,
      };
      await saveUserProfile(uid, updateData);
      alert(tp("saveSuccess"));
    } catch (e) {
      console.error("[ProfileSave] failed:", e);
      alert(tp("saveError"));
    }
  };



  // 累計獲得ポイント計算
  // 1. 習慣の獲得ポイント
  const habitPoints = habits.reduce((sum, h) => sum + (h.point ?? 0), 0);

  // 2. 目標達成ボーナス (達成数 × 100pt) - リアルタイムな goals 配列から計算
  const goalBonusPoints = goals.filter(g => g.done).length * 100;
  // const goalBonusPoints = (Number(profile.stats?.goalsAchievedCount) || 0) * 100;

  // 3. 称号ボーナス (DBに保存されている bonusPoints は称号分のみとする)
  // ※ 以前のバージョンで目標ボーナスが bonusPoints に混ざっている可能性があるが
  //   handleAwardTitles で再計算されるため、一時的にズレても称号判定で修正される運用にする。
  //   ただし、既存の bonusPoints に goalBonus が含まれていると二重計上になるリスクがある。
  //   ここでは「bonusPoints」は「称号によるボーナス」として扱うことにする。
  const titleBonusPoints = Number(profile.bonusPoints || 0);

  // 合計
  const totalPoint = habitPoints + goalBonusPoints + titleBonusPoints;
  // const totalPoint = habits.reduce((sum, h) => sum + (h.point ?? 0), 0) + Number(profile.bonusPoints || 0);

  const level = Math.floor(totalPoint / 100) + 1;

  // 🏅 称号獲得処理
  const handleAwardTitles = async () => {
    if (!uid || isLoading) return;
    const s = profile.stats || {};
    const newTitles: string[] = [...earnedTitles];
    let totalTitleBonus = 0;

    // 既存の称号のポイントも再計算（整合性確保）
    TITLE_DEFINITIONS.forEach(t => {
      if (earnedTitles.includes(t.id)) {
        totalTitleBonus += t.bonusPoints;
      }
    });

    let earnedAny = false;
    let newBonusAdded = 0;

    // 統計の自動補正 (habitsCreatedCount / goalsCreatedCount)
    // 実際のドキュメント数と stats がズレている場合があるため、称号判定用に補正したものを使う
    const correctedStats = {
      ...s,
      totalPoints: totalPoint,
      habitsCreatedCount: Math.max(s.habitsCreatedCount || 0, habits.length),
      goalsCreatedCount: Math.max(s.goalsCreatedCount || 0, goals.length),
    };

    TITLE_DEFINITIONS.forEach(t => {
      if (!newTitles.includes(t.id) && t.check(correctedStats)) {
        newTitles.push(t.id);
        totalTitleBonus += t.bonusPoints;
        newBonusAdded += t.bonusPoints;
        earnedAny = true;
        alert(`🏅 新しい称号を獲得！\n「${t.name}」\nボーナス: +${t.bonusPoints} pt`);
      }
    });

    // 称号ボーナスが現在のDB値と異なる、または新しい称号がある場合に更新
    const sameTitles =
      JSON.stringify(newTitles.sort()) ===
      JSON.stringify((profile.earnedTitles || []).sort());

    if (!sameTitles) {
      if (earnedAny) playCharing();

      setEarnedTitles(newTitles);
      // bonusPoints は「称号の合計」として上書き保存
      await saveUserProfile(uid, {
        earnedTitles: newTitles,
        bonusPoints: totalTitleBonus
      });
      // ローカルも更新
      setProfile(prev => ({
        ...prev,
        earnedTitles: newTitles,
        bonusPoints: totalTitleBonus
      }));
    }
  };


  // 🔹 利用制限チェック用
  const checkLimit = (type: "goals" | "todos" | "habits") => {
    const today = new Date().toISOString().split("T")[0];
    const s = profile.stats || {};
    const isNewDay = s.lastActionDate !== today;

    // 累計上限
    if (type === "goals" && goals.length >= 200) {
      alert(tg("limitReach"));
      return false;
    }
    if (type === "todos" && todos.length >= 200) {
      alert(t("Todo.limitReach")); // Will add this
      return false;
    }
    if (type === "habits" && habits.length >= 50) {
      alert(th("limitReach"));
      return false;
    }

    // 1日の上限
    const dailyCount = isNewDay ? 0 : (
      type === "goals" ? (s.goalsAddedToday || 0) :
        type === "todos" ? (s.todosAddedToday || 0) :
          (s.habitsAddedToday || 0)
    );

    if (dailyCount >= 50) {
      alert(t("Common.dailyLimitReach")); // I should add this to messages
      return false;
    }
    return true;
  };

  // 🔹 統計更新ヘルパー
  const incrementStats = async (type: "goals" | "todos" | "habits") => {
    if (!uid) return;
    const today = new Date().toISOString().split("T")[0];
    const s = profile.stats || {};
    const isNewDay = s.lastActionDate !== today;

    const newStats = {
      ...s,
      lastActionDate: today,
      goalsAddedToday: isNewDay ? (type === "goals" ? 1 : 0) : (s.goalsAddedToday || 0) + (type === "goals" ? 1 : 0),
      todosAddedToday: isNewDay ? (type === "todos" ? 1 : 0) : (s.todosAddedToday || 0) + (type === "todos" ? 1 : 0),
      habitsAddedToday: isNewDay ? (type === "habits" ? 1 : 0) : (s.habitsAddedToday || 0) + (type === "habits" ? 1 : 0),
      goalsCreatedCount: (s.goalsCreatedCount || 0) + (type === "goals" ? 1 : 0),
      habitsCreatedCount: (s.habitsCreatedCount || 0) + (type === "habits" ? 1 : 0),
    };

    await saveUserProfile(uid, { stats: newStats });
  };

  const handleAddHabit = async () => {
    if (!uid) return;
    if (!checkLimit("habits")) return;

    await addHabit(uid, habit, habitType, daysOfWeek);
    await incrementStats("habits");

    setHabit("");
    setHabitType("daily");
    setDaysOfWeek([]);
  };

  const handleAddTodo = async () => {
    if (!uid || !todoInput.trim()) return;
    if (!checkLimit("todos")) return;

    const { addTodo } = await import("@/lib/todoActions");
    await addTodo(uid, todoInput.trim());
    await incrementStats("todos");
    setTodoInput("");
  };

  const streak = (() => {
    let count = 0;
    for (const d of dailyStats) {
      if (d.rate === 100) count++;
      else break;
    }
    return count;
  })();

  // 📅 ログイン日数の更新
  useEffect(() => {
    if (!uid || isLoading) return; // profile.name チェックを緩める
    const today = new Date().toISOString().split("T")[0];
    const s = profile.stats || {};

    if (s.lastActionDate !== today) {
      const isContinuous = s.lastActionDate === yesterdayStr;
      const newStats = {
        ...s,
        lastActionDate: today,
        loginDays: (s.loginDays || 0) + 1,
        continuousLoginDays: isContinuous ? (s.continuousLoginDays || 0) + 1 : 1,
        maxContinuousLoginDays: Math.max(s.maxContinuousLoginDays || 0, isContinuous ? (s.continuousLoginDays || 0) + 1 : 1),
      };
      // 日替わりでのリセット
      newStats.goalsAddedToday = 0;
      newStats.todosAddedToday = 0;
      newStats.habitsAddedToday = 0;

      const firstLoginAt = profile.firstLoginAt || new Date();
      saveUserProfile(uid, { stats: newStats, firstLoginAt });
      handleAwardTitles();
    }
  }, [uid, yesterdayStr, isLoading]);

  const visibleHabits = habits
    .filter(h => {
      if (h.type === "daily") return true;
      if (h.type === "weekly" && h.daysOfWeek?.includes(todayDow)) return true;
      return false;
    })
    .sort((a, b) => {
      const aDone = (a.pointHistory ?? []).some(p => p.date === todayStr);
      const bDone = (b.pointHistory ?? []).some(p => p.date === todayStr);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1; // 未達成(false)を前に、達成済み(true)を後に
    });



  return (

    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "20px 10px",
      background: isDarkMode ? "#111827" : "#f5f5f5",
      color: isDarkMode ? "#f3f4f6" : "#000",
      fontFamily: "sans-serif",
      transition: "background 0.3s, color 0.3s"
    }}>


      <div style={{
        width: 360,
        background: isDarkMode ? "#1f2937" : "#ffffff",
        borderRadius: 12,
        padding: 24,
        boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.1)",
        transition: "background 0.3s"
      }}>
        <AuthBox isDarkMode={isDarkMode} />


        {uid === null && !isLoading && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ fontSize: 13, color: isDarkMode ? "#9ca3af" : "#666" }}>
              {ta("loginMessage")}
            </p>
          </div>
        )}

        {/* ユーザープロフィール概要 (AuthBoxのすぐ下、装飾を抑えたデザイン) */}
        {!isLoading && (profile.name || profile.dream) && (
          <div style={{ marginBottom: 16 }}>
            {profile.name && (
              <div
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 8,
                  color: isDarkMode ? "#fff" : "#000",
                }}
              >
                <span style={{
                  color: profile.gender === "female" ? "#f472b6" : profile.gender === "male" ? "#3b82f6" : (isDarkMode ? "#9ca3af" : "#000"),
                  fontSize: "1.2em"
                }}>
                  {profile.gender === "female" ? "👩" : profile.gender === "male" ? "👨" : "👤"}
                </span>
                {profile.name}
                {profile.dreamAchievedCount && profile.dreamAchievedCount > 0 ? (
                  <span style={{
                    fontSize: 11,
                    color: isDarkMode ? "#fbbf24" : "#d97706",
                    background: isDarkMode ? "#451a03" : "#fffbeb",
                    padding: "2px 8px",
                    borderRadius: 20,
                    border: isDarkMode ? "1px solid #92400e" : "1px solid #fcd34d",
                    fontWeight: "bold"
                  }}>
                    ✨ {td("achievedCount", { count: profile.dreamAchievedCount })}
                  </span>
                ) : null}
              </div>
            )}

            {profile.dream && (
              <div
                onMouseDown={startLongPress}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={startLongPress}
                onTouchEnd={cancelLongPress}
                style={{
                  padding: "6px 12px",
                  background: isPressing
                    ? (isDarkMode ? "#064e3b" : "#dcfce7")
                    : (isDarkMode ? "#1e1b4b" : "#eef2ff"),
                  borderRadius: 8,
                  fontWeight: "bold",
                  fontSize: 13,
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all 0.3s",
                  border: isPressing
                    ? `2px solid ${isDarkMode ? "#22c55e" : "#22c55e"}`
                    : `1px solid ${isDarkMode ? "#4338ca" : "#c7d2fe"}`,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "none",
                  color: isDarkMode ? "#fff" : "#1e40af"
                }}
              >
                {isPressing && (
                  <div style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: 4,
                    background: "#22c55e",
                    width: "100%",
                    animation: "progress 10s linear"
                  }} />
                )}
                🌈 夢：{profile.dream}
                {isPressing && <div style={{ fontSize: 10, color: isDarkMode ? "#86efac" : "#166534", marginTop: 4 }}>そのまま10秒キープで達成！</div>}
              </div>
            )}
          </div>
        )}

        <style jsx>{`
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>

        {/* 環境表示インジケーター */}
        <div
          style={{
            fontSize: 10,
            padding: "6px 8px",
            marginBottom: 12,
            borderRadius: 6,
            background: isDarkMode
              ? (isDev ? "#451a03" : "#064e3b")
              : (isDev ? "#fef3c7" : "#d1fae5"),
            color: isDarkMode
              ? (isDev ? "#fbbf24" : "#6ee7b7")
              : (isDev ? "#92400e" : "#065f46"),
            textAlign: "center",
            border: isDarkMode
              ? `1px solid ${isDev ? "#92400e" : "#065f46"}`
              : "none"
          }}
        >
          {isDev ? "🔧 開発環境" : "🚀 本番環境"} | Project: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}
        </div>

        {/* ===== ナビゲーションボタン (Loading外に出して安定させる) ===== */}
        {uid && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[
                { id: "habit", label: tt("habit"), icon: "🔥" },
                { id: "dream", label: tt("dream"), icon: "🌈" },
                { id: "todo", label: tt("todo"), icon: "📝" },
                { id: "bucketList", label: tt("bucketList"), icon: "💯" },
              ].map((btn) => {
                const isLocked = btn.id === "bucketList" && goals.filter(g => g.done).length < 30;
                return (
                  <button
                    key={btn.id}
                    onClick={() => !isLocked && setView(btn.id as any)}
                    style={{
                      flex: 1,
                      padding: "10px 4px",
                      background: isLocked
                        ? (isDarkMode ? "#374151" : "#d1d5db")
                        : (view === btn.id ? "#4f46e5" : (isDarkMode ? "transparent" : "#e5e7eb")),
                      color: isLocked
                        ? (isDarkMode ? "#9ca3af" : "#6b7280")
                        : (view === btn.id ? "#fff" : (isDarkMode ? "#fff" : "#374151")),
                      border: view === btn.id ? "none" : (isDarkMode ? "1.5px solid #fff" : "none"),
                      borderRadius: 8,
                      fontWeight: "bold",
                      fontSize: 13,
                      cursor: isLocked ? "not-allowed" : "pointer",
                      transition: "all 0.2s",
                      opacity: isLocked ? 0.6 : 1,
                    }}
                    disabled={isLocked}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {[
                { id: "history", label: tt("history"), icon: "📈" },
                { id: "stats", label: tt("stats"), icon: "📊" },
                { id: "title", label: tt("title"), icon: "🏅" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setView(btn.id as any)}
                  style={{
                    flex: 1,
                    padding: "10px 4px",
                    background: view === btn.id ? "#4f46e5" : (isDarkMode ? "transparent" : "#e5e7eb"),
                    color: view === btn.id ? "#fff" : (isDarkMode ? "#fff" : "#374151"),
                    border: view === btn.id ? "none" : (isDarkMode ? "1.5px solid #fff" : "none"),
                    borderRadius: 8,
                    fontWeight: "bold",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  {btn.label}
                </button>
              ))}
              <button
                onClick={() => window.open("https://zinseigame.blogspot.com/2026/02/10-check-httpsdream-lan.html")}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: isDarkMode ? "transparent" : "#e5e7eb",
                  color: isDarkMode ? "#fff" : "#374151",
                  border: isDarkMode ? "1.5px solid #fff" : "none",
                  borderRadius: 8,
                  fontWeight: "bold",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tt("usage")}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                onClick={() => setView("profile")}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: view === "profile" ? "#4f46e5" : (isDarkMode ? "transparent" : "#e5e7eb"),
                  color: view === "profile" ? "#fff" : (isDarkMode ? "#fff" : "#374151"),
                  border: view === "profile" ? "none" : (isDarkMode ? "1.5px solid #fff" : "none"),
                  borderRadius: 8,
                  fontWeight: "bold",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                👤 {tt("profile")}
              </button>
              <button
                onClick={() => !isAnonymous && setView("friend")}
                disabled={isAnonymous}
                style={{
                  flex: 1,
                  padding: "10px 4px",
                  background: isAnonymous
                    ? (isDarkMode ? "#374151" : "#d1d5db")
                    : (view === "friend" ? "#4f46e5" : (isDarkMode ? "transparent" : "#e5e7eb")),
                  color: isAnonymous
                    ? (isDarkMode ? "#9ca3af" : "#6b7280")
                    : (view === "friend" ? "#fff" : (isDarkMode ? "#fff" : "#374151")),
                  border: view === "friend" ? "none" : (isDarkMode ? "1.5px solid #fff" : "none"),
                  borderRadius: 8,
                  fontWeight: "bold",
                  fontSize: 13,
                  cursor: isAnonymous ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  opacity: isAnonymous ? 0.6 : 1,
                }}
              >
                🤝 {tt("friend")}
              </button>
              <LanguageSwitcher isDarkMode={isDarkMode} />
            </div>
            <div style={{
              fontSize: 14,
              marginBottom: 16,
              color: isDarkMode ? "#fbbf24" : "#444",
              fontWeight: "bold"
            }}>
              🏆 {ts("points", { points: totalPoint })}
            </div>
          </>
        )}

        {isLoading && (
          <div style={{ padding: 40, textAlign: "center", color: "#6366f1", fontWeight: "bold" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            {tc("loading")}
          </div>
        )}

        {view === "habit" && (
          <HabitView
            habit={habit}
            setHabit={(v) => setHabit(v)}
            onAddHabit={handleAddHabit}
            isDev={isDev}
            todayStr={todayStr}
            setTestDayOffset={setTestDayOffset}
            habitType={habitType}
            setHabitType={setHabitType}
            daysOfWeek={daysOfWeek}
            setDaysOfWeek={setDaysOfWeek}
            uid={uid}
            visibleHabits={visibleHabits}
            editingId={editingId}
            setEditingId={setEditingId}
            editingText={editingText}
            setEditingText={setEditingText}
            onToggleHabit={handleToggleHabit}
            onSaveEdit={saveEdit}
            onDeleteHabit={handleDeleteHabit}
            isDarkMode={isDarkMode}
          />
        )}

        {view === "history" && (
          <HistoryView
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            calendarDays={calendarDays}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            habits={habits}
            isDarkMode={isDarkMode}
          />
        )}

        {view === "stats" && (
          <StatsView
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            calendarDays={calendarDays}
            dailyStats={dailyStats}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            streak={streak}
            isDarkMode={isDarkMode}
          />
        )}

        {view === "dream" && (
          <DreamView
            uid={uid}
            profile={profile}
            setProfile={setProfile}
            dreamInput={dreamInput}
            setDreamInput={setDreamInput}
            isEditingDream={isEditingDream}
            setIsEditingDream={setIsEditingDream}
            goals={goals}
            goalInput={goalInput}
            setGoalInput={setGoalInput}
            deadline={deadline}
            setDeadline={setDeadline}
            editingGoalId={editingGoalId}
            setEditingGoalId={setEditingGoalId}
            editingGoalText={editingGoalText}
            setEditingGoalText={setEditingGoalText}
            tabButtonStyle={tabButtonStyle}
            isDarkMode={isDarkMode}
            checkLimit={checkLimit}
            incrementStats={incrementStats}
          />
        )}

        {view === "todo" && (
          <TodoView
            uid={uid}
            todos={todos}
            todoInput={todoInput}
            setTodoInput={setTodoInput}
            editingTodoId={editingTodoId}
            setEditingTodoId={setEditingTodoId}
            editingTodoText={editingTodoText}
            setEditingTodoText={setEditingTodoText}
            isDarkMode={isDarkMode}
            checkLimit={checkLimit}
            incrementStats={incrementStats}
          />
        )}

        {view === "friend" && (
          <FriendView
            uid={uid}
            currentUserName={profile.name}
            isDarkMode={isDarkMode}
          />
        )}

        {view === "title" && (
          <TitleView
            level={level}
            earnedTitles={earnedTitles}
            titles={TITLE_DEFINITIONS}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )}

        {view === "profile" && (
          <ProfileView
            uid={uid}
            profile={profile}
            setProfile={setProfile}
            onSave={handleSaveProfile}
            isDarkMode={isDarkMode}
          />
        )}

        {view === "bucketList" && (
          <BucketListView
            uid={uid}
            isDarkMode={isDarkMode}
          />
        )}

      </div>
    </main >
  );
}
