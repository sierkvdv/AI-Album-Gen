import './globals.css';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });

/**
 * Root layout for the application. Wraps all pages with the
 * SessionProvider so that authentication state can be accessed
 * throughout the component tree. Applies a simple font family and
 * sets up the HTML structure.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className + ' bg-gray-50 text-gray-900 min-h-screen'}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}