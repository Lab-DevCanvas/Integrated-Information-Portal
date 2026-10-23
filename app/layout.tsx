import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";
import { ThemeEffect } from "@/components/layout/ThemeEffect";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "기회탐색 - AI 기회 탐색 플랫폼",
  description: "나에게 맞는 공모전, 채용, 지원금, 주거 정보를 AI가 찾아서 추천해드립니다.",
  icons: {
    icon: [
      { url: "/assets/logo/logo.svg", type: "image/svg+xml" },
      { url: "/assets/logo/logo.png", type: "image/png" },
    ],
    shortcut: "/assets/logo/logo.png",
    apple: "/assets/logo/logo.png",
  },
};

// Reads the same localStorage key Zustand persist writes to, and applies the `dark`
// class before first paint so there is no light-mode flash for OS-dark-mode users.
const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem('aiop-storage');var theme='system';if(raw){var parsed=JSON.parse(raw);if(parsed&&parsed.state&&parsed.state.theme){theme=parsed.state.themeManuallySet?parsed.state.theme:'system';}}var isDark=theme==='dark'||(theme==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(isDark)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <ThemeEffect />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
