import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Provider from "./providers";
import LayoutWrapper from "../components/LayoutWrapper";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginTracker from "@/components/LoginTracker";

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
    icon: '/image/final_logo-removebg-preview.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `,
          }}
        />
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
      </body>
    </html>
  );
}
