"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/routing";

export default function LanguageSwitcher({ isDarkMode = false }: { isDarkMode?: boolean }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const toggleLanguage = () => {
        const nextLocale = locale === "ja" ? "en" : "ja";
        router.replace(pathname, { locale: nextLocale });
    };

    return (
        <button
            onClick={toggleLanguage}
            style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: isDarkMode ? "1px solid #4b5563" : "1px solid #e2e8f0",
                background: isDarkMode ? "#374151" : "#f8fafc",
                color: isDarkMode ? "#f3f4f6" : "#475569",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s ease",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? "#4b5563" : "#f1f5f9";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? "#374151" : "#f8fafc";
            }}
        >
            <span style={{ fontSize: "14px" }}>{locale === "ja" ? "🇯🇵" : "🇺🇸"}</span>
            {locale === "ja" ? "日本語" : "English"}
        </button>
    );
}
