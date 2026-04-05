// lib/habits/updateHabitFields.ts
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LocalStorageRepository } from "../localActions";
import { LS_KEYS } from "../dataPersistence";

export const updateHabitFields = async (
  uid: string | null,
  habitId: string,
  fields: Record<string, any>
) => {
  if (!habitId) return;

  if (uid) {
    await updateDoc(doc(db, "users", uid, "habits", habitId), fields);
  } else {
    LocalStorageRepository.updateItem(LS_KEYS.HABITS, habitId, fields);
  }
};

