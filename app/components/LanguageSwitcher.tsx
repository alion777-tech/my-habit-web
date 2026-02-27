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
                padding: "8px 16px",
                borderRadius: "24px",
                border: isDarkMode ? "3px solid #6366f1" : "3px solid #4f46e5",
                background: isDarkMode ? "#1f2937" : "#ffffff",
                color: isDarkMode ? "#ffffff" : "#4f46e5",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s ease",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                marginBottom: "10px"
            }}
            onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? "#374151" : "#f8fafc";
            }}
            onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = isDarkMode ? "#1f2937" : "#ffffff";
            }}
        >
            <span style={{ fontSize: "14px" }}>{locale === "ja" ? "🇯🇵" : "🇺🇸"}</span>
            {locale === "ja" ? "日本語" : "English"}
        </button>
    );
}
