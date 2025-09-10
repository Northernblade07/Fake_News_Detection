import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: {
    default: "SatyaShield",
    template: "%s | SatyaShield", // page title will auto-append brand
  },
  description: "AI-Powered Fake News Detection Platform with advanced NLP and AI to identify misinformation in text, video, audio, and images.",
  keywords: [
    "fake news detection",
    "AI news checker",
    "fact verification",
    "misinformation detection",
    "SatyaShield",
    "AI-powered fact checker",
  ],
  authors: [{ name: "Your Name", url: "https://satyashield.com" }],
  creator: "SatyaShield Team",
  publisher: "SatyaShield",

  openGraph: {
    title: "SatyaShield - AI-Powered Fake News Detection",
    description: "Combat misinformation with SatyaShield, an advanced AI-driven platform to detect fake news in multiple formats.",
    url: "https://satyashield.com",
    siteName: "SatyaShield",
    images: [
      {
        url: "/og-image.png", // add this in public/
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
}
,
  },

  alternates: {
    canonical: "https://satyashield.com",
  },

  category: "AI Fake News Detection",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900`}
      >
        {children}
      </body>
    </html>
  );
}
