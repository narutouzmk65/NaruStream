"use client";

import { Play } from 'lucide-react';
import Link from 'next/link';

interface Film {
  id: string;
  title: string;
  poster_url: string;
  trailer_url?: string;
  description?: string;
}

interface FilmCardProps {
  film: Film;
  onHover?: (film: Film) => void;
}

export default function FilmCard({ film, onHover }: FilmCardProps) {
  return (
    <div 
      className="group relative cinematic-hover rounded-md overflow-hidden cursor-pointer aspect-[2/3] w-full bg-blue-deep border border-white/5"
      onMouseEnter={() => onHover && onHover(film)}
    >
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
        style={{ backgroundImage: `url(${film.poster_url || '/missing.jpg'})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F2E]/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
        <h3 className="text-white font-bold text-sm md:text-base mb-2 drop-shadow-md line-clamp-2">{film.title}</h3>
        <Link href={`/film/${film.id}`} className="flex items-center justify-center gap-2 w-full py-2 bg-neon/80 hover:bg-neon text-white text-xs font-bold rounded-sm transition-colors">
          <Play size={14} fill="currentColor" />
          <span>Lecture</span>
        </Link>
      </div>
    </div>
  );
}
