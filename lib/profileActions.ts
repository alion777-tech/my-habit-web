import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import type { UserProfile } from "@/types/appTypes";

/**
 * ユーザープロフィールの取得
 * - 本人なら users/{uid} を読む
 * - 他人なら publicUsers/{uid} を読む
 * - 加えて、ログイン状況を users/{uid}/public/status から取得してマージする
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!uid) return null;

  try {
    const currentUid = auth.currentUser?.uid;
    const isOwner = uid === currentUid;

    // 1. プロフィール基本情報の取得
    const profileRef = doc(db, isOwner ? "users" : "publicUsers", uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      console.log(`[getUserProfile] Profile not found at: ${profileRef.path}`);
      return null;
    }

    const profileData = profileSnap.data();

    // 2. 状態（最終ログイン等）の取得 - users/{uid}/public/status
    // このパスはログイン済みなら誰でも読み取り可能
    let statusData: any = {};
    try {
      const statusRef = doc(db, "users", uid, "public", "status");
      const statusSnap = await getDoc(statusRef);
      if (statusSnap.exists()) {
        statusData = statusSnap.data();
      }
    } catch (e) {
      // 権限エラー等はログに出すが、プロフィールの返却は継続
      console.warn(`[getUserProfile] Could not read status for ${uid}:`, e);
    }

    return {
      uid: uid,
      name: profileData.name ?? "",
      gender: profileData.gender ?? "",
      dream: profileData.dream ?? profileData.dreams ?? "",
      isPublic: !!profileData.isPublic,
      showDream: !!profileData.showDream || !!profileData.showDreams,
      showGoal: !!profileData.showGoal || !!profileData.showGoals,
      earnedTitles: Array.isArray(profileData.earnedTitles) ? profileData.earnedTitles : [],
      dreamAchievedCount: profileData.dreamAchievedCount ?? 0,
      // lastLoginAt は statusData から優先的に取得
      lastLoginAt: statusData.lastLoginAt ?? profileData.lastLoginAt ?? null,
    };
  } catch (e) {
    console.error(`[getUserProfile] Fatal error reading profile for ${uid}:`, e);
  }
  return null;
};

/**
 * ユーザープロフィールの保存
 * - 本人領域 users/{uid} と 検索/公開用 publicUsers/{uid} の両方に書き込む
 */
export const saveUserProfile = async (uid: string, profile: Partial<UserProfile>) => {
  if (!uid || auth.currentUser?.uid !== uid) return;

  const batch = {
    ...profile,
    updatedAt: serverTimestamp(),
  };

  try {
    // 本人領域
    await setDoc(doc(db, "users", uid), batch, { merge: true });
    // 公開領域
    await setDoc(doc(db, "publicUsers", uid), batch, { merge: true });
    console.log(`[saveUserProfile] Saved to users/${uid} and publicUsers/${uid}`);
  } catch (e) {
    console.error(`[saveUserProfile] Error saving profile for ${uid}:`, e);
    throw e;
  }
};

/**
 * ログイン状況/アクティブ状況の更新
 * users/{uid}/public/status に書き込む（ルールで本人のみwrite、全員read可）
 */
export const updateLastLogin = async (uid: string) => {
  if (!uid || !auth.currentUser) return;
  if (auth.currentUser.uid !== uid) return;

  try {
    const statusRef = doc(db, "users", uid, "public", "status");
    await setDoc(statusRef, {
      lastLoginAt: serverTimestamp(),
      lastActive: serverTimestamp()
    }, { merge: true });
    console.log(`[updateLastLogin] Updated status at: ${statusRef.path}`);
  } catch (e) {
    console.error(`[updateLastLogin] Error:`, e);
  }
};

/**
 * アクティブ状況のみ更新
 */
export const updateLastActive = async (uid: string) => {
  if (!uid || !auth.currentUser || auth.currentUser.uid !== uid) return;
  try {
    const statusRef = doc(db, "users", uid, "public", "status");
    await setDoc(statusRef, { lastActive: serverTimestamp() }, { merge: true });
  } catch (e) {
    // サイレントに
  }
};
