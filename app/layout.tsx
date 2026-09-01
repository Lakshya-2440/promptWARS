import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/lib/context/AppContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AiAssistantDrawer } from "@/components/AiAssistantDrawer";
import { AuthModal } from "@/components/AuthModal";
import { MyDataModal } from "@/components/MyDataModal";
import { ToastContainer } from "@/components/Toast";

export const metadata: Metadata = {
  title: "Jan Ganana AI — Digital Census 2027 Citizen Companion",
  description:
    "India's 16th Census is 100% digital. Explore state-wise dates, practice self-enumeration in 16 languages with your AI Sathi, and verify suspicious messages safely.",
  manifest: "/manifest.json",
  authors: [{ name: "Jan Ganana AI Team" }],
  keywords: [
    "Census 2027",
    "Digital Census India",
    "Self-Enumeration",
    "House Listing Census",
    "Caste Census 2027",
    "ORGI",
    "Jan Ganana AI",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A1128",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="jaali-bg antialiased min-h-screen flex flex-col selection:bg-saffron-500 selection:text-navy-950">
        <AppProvider>
          <Navbar />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <AiAssistantDrawer />
          <AuthModal />
          <MyDataModal />
          <ToastContainer />
        </AppProvider>
      </body>
    </html>
  );
}
