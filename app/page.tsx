"use client";

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import HeroPlayer from '@/components/films/HeroPlayer';
import FilmCard from '@/components/films/FilmCard';
import { createClient } from '@/utils/supabase/client';

export default function Home() {
  const [films, setFilms] = useState<any[]>([]);
  const [activeFilm, setActiveFilm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchFilms() {
      // Récupération en temps réel des films Supabase
      const { data, error } = await supabase
        .from('films')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setFilms(data);
        setActiveFilm(data[0]); // Le premier film est la star de la Hero par défaut
      }
      setLoading(false);
    }
    fetchFilms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F2E] text-white">
        <div className="animate-pulse text-2xl font-bold uppercase tracking-widest text-[#60A5FA]">Chargement des bobines...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-blue-deep)] flex flex-col">
      {/* Navbar Immersive Transparente */}
      <Navbar isAbsolute={true} />

      {/* Hero Section (Lecteur Vidéo Dynamique) */}
      {activeFilm ? (
        <HeroPlayer film={activeFilm} />
      ) : (
        <div className="w-full h-[70vh] flex flex-col gap-4 items-center justify-center text-white/50">
          <p className="text-xl">Aucun film détecté.</p>
          <p className="text-sm">Veuillez d'abord en ajouter depuis le dashboard admin.</p>
        </div>
      )}

      {/* Grille Pédagogique (Catalogue) */}
      <div className="px-6 md:px-16 -mt-20 md:-mt-32 relative z-30 pb-20">
        <h2 className="text-2xl font-bold uppercase text-white mb-6 drop-shadow-lg tracking-wide">
          Populaire en ce moment
        </h2>
        
        {/* Carousel Horizontal */}
        <div className="flex gap-4 overflow-x-auto pb-8 snap-x scroll-smooth 
                        scrollbar-thin scrollbar-thumb-neon/30 scrollbar-track-transparent">
          {films.map((film) => (
            <div key={film.id} className="min-w-[150px] md:min-w-[220px] snap-start">
              <FilmCard 
                film={film} 
                onHover={(f) => setActiveFilm(f)} 
              />
            </div>
          ))}

          {/* Fallbacks visuels si DB vide */}
          {films.length === 0 && (
             <div className="min-w-[220px] h-[330px] rounded-md border border-dashed border-white/20 flex flex-col items-center justify-center text-white/30 text-xs text-center p-4">
               <div>Base de données vide.</div>
               <div className="mt-2 text-[#60A5FA]">Insérez des films sur Supabase.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
