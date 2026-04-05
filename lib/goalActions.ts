// lib/goalActions.ts
import { collection, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LocalStorageRepository } from "./localActions";
import { LS_KEYS } from "./dataPersistence";

export type GoalDoc = {
  id: string;
  title: string;
  deadline?: string | null;
  done: boolean;
  createdAt: any; // serverTimestamp or Date
  achievedAt?: any;
};

export const addGoal = async (uid: string | null, title: string, deadline?: string) => {
  if (!title.trim()) return;

  if (uid) {
    const { serverTimestamp } = await import("firebase/firestore");
    await addDoc(collection(db, "users", uid, "goals"), {
      title: title.trim(),
      deadline: deadline || null,
      done: false,
      visibility: "friends",
      createdAt: serverTimestamp(),
    });
  } else {
    const newGoal: GoalDoc = {
      id: "local_goal_" + Date.now().toString(),
      title: title.trim(),
      deadline: deadline || null,
      done: false,
      createdAt: new Date(),
    };
    LocalStorageRepository.addItem(LS_KEYS.GOALS, newGoal);
  }
};

export const updateGoal = async (
  uid: string | null,
  goalId: string,
  fields: Partial<{ title: string; deadline: string | null; done: boolean }>
) => {
  if (!goalId) return;

  const data: any = { ...fields };
  
  if (uid) {
    if (fields.done === true) {
      const { serverTimestamp } = await import("firebase/firestore");
      data.achievedAt = serverTimestamp();
    } else if (fields.done === false) {
      data.achievedAt = null;
    }
    await updateDoc(doc(db, "users", uid, "goals", goalId), data);
  } else {
    if (fields.done === true) {
      data.achievedAt = new Date();
    } else if (fields.done === false) {
      data.achievedAt = null;
    }
    LocalStorageRepository.updateItem(LS_KEYS.GOALS, goalId, data);
  }
};

export const deleteGoal = async (uid: string | null, goalId: string) => {
  if (!goalId) return;
  if (uid) {
    await deleteDoc(doc(db, "users", uid, "goals", goalId));
  } else {
    LocalStorageRepository.deleteItem(LS_KEYS.GOALS, goalId);
  }
};
