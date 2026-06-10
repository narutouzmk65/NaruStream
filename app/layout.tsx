import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Antigravity | VOD Premium',
  description: 'Plateforme de streaming cinématographique ultra moderne.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.className} bg-blue-deep text-white min-h-screen antialiased flex flex-col`}>
        {/* Navbar ici plus tard */}
        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
