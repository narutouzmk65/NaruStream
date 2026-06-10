"use client";

import { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Play, Plus } from 'lucide-react';

interface Film {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  trailer_url?: string;
}

interface HeroPlayerProps {
  film: Film;
}

export default function HeroPlayer({ film }: HeroPlayerProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isYoutube = film.trailer_url?.includes('youtube.com') || film.trailer_url?.includes('youtu.be');

  useEffect(() => {
    setIsVideoReady(false);
    if (!isYoutube && videoRef.current) {
      videoRef.current.load();
    }
    const timer = setTimeout(() => setIsVideoReady(true), 500);
    return () => clearTimeout(timer);
  }, [film.trailer_url, isYoutube]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  return (
    <div className="relative w-full h-[70vh] md:h-[85vh] overflow-hidden bg-[#000] group">
      {/* 1. Affichage de secours (Si pas de trailer ou chargement) */}
      <div 
        className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat opacity-60 transition-opacity duration-500"
        style={{ backgroundImage: `url(${film.poster_url || '/missing.jpg'})` }}
      />

      {/* 2. Affichage Vidéo HD */}
      {film.trailer_url && (
         <div className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
          {isYoutube ? (
             <iframe
              className="w-full h-[150%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
              src={`https://www.youtube.com/embed/${film.trailer_url.split('v=')[1]?.split('&')[0] || film.trailer_url.split('/').pop()}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${film.trailer_url.split('v=')[1]?.split('&')[0] || film.trailer_url.split('/').pop()}`}
              allow="autoplay; encrypted-media"
              frameBorder="0"
            />
          ) : (
             <video 
              ref={videoRef}
              autoPlay 
              muted={isMuted} 
              loop 
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            >
              <source src={film.trailer_url} type="video/mp4" />
            </video>
          )}
        </div>
      )}

      {/* Gradients d'obscurcissement ultra Deep Blue */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-blue-deep)] via-[var(--color-blue-deep)]/40 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-blue-deep)] via-[var(--color-blue-deep)]/60 to-transparent w-full md:w-2/3"></div>

      {/* Infos du Film */}
      <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 z-20 flex flex-col justify-end">
        <h1 className="text-4xl md:text-6xl font-bold text-white drop-shadow-2xl mb-4 font-outfit uppercase tracking-tighter">
          {film.title}
        </h1>
        <p className="text-gray-300 text-sm md:text-xl max-w-2xl mb-8 line-clamp-3 drop-shadow-md">
          {film.description}
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button className="flex items-center gap-2 bg-white text-black px-6 md:px-8 py-3 rounded-sm font-bold hover:bg-gray-200 transition-colors">
            <Play fill="currentColor" size={20} />
            <span>Regarder</span>
          </button>
          <button className="flex items-center gap-2 glass-panel text-white px-6 md:px-8 py-3 rounded-sm font-bold hover:bg-white/20 transition-colors">
            <Plus size={20} />
            <span>Ma Liste</span>
          </button>
        </div>
      </div>

      {/* Bouton Muet */}
      {film.trailer_url && (
        <button 
          onClick={toggleMute}
          className="absolute bottom-24 right-8 md:right-16 z-30 p-3 rounded-full glass-panel hover:bg-white/20 transition-colors text-white"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
      )}
    </div>
  );
}
