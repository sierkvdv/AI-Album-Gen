import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "@/components/Providers";
import type { ReactNode } from "react";

const inter = Inter({ subsets: ["latin"] });

/**
 * Root layout for the application.
 *
 * Applies a global font and wraps all pages in the SessionProvider via
 * the Providers component.  This component is rendered once and persists
 * between page navigations.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}