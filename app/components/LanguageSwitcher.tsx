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
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 10px",
                background: isDarkMode ? "#374151" : "rgba(255, 255, 255, 0.9)",
                border: `1px solid ${isDarkMode ? "#4b5563" : "#d1d5db"}`,
                borderRadius: "20px",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "bold",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                transition: "all 0.2s ease",
                color: isDarkMode ? "#fff" : "#374151"
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDarkMode ? "#4b5563" : "#d1d5db";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <span style={{ fontSize: "16px" }}>
                {locale === "ja" ? "🇯🇵" : "🇺🇸"}
            </span>
            <span>{locale === "ja" ? "日本語" : "English"}</span>
        </button>
    );
}
