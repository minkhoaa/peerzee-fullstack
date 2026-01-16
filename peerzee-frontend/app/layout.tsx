import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import QueryProvider from "@/components/QueryProvider";
import { MatchProvider } from "@/components/MatchProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Peerzee - Connect with Peers",
  description: "Real-time messaging platform to connect with peers instantly",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <QueryProvider>
          <ThemeProvider>
            <MatchProvider>
              {children}
            </MatchProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
