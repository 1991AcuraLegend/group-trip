import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ServerInit } from "@/components/ServerInit";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-sans" });
const dmSerif = DM_Serif_Display({ weight: "400", subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "TravelPlanner",
  description: "Plan your trips collaboratively",
};

// Inline script prevents flash of Coastal theme when Y2K is stored in localStorage.
// Theme is keyed by user ID so it is isolated per user.
// Must run synchronously before first paint.
//
// What this does:
//  1. Reads the NextAuth JWT session cookie (works on both HTTP and HTTPS).
//  2. Decodes the JWT payload (no signature verification — acceptable here because
//     we are only reading a non-sensitive UI preference; the actual session is still
//     validated server-side by NextAuth on every request).
//  3. Looks up `theme:<userId>` in localStorage and applies the data-theme attribute.
//  If no session cookie is present, nothing is applied and the default (coastal) theme is used.
const themeInitScript = `(function(){` +
  `try{` +
    // Match both the plain and __Secure- prefixed cookie names (HTTP vs HTTPS)
    `var m=document.cookie.match(/(?:^|;\\s*)(?:__Secure-)?next-auth\\.session-token=([^;]+)/);` +
    `if(!m)return;` +
    `var p=decodeURIComponent(m[1]).split('.');` +
    `if(p.length<2)return;` +
    // Decode base64url → base64 (pad to a multiple of 4)
    `var b=p[1].replace(/-/g,'+').replace(/_/g,'/');` +
    `b+='=='.slice(0,(4-b.length%4)%4);` +
    `var j=JSON.parse(atob(b));` +
    `var id=j.id||j.sub;` +
    `if(!id)return;` +
    `var t=localStorage.getItem('theme:'+id);` +
    `if(t==='y2k'||t==='coastal'){document.documentElement.setAttribute('data-theme',t);}` +
  `}catch(e){}` +
`})();`;

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
        <ServerInit />
        <AuthProvider>
          <ThemeProvider>
            <QueryProvider>{children}</QueryProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
