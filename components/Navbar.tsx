"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Tv, Heart, Radio } from 'lucide-react';

interface NavbarProps {
  isAbsolute?: boolean;
}

export default function Navbar({ isAbsolute = true }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className={`w-full z-50 flex items-center justify-between p-6 md:px-16 transition-all duration-300 ${
      isAbsolute 
        ? 'absolute top-0 bg-gradient-to-b from-black/90 to-transparent' 
        : 'relative bg-[var(--color-blue-deep)] border-b border-white/5 shadow-2xl'
    }`}>
      {/* Brand logo */}
      <Link href="/" className="text-2xl font-bold tracking-tighter text-white uppercase hover:text-[var(--color-neon)] transition font-outfit">
        A N T I G R A V I T Y
      </Link>

      {/* Navigation links */}
      <div className="flex items-center gap-6 text-sm font-semibold">
        <Link 
          href="/" 
          className={`flex items-center gap-1.5 transition drop-shadow-md hover:text-[var(--color-neon)] ${
            pathname === '/' ? 'text-[var(--color-neon)] font-bold' : 'text-white/80'
          }`}
        >
          <Film size={16} />
          <span className="hidden md:inline">FILMS & SÉRIES</span>
        </Link>

        <Link 
          href="/live" 
          className={`flex items-center gap-1.5 transition drop-shadow-md hover:text-[var(--color-neon)] relative ${
            pathname === '/live' ? 'text-[var(--color-neon)] font-bold' : 'text-white/80'
          }`}
        >
          <Radio size={16} className={pathname === '/live' ? 'animate-pulse text-red-500' : 'text-red-400'} />
          <span className="hidden md:inline">EN DIRECT</span>
          <span className="absolute -top-2 -right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </Link>

        <button className="flex items-center gap-1.5 text-white/80 hover:text-[var(--color-neon)] transition drop-shadow-md cursor-pointer">
          <Heart size={16} />
          <span className="hidden md:inline">MA LISTE</span>
        </button>

        {/* Profile Avatar */}
        <div className="w-8 h-8 rounded-full bg-[var(--color-neon)]/20 border border-[var(--color-neon)]/50 cursor-pointer hover:bg-[var(--color-neon)]/40 transition flex items-center justify-center text-xs font-bold text-[var(--color-neon)]">
          AG
        </div>
      </div>
    </nav>
  );
}
