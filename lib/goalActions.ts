// lib/goalActions.ts
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type GoalDoc = {
  title: string;
  deadline?: string;
  done: boolean;
  createdAt: any; // serverTimestamp
};

export const addGoal = async (uid: string, title: string, deadline?: string) => {
  if (!uid) return;
  if (!title.trim()) return;

  const { serverTimestamp } = await import("firebase/firestore");

  await addDoc(collection(db, "users", uid, "goals"), {
    title: title.trim(),
    deadline: deadline || null,
    done: false,
    visibility: "friends", // セキュリティルールに対応: デフォルトでフレンドに公開
    createdAt: serverTimestamp(),
  });
};

export const updateGoal = async (
  uid: string,
  goalId: string,
  fields: Partial<{ title: string; deadline: string | null; done: boolean }>
) => {
  if (!uid || !goalId) return;

  const data: any = { ...fields };
  if (fields.done === true) {
    const { serverTimestamp } = await import("firebase/firestore");
    data.achievedAt = serverTimestamp();
  } else if (fields.done === false) {
    data.achievedAt = null;
  }

  await updateDoc(doc(db, "users", uid, "goals", goalId), data);
};

export const deleteGoal = async (uid: string, goalId: string) => {
  if (!uid || !goalId) return;
  await deleteDoc(doc(db, "users", uid, "goals", goalId));
};
