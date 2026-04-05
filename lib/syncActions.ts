import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { LS_KEYS } from "./dataPersistence";
import { LocalStorageRepository } from "./localActions";

/**
 * LocalStorageのデータをFirestoreへ同期する
 */
export async function syncLocalDataToFirestore(uid: string) {
  if (!uid) return;

  console.log("[Sync] Starting sync for user:", uid);

  // 1. プロフィールの同期
  const localProfile = LocalStorageRepository.getProfile();
  if (localProfile) {
    console.log("[Sync] Syncing profile...");
    // 既存のプロフィールを上書きせずマージ
    await setDoc(doc(db, "users", uid), localProfile, { merge: true });
    await setDoc(doc(db, "publicUsers", uid), localProfile, { merge: true });
    localStorage.removeItem(LS_KEYS.PROFILE);
  }

  // 2. データの同期 (Habits, Goals, Todos)
  const collections = [
    { key: LS_KEYS.HABITS, name: "habits" },
    { key: LS_KEYS.GOALS, name: "goals" },
    { key: LS_KEYS.TODOS, name: "todos" },
  ];

  for (const col of collections) {
    const list = LocalStorageRepository.getList<any>(col.key);
    if (list.length > 0) {
      console.log(`[Sync] Syncing ${col.name} (${list.length} items)...`);
      for (const item of list) {
        // IDを新しく生成し直す（FirestoreのIDを使用）
        const { id, ...data } = item;
        // createdAtがDate型ならFirestoreの形式に合わせる必要はないが、一応検証
        await addDoc(collection(db, "users", uid, col.name), {
          ...data,
          syncedFromLocal: true,
        });
      }
      // 同期完了後にローカルデータを削除
      localStorage.removeItem(col.key);
    }
  }

  console.log("[Sync] Sync completed.");
}
