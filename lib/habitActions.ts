// lib/habitActions.ts
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// 追加
export const addHabit = async (
  uid: string,
  habit: string,
  habitType: "daily" | "weekly",
  daysOfWeek: number[]
) => {
  if (!habit.trim()) return;

  console.log("[addHabit] start:", { uid, habit, habitType, daysOfWeek });

  try {
    const docRef = await addDoc(collection(db, "users", uid, "habits"), {
      text: habit,
      type: habitType,
      daysOfWeek: habitType === "weekly" ? daysOfWeek : null,
      createdAt: serverTimestamp(),
      dailyStreak: 0,
      lastCompletedDate: null,
      point: 0,
      pointHistory: [],
    });
    console.log("[addHabit] success:", docRef.id);
  } catch (e) {
    console.error("[addHabit] failed:", e);
    throw e;
  }
};

// 削除（強化版）
export const deleteHabit = async (uid: string, id: string) => {
  if (!uid || !id) return;

  try {
    await deleteDoc(doc(db, "users", uid, "habits", id));
  } catch (e) {
    console.error("deleteHabit failed:", e);
    throw e;
  }
};

