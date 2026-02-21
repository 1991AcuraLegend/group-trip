import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "TravelPlanner",
  description: "Plan your trips collaboratively",
};

// Inline script prevents flash of Coastal theme when Y2K is stored in localStorage.
// Must run synchronously before first paint.
const themeInitScript = `(function(){try{var t=localStorage.getItem('theme');if(t==='y2k'||t==='coastal'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerif.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-sand-50 text-sand-800 font-sans">
        <AuthProvider>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
