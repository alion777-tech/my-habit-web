import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// 追加
export const addTodo = async (uid: string, text: string) => {
  if (!uid || !text.trim()) return;

  await addDoc(collection(db, "users", uid, "todos"), {
    text,
    done: false,
    createdAt: serverTimestamp(),
  });
};

// 完了切り替え
export const toggleTodo = async (
  uid: string,
  todoId: string,
  done: boolean
) => {
  if (!uid || !todoId) return;

  await updateDoc(doc(db, "users", uid, "todos", todoId), {
    done: !done,
  });
};

// 削除
export const deleteTodo = async (uid: string, todoId: string) => {
  if (!uid || !todoId) return;

  await deleteDoc(doc(db, "users", uid, "todos", todoId));
};


// 編集（テキスト更新）
export const updateTodo = async (
  uid: string,
  todoId: string,
  text: string
) => {
  if (!uid || !todoId || !text.trim()) return;

  await updateDoc(doc(db, "users", uid, "todos", todoId), {
    text,
  });
};
