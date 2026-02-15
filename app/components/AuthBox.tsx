"use client";

import { useEffect, useState } from "react";
import {
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type Props = {
  isDarkMode?: boolean;
};

export default function AuthBox({ isDarkMode = false }: Props) {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState("");
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
  }, []);

  // 既存のGoogleアカウントで新規ログイン（切り替え）
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setIsLinking(false);
      setError("");
    } catch (e: any) {
      console.error("[AuthBox] Google Sign In error:", e);
      setError(e.message);
    }
  };

  // ゲストモード（匿名ログイン）で開始
  const startAsGuest = async () => {
    try {
      await signInAnonymously(auth);
      setError("");
    } catch (e: any) {
      console.error("[AuthBox] Guest start error:", e);
      setError("ゲストモードでの開始に失敗しました。");
    }
  };

  // 匿名ユーザーをGoogleアカウントにアップグレード（引き継ぎ）
  const linkGoogleAccount = async () => {
    const provider = new GoogleAuthProvider();
    try {
      if (user?.isAnonymous) {
        await linkWithPopup(user, provider);
        alert("アカウントが連携されました！");
      }
      setError("");
    } catch (e: any) {
      if (e.code === "auth/credential-already-in-use") {
        setError("このGoogleアカウントは既に別のデータで登録されています。既存のデータを使いたい場合は、『ログインはこちら』からログインしてください。");
      } else {
        setError(e.message);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (user && !user.isAnonymous) {
    return (
      <div style={{
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        background: isDarkMode ? "#374151" : "#f3f4f6",
        border: isDarkMode ? "1px solid #4b5563" : "none"
      }}>
        <div style={{ fontSize: 13, color: isDarkMode ? "#9ca3af" : "#4b5563" }}>ログイン中：</div>
        <div style={{ fontWeight: "bold", marginBottom: 8, color: isDarkMode ? "#fff" : "#000" }}>{user.email || user.displayName || "ログイン済み"}</div>
        <button
          onClick={logout}
          style={{
            padding: "4px 16px",
            background: isDarkMode ? "transparent" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            border: isDarkMode ? "1.5px solid #fff" : "1px solid #d1d5db",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: "bold"
          }}
        >
          ログアウト
        </button>
      </div>
    );
  }

  // ゲストモードでの表示
  if (user?.isAnonymous && !isLinking) {
    return (
      <div style={{
        marginBottom: 16,
        padding: 16,
        borderRadius: 12,
        background: isDarkMode ? "#374151" : "#fffbeb",
        border: isDarkMode ? "1px solid #4b5563" : "1px solid #fef3c7"
      }}>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 13, color: isDarkMode ? "#fbbf24" : "#92400e", fontWeight: "bold" }}>⚠️ ゲストモードで利用中</div>
          <p style={{ fontSize: 11, color: isDarkMode ? "#fde68a" : "#b45309", margin: "4px 0" }}>アカウントを連携（引き継ぎ）しないと、データが消えてしまいます。</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            onClick={linkGoogleAccount}
            style={{
              padding: "10px",
              background: isDarkMode ? "#1f2937" : "#fff",
              color: isDarkMode ? "#fff" : "#000",
              border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: 14,
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
          >
            Googleでデータを引き継ぐ
          </button>

          <button
            onClick={() => setIsLinking(true)}
            style={{
              marginTop: 4,
              padding: "10px",
              background: "none",
              border: isDarkMode ? "1.5px solid #fff" : "1.5px solid #92400e",
              color: isDarkMode ? "#fff" : "#92400e",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold"
            }}
          >
            既存アカウントでログイン
          </button>
        </div>
        {error && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 8 }}>{error}</div>}
      </div>
    );
  }

  // 未ログイン状態の表示（Googleログインかゲスト利用かを選択）
  return (
    <div style={{
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
      background: isDarkMode ? "#1f2937" : "#f3f4f6",
      border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db"
    }}>
      <h3 style={{ fontSize: 14, marginBottom: 16, textAlign: "center", fontWeight: "bold", color: isDarkMode ? "#fff" : "#000" }}>ご利用を開始する</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          onClick={signInWithGoogle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px",
            background: isDarkMode ? "#111827" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          Googleでログイン
        </button>

        <div style={{ display: "flex", alignItems: "center", margin: "8px 0" }}>
          <div style={{ flex: 1, height: "1px", background: isDarkMode ? "#374151" : "#ccc" }} />
          <span style={{ padding: "0 10px", fontSize: 11, color: "#888" }}>または</span>
          <div style={{ flex: 1, height: "1px", background: isDarkMode ? "#374151" : "#ccc" }} />
        </div>

        <button
          onClick={startAsGuest}
          style={{
            padding: "12px",
            background: isDarkMode ? "#374151" : "#fff",
            color: isDarkMode ? "#fff" : "#4b5563",
            border: isDarkMode ? "1px solid #4b5563" : "1px solid #d1d5db",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: 14,
          }}
        >
          ゲストとして利用を開始
        </button>
      </div>

      {error && <div style={{ color: "#ef4444", fontSize: 12, marginTop: 12, textAlign: "center" }}>{error}</div>}
    </div>
  );
}
