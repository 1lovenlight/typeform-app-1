import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  // Enable OpenType features for single-story 'a' and other alternates
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "RH Study",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${inter.variable} font-sans antialiased h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <main className="h-full">{children}</main>
          <Toaster position="bottom-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
