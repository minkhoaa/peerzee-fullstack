import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { ThemeProvider } from "@/lib/theme";
import QueryProvider from "@/components/QueryProvider";
import { MatchProvider } from "@/components/MatchProvider";
import WingmanWrapper from "@/components/WingmanWrapper";
import "./globals.css";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
});

export const metadata: Metadata = {
  title: "Peerzee",
  description: "Connect with peers in 8-bit style",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link 
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;700;800&family=VT323&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className={`${nunito.variable} font-body antialiased bg-retro-bg text-cocoa min-h-screen`}>
        <QueryProvider>
          <ThemeProvider>
            <MatchProvider>
              {children}
              <WingmanWrapper />
            </MatchProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
