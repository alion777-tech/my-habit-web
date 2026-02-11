// lib/habits/calcToggleHabit.ts

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
        lastCompletedDate?: string | null; // 触らない運用
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

export const calcToggleHabit = (
  h: Habit,
  todayStr: string,
  yesterdayStr: string
): ToggleCalcResult => {
  const currentPoint = h.point ?? 0;
  const history = Array.isArray(h.pointHistory) ? h.pointHistory : [];

  // ★ 今日の達成判定：pointHistory に todayStr があるか
  const todayEntry = history.find((p) => p.date === todayStr);
  const isDoneToday = !!todayEntry;

  // ===== チェックを外す（その日付の履歴を消す）=====
  if (isDoneToday) {
    const minus = todayEntry?.point ?? 0;

    const newHistory = history.filter((p) => p.date !== todayStr);

    return {
      kind: "uncheck",
      fields: {
        // lastCompletedDate は「最後に達成した日」なので、ここでは無理に弄らない（安全）
        point: currentPoint - minus,
        pointHistory: newHistory,
      },
      pointDelta: -minus,
    };
  }

  // ===== チェックを入れる（その日付の履歴を追加）=====
  let newStreak = 1;

  if (h.lastCompletedDate === yesterdayStr) {
    newStreak = (h.dailyStreak ?? 0) + 1;
  } else {
    newStreak = 1;
  }

  const bonusPoint = getBonusPoint(newStreak);
  const earnedPoint = 1 + bonusPoint;

  const newHistory = [...history, { date: todayStr, point: earnedPoint }];

  const alertMessage =
    newStreak === 3 || newStreak === 7 || newStreak === 30
      ? `🏆 ${h.text}：${newStreak}日達成！`
      : undefined;

  return {
    kind: "check",
    fields: {
      dailyStreak: newStreak,
      lastCompletedDate: todayStr,
      point: currentPoint + earnedPoint,
      pointHistory: newHistory,
    },
    pointDelta: earnedPoint,
    alertMessage,
  };
};
