import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";
import { AuthProvider } from "@/lib/auth/context";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

import { Footer, Header, ContactPopup } from "@/components/layout";
import "@/styles/swiper-custom.css";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import "swiper/css/pagination";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BreadTransRoll",
  description: "English Learning Platform",
  icons: {
    icon: "/assets/images/icon.png",
  },
  other: {
    google: "notranslate",
    translate: "no",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi-VN" className="notranslate no-translate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
        <meta name="translate" content="no" />
        <meta httpEquiv="Content-Language" content="vi-VN" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900 notranslate`}
      >
        <ReactQueryProvider>
          <NextAuthProvider>
            <AuthProvider>
              <Header />

              <main className="bg-gradient-to-br from-border via-background to-border">
                {children}
              </main>
              <Footer />
              <ContactPopup />
              <Toaster position="bottom-left" />
            </AuthProvider>
          </NextAuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
