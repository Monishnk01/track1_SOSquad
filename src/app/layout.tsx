import type { Metadata } from "next";
import "./globals.css";
import GlobalReminder from "@/components/GlobalReminder";
import EmergencyMode from "@/components/EmergencyMode";

export const metadata: Metadata = {
  title: "Accessibility Dashboard | Sahayak",
  description: "A highly accessible web application designed to support differently-abled individuals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen flex flex-col">
        {/* Skip to main content for keyboard users */}
        <a 
          href="#main-content" 
          className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:p-4 focus:bg-background focus:text-primary focus:font-bold accessible-border m-2"
        >
          Skip to main content
        </a>
        
        <main id="main-content" className="flex-1 flex flex-col">
          {children}
        </main>
        
        <GlobalReminder />
        <EmergencyMode />
      </body>
    </html>
  );
}
