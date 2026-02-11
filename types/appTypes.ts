// types/appTypes.ts

export type DailyStat = {
  date: string;
  total: number;
  doneCount: number;
  rate: number;
};

export type PointHistoryItem = {
  date: string;   // "YYYY-MM-DD"
  point: number;  // +◯pt
};

export type Habit = {
  id: string;
  text: string;
  createdAt: Date | null;
  type: "daily" | "weekly";
  daysOfWeek?: number[]; // weekly のときだけ
  dailyStreak: number;
  lastCompletedDate: string | null;
  point: number | null;
  pointHistory: PointHistoryItem[];
};

export type Goal = {
  id: string;
  title: string;
  deadline?: string | null;
  done: boolean;
  achievedAt?: any; // Timestamp
};

export type Todo = {
  id: string;
  text: string;
  done: boolean;
};

export type UserProfile = {
  uid: string;
  name: string;
  gender: string;
  dream: string;
  isPublic: boolean;
  showDream: boolean;
  showGoal: boolean;
  earnedTitles: string[];
  dreamAchievedCount?: number;
  bonusPoints?: number;
  lastLoginAt?: any; // Timestamp
  firstLoginAt?: any; // Timestamp
  totalPoints?: number;

  // 統計・称号用
  stats?: {
    loginDays?: number;
    continuousLoginDays?: number;
    maxContinuousLoginDays?: number;
    maxStreak?: number;
    goalsCreatedCount?: number;
    habitsCreatedCount?: number;
    goalsAchievedCount?: number;

    // 悪戯防止用
    lastActionDate?: string; // "YYYY-MM-DD"
    goalsAddedToday?: number;
    todosAddedToday?: number;
    habitsAddedToday?: number;
  };
};
