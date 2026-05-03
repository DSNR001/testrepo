import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "QuickHSN.in — HSN Code Lookup",
  description: "Fast, accurate HSN code lookup for GST. Find HSN codes and descriptions instantly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased font-sans bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-surface-100">
        {children}
      </body>
    </html>
  );
}
