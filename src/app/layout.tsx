import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import Provider from "./providers";
import LayoutWrapper from "../components/LayoutWrapper";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginTracker from "@/components/LoginTracker";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.fluenzyai.app"),
  title: "FluenzyAI: AI Interview Coach & English Practice",
  description: "Master AI-powered interview preparation and English fluency training with FluenzyAI. Practice HR interviews, technical questions, group discussions, and spoken English to boost your career success.",
  keywords: "AI interview practice, AI interview coach, English speaking practice with AI, mock interview AI, group discussion AI, HR interview preparation, technical interview practice, spoken English for jobs, interview preparation platform",
  authors: [{ name: "FluenzyAI" }],
  creator: "FluenzyAI",
  publisher: "FluenzyAI",
  openGraph: {
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform. Practice HR interviews, technical questions, and group discussions for career success.",
    url: "https://www.fluenzyai.app",
    siteName: "FluenzyAI",
    images: [
      {
        url: "https://www.fluenzyai.app/og-image.jpg", // Placeholder, replace with actual
        width: 1200,
        height: 630,
        alt: "FluenzyAI - AI-Powered Interview and English Training",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FluenzyAI: AI Interview Coach & English Practice",
    description: "Enhance your interview skills and English fluency with FluenzyAI's AI-powered platform.",
    images: ["https://www.fluenzyai.app/og-image.jpg"],
    creator: "@FluenzyAI", // Placeholder
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
  verification: {
    google: "your-google-site-verification-code", // Replace with actual
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon & PWA Meta Tags */}
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FluenzyAI" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Razorpay Checkout Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "FluenzyAI",
              "url": "https://www.fluenzyai.app",
              "description": "AI-powered interview preparation and English speaking platform",
              "publisher": {
                "@type": "Organization",
                "name": "FluenzyAI"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "FluenzyAI",
              "url": "https://www.fluenzyai.app",
              "logo": "https://www.fluenzyai.app/image/final_logo-removebg-preview.png",
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "email": "support@fluenzyai.app"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "FluenzyAI",
              "applicationCategory": "EducationalApplication",
              "operatingSystem": "Web",
              "description": "AI-powered platform for interview preparation and English fluency training",
              "url": "https://www.fluenzyai.app",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "FluenzyAI"
              }
            })
          }}
        />
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        {/* Theme initialization script to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('fluenzy-theme') || 'dark';
                  var actualTheme = theme;
                  if (theme === 'system') {
                    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(actualTheme);
                  document.documentElement.setAttribute('data-theme', actualTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
        <PWARegister />
        <ThemeProvider>
          <Provider>
            <LoginTracker />
            <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </Suspense>
          </Provider>
        </ThemeProvider>
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID!} />
      </body>
    </html>
  );
}
