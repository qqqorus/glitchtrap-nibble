import type { Metadata } from "next";
import { Providers } from "./providers";
import { Rubik_Glitch, VT323, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const rubikGlitch = Rubik_Glitch({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-rubik-glitch",
});

const vt = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-vt",
});

const ibm = IBM_Plex_Sans({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-ibm",
});

export const metadata: Metadata = {
  title: "GlitchTrap — Benefits Portal",
  description: "Agent-resistant benefits distribution",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${ibm.variable} ${rubikGlitch.variable} ${vt.variable} font-sans bg-bg-base text-text-primary antialiased`}
      >
        <div className="checker-flat" aria-hidden />
        <div className="checker-floor" aria-hidden />
        <div className="vignette" aria-hidden />

        <main className="relative z-10 min-h-screen">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  );
}