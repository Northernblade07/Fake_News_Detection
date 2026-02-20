// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BackgroundFX from "../components/BackgroundFX";
import Navbar from "../components/Navbar";
// app/layout.tsx (fixed imports)
import { NextIntlClientProvider } from "next-intl";
// next-intl (no URL prefix; locale comes from cookie via getRequestConfig)
import { getMessages, getLocale } from "next-intl/server";
import Providers from "./provider";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
metadataBase: new URL("http://localhost:3000"), // Change to your actual domain when deployed
  title: {
    default: "SatyaShield",
    template: "%s | SatyaShield",
  },
  description:
    "AI-Powered Fake News Detection Platform with advanced NLP and AI to identify misinformation in text, video, audio, and images.",
    manifest:"/manifest.json",
  keywords: [
    "fake news detection",
    "AI news checker",
    "fact verification",
    "misinformation detection",
    "SatyaShield",
    "AI-powered fact checker",
  ],
  authors: [{ name: "Prashant Bhandari", url: "https://satyashield.com" }],
  creator: "SatyaShield Team",
  publisher: "SatyaShield",
  openGraph: {
    title: "SatyaShield - AI-Powered Fake News Detection",
    description:
      "Combat misinformation with SatyaShield, an advanced AI-driven platform to detect fake news in multiple formats.",
    url: "https://satyashield.com",
    siteName: "SatyaShield",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SatyaShield Fake News Detection",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SatyaShield - AI Fake News Detection",
    description: "AI-powered platform to detect and prevent fake news in real-time.",
    images: ["/og-image.png"],
    creator: "@yourTwitterHandle",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://satyashield.com",
  },
  category: "AI Fake News Detection",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Read resolved locale and messages for this request (from cookie-backed config)
  const locale = await getLocale(); // e.g., "en", "hi", ... [3]
  const messages = await getMessages(); // JSON loaded per the request config [3]

  return (
    <html lang={locale}>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          "antialiased min-h-dvh text-slate-100",
          // Metallic dark gradient stack + vignette + subtle texture
          "bg-[radial-gradient(1200px_800px_at_85%_-15%,rgba(96,165,250,0.12),transparent_55%),radial-gradient(1000px_700px_at_-10%_110%,rgba(251,146,60,0.10),transparent_55%),linear-gradient(180deg,#0b0f1a_0%,#0b0f1a_30%,#0a0e19_100%)]",
          "before:pointer-events-none before:fixed before:inset-0 before:bg-[radial-gradient(900px_400px_at_50%_-10%,rgba(255,255,255,0.05),transparent_60%)] before:opacity-70",
        ].join(" ")}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
         <Providers>
          <Navbar />
          <BackgroundFX />
          {children}
         </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
