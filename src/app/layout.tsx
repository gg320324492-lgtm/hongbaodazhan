import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "双人接红包",
  description: "双人接红包游戏 - 本地同屏 / 联网对战",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
