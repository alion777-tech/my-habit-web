import type { UserProfile } from "@/types/appTypes";

const UI = {
  radius: 8,
  radiusCard: 12,
  font: 14,      // 13にするとタブ寄り、14は少し読みやすい
  label: 13,
  pad: 12,       // 入力の高さ（大きくしたいなら 14）
  btnPad: 14,    // 保存ボタンの高さ
};


type Props = {
  uid: string | null;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSave: () => Promise<void>;
  isDarkMode?: boolean;
};

export default function ProfileView({ uid, profile, setProfile, onSave, isDarkMode = false }: Props) {
  return (
    <div
      style={{
        padding: "20px 16px",
        background: isDarkMode ? "#1f2937" : "#f9f9f9",
        borderRadius: UI.radiusCard,
        marginTop: 12,
        border: isDarkMode ? "1px solid #374151" : "1px solid #eee",
      }}
    >
      <h2 style={{ fontSize: 20, marginBottom: 20, color: isDarkMode ? "#fff" : "#000" }}>👤 プロフィール設定</h2>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 6, color: isDarkMode ? "#d1d5db" : "#4b5563" }}>名前 <span style={{ color: "#ef4444" }}>* 必須</span></label>
        <input
          placeholder="名前"
          value={profile.name}
          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          style={{
            width: "100%",
            padding: UI.pad,
            borderRadius: UI.radius,
            border: isDarkMode ? "1px solid #4b5563" : "1px solid #ccc",
            background: isDarkMode ? "#374151" : "#fff",
            color: isDarkMode ? "#fff" : "#000",
            fontSize: UI.font,
          }}

        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 13, marginBottom: 8, color: isDarkMode ? "#d1d5db" : "#4b5563" }}>性別</label>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setProfile({ ...profile, gender: "male" })}
            style={{
              flex: 1,
              padding: UI.pad,
              borderRadius: UI.radius,
              fontSize: UI.font,
              border: profile.gender === "male"
                ? `2px solid ${isDarkMode ? "#60a5fa" : "#3b82f6"}`
                : `1px solid ${isDarkMode ? "#4b5563" : "#ddd"}`,
              background: profile.gender === "male"
                ? (isDarkMode ? "#1e3a8a" : "#eff6ff")
                : (isDarkMode ? "#374151" : "#fff"),
              color: profile.gender === "male"
                ? (isDarkMode ? "#fff" : "#1e40af")
                : (isDarkMode ? "#9ca3af" : "#4b5563"),
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.2s"
            }}
          >
            ♂ 男性
          </button>
          <button
            onClick={() => setProfile({ ...profile, gender: "female" })}
            style={{
              flex: 1,
              padding: UI.pad,
              borderRadius: UI.radius,
              fontSize: UI.font,
              border: profile.gender === "female"
                ? `2px solid ${isDarkMode ? "#f472b6" : "#f472b6"}`
                : `1px solid ${isDarkMode ? "#4b5563" : "#ddd"}`,
              background: profile.gender === "female"
                ? (isDarkMode ? "#831843" : "#fff1f2")
                : (isDarkMode ? "#374151" : "#fff"),
              color: profile.gender === "female"
                ? (isDarkMode ? "#fff" : "#9d174d")
                : (isDarkMode ? "#9ca3af" : "#4b5563"),
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.2s"
            }}
          >
            ♀ 女性
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 14,
          cursor: "pointer",
          marginBottom: 12,
          color: isDarkMode ? "#fff" : "#000"
        }}>
          <input
            type="checkbox"
            checked={profile.isPublic}
            onChange={(e) => setProfile({ ...profile, isPublic: e.target.checked })}
          />
          プロフィールを公開する（検索に表示）
        </label>

        {profile.isPublic && (
          <div style={{
            marginLeft: 24,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            padding: UI.pad,
            background: isDarkMode ? "#111827" : "#fff",
            borderRadius: UI.radius,
            border: isDarkMode ? "1px solid #374151" : "1px solid #eee"
          }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
              <input
                type="checkbox"
                checked={profile.showDream}
                onChange={(e) => setProfile({ ...profile, showDream: e.target.checked })}
              />
              私の夢を公開する
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
              <input
                type="checkbox"
                checked={profile.showGoal}
                onChange={(e) => setProfile({ ...profile, showGoal: e.target.checked })}
              />
              現在の目標を公開する
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", color: isDarkMode ? "#d1d5db" : "#4b5563" }}>
              <input
                type="checkbox"
                checked={profile.showLastLogin}
                onChange={(e) => setProfile({ ...profile, showLastLogin: e.target.checked })}
              />
              最終ログイン日時を公開する
            </label>
          </div>
        )}
      </div>

      <button
        onClick={async () => {
          if (!uid) return;
          await onSave();
        }}
        style={{
          padding: UI.btnPad,
          borderRadius: UI.radius,
          border: "none",
          background: isDarkMode ? "#6366f1" : "#4f46e5",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
          width: "100%",
          fontSize: UI.font,
          boxShadow: isDarkMode ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)" : "none"
        }}
      >
        設定を保存
      </button>

      <div style={{ marginTop: 24, fontSize: 12, color: isDarkMode ? "#6b7280" : "#9ca3af", textAlign: "center" }}>
        最終ログイン: {profile.lastLoginAt?.toDate ? profile.lastLoginAt.toDate().toLocaleString() : "---"}
      </div>
    </div>
  );
}
