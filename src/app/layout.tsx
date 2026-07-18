import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SecurityGuard } from "@/components/security/security-guard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "TrackFlow | Premium Shipment Tracking",
    template: "%s | TrackFlow",
  },
  description: "Advanced, real-time shipment tracking for all major couriers worldwide. The future of package delivery visibility.",
  keywords: ["tracking", "shipment", "package", "courier", "delivery", "logistics"],
  authors: [{ name: "TrackFlow Team" }],
  creator: "TrackFlow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://trackflow.app",
    title: "TrackFlow | Premium Shipment Tracking",
    description: "Advanced, real-time shipment tracking for all major couriers worldwide.",
    siteName: "TrackFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "TrackFlow | Premium Shipment Tracking",
    description: "Advanced, real-time shipment tracking for all major couriers worldwide.",
    creator: "@trackflow",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#030303",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${outfit.variable} antialiased min-h-screen flex flex-col font-sans bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SecurityGuard />
          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1 flex flex-col">{children}</main>
            <Footer />
          </div>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
