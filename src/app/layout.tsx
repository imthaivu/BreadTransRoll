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
  title: "BreadTrans",
  description: "Hệ thống quản lý học sinh, phụ huynh, giáo viên",
  icons: {
    icon: "/assets/images/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`relative ${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
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
