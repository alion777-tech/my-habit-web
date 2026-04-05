import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LocalStorageRepository } from "./localActions";
import { LS_KEYS } from "./dataPersistence";

// 追加
export const addTodo = async (uid: string | null, text: string) => {
  if (!text.trim()) return;

  if (uid) {
    await addDoc(collection(db, "users", uid, "todos"), {
      text,
      done: false,
      createdAt: serverTimestamp(),
    });
  } else {
    const newTodo = {
      id: "local_todo_" + Date.now().toString(),
      text,
      done: false,
      createdAt: new Date(),
    };
    LocalStorageRepository.addItem(LS_KEYS.TODOS, newTodo);
  }
};

// 完了切り替え
export const toggleTodo = async (
  uid: string | null,
  todoId: string,
  done: boolean
) => {
  if (!todoId) return;

  if (uid) {
    await updateDoc(doc(db, "users", uid, "todos", todoId), {
      done: !done,
    });
  } else {
    LocalStorageRepository.updateItem<{ id: string; done: boolean }>(LS_KEYS.TODOS, todoId, { done: !done });
  }
};

// 削除
export const deleteTodo = async (uid: string | null, todoId: string) => {
  if (!todoId) return;

  if (uid) {
    await deleteDoc(doc(db, "users", uid, "todos", todoId));
  } else {
    LocalStorageRepository.deleteItem(LS_KEYS.TODOS, todoId);
  }
};

// 編集
export const updateTodo = async (
  uid: string | null,
  todoId: string,
  text: string
) => {
  if (!todoId || !text.trim()) return;

  if (uid) {
    await updateDoc(doc(db, "users", uid, "todos", todoId), {
      text,
    });
  } else {
    LocalStorageRepository.updateItem<{ id: string; text: string }>(LS_KEYS.TODOS, todoId, { text });
  }
};
