// lib/habits/updateHabitFields.ts
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const updateHabitFields = async (
  uid: string,
  habitId: string,
  fields: Record<string, any>
) => {
  if (!uid || !habitId) return;
  await updateDoc(doc(db, "users", uid, "habits", habitId), fields);
};

