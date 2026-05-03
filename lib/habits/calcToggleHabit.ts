// lib/habits/calcToggleHabit.ts
import { formatDateToJST } from "./dateUtils";

type Habit = {
  id: string;
  text: string;
  dailyStreak: number;
  lastCompletedDate: string | null;
  point: number | null;
  pointHistory: { date: string; point: number }[];
};

type ToggleCalcResult =
  | {
      kind: "uncheck";
      fields: {
        lastCompletedDate: string | null;
        dailyStreak: number;
        point: number;
        pointHistory: { date: string; point: number }[];
      };
      pointDelta: number;
      alertMessage?: string;
    }
  | {
      kind: "check";
      fields: {
        dailyStreak: number;
        lastCompletedDate: string;
        point: number;
        pointHistory: { date: string; point: number }[];
      };
      pointDelta: number;
      alertMessage?: string;
    };

const getBonusPoint = (streak: number): number => {
  if (streak === 3) return 5;
  if (streak === 7) return 20;
  if (streak === 30) return 100;
  return 0;
};

/**
 * 指定した日付時点での連続日数を履歴から計算する
 */
const getStreakAtDate = (history: { date: string }[], targetDate: string): number => {
  let streak = 0;
  let current = targetDate;
  while (history.some((h) => h.date === current)) {
    streak++;
    const d = new Date(current);
    d.setDate(d.getDate() - 1);
    current = formatDateToJST(d);
  }
  return streak;
};

export const calcToggleHabit = (
  h: Habit,
  targetDate: string,
  todayStr: string,
  yesterdayStr: string
): ToggleCalcResult => {
  const currentPoint = h.point ?? 0;
  const history = Array.isArray(h.pointHistory) ? h.pointHistory : [];

  // ★ 対象日の達成判定
  const targetEntry = history.find((p) => p.date === targetDate);
  const isDoneTarget = !!targetEntry;

  // ===== チェックを外す =====
  if (isDoneTarget) {
    const minus = targetEntry?.point ?? 0;
    const newHistory = history.filter((p) => p.date !== targetDate);

    // ストリークと最終達成日の再計算
    let newDailyStreak = 0;
    let newLastCompletedDate: string | null = null;

    if (newHistory.length > 0) {
      // 履歴の中で最新の日付を探す
      const sorted = [...newHistory].sort((a, b) => b.date.localeCompare(a.date));
      newLastCompletedDate = sorted[0].date;
      newDailyStreak = getStreakAtDate(newHistory, newLastCompletedDate);
    }

    return {
      kind: "uncheck",
      fields: {
        lastCompletedDate: newLastCompletedDate,
        dailyStreak: newDailyStreak,
        point: currentPoint - minus,
        pointHistory: newHistory,
      },
      pointDelta: -minus,
    };
  }

  // ===== チェックを入れる =====
  // 1. 対象日の前日のストリークを取得
  const d = new Date(targetDate);
  d.setDate(d.getDate() - 1);
  const dayBeforeTarget = formatDateToJST(d);
  const prevStreak = getStreakAtDate(history, dayBeforeTarget);

  const targetStreak = prevStreak + 1;
  const bonusPoint = getBonusPoint(targetStreak);
  const earnedPoint = 1 + bonusPoint;

  const newHistory = [...history, { date: targetDate, point: earnedPoint }];

  // 2. 最終的なストリークと達成日の判定（今日が既に達成済みなら繋げる）
  let finalStreak = targetStreak;
  let finalLastCompletedDate = targetDate;

  // もし「昨日」をチェックし、「今日」が既に達成済みならストリークを繋げる
  if (targetDate === yesterdayStr && history.some((p) => p.date === todayStr)) {
    finalStreak = targetStreak + 1;
    finalLastCompletedDate = todayStr;
  } else {
    // 常に最新の日付を lastCompletedDate にする
    const sorted = [...newHistory].sort((a, b) => b.date.localeCompare(a.date));
    finalLastCompletedDate = sorted[0].date;
    finalStreak = getStreakAtDate(newHistory, finalLastCompletedDate);
  }

  const alertMessage =
    finalStreak === 3 || finalStreak === 7 || finalStreak === 30
      ? `🏆 ${h.text}：${finalStreak}日達成！`
      : undefined;

  return {
    kind: "check",
    fields: {
      dailyStreak: finalStreak,
      lastCompletedDate: finalLastCompletedDate,
      point: currentPoint + earnedPoint,
      pointHistory: newHistory,
    },
    pointDelta: earnedPoint,
    alertMessage,
  };
};
