"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import HeroPlayer from '@/components/films/HeroPlayer';
import FilmCard from '@/components/films/FilmCard';
import { createClient } from '@/utils/supabase/client';
import { Radio, Tv, ArrowRight } from 'lucide-react';

export default function Home() {
  const [films, setFilms] = useState<any[]>([]);
  const [activeFilm, setActiveFilm] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchFilms() {
      const { data } = await supabase
        .from('films')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setFilms(data);
        setActiveFilm(data[0]);
      }
      setLoading(false);
    }
    fetchFilms();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0F2E] text-white">
        <div className="animate-pulse text-2xl font-bold uppercase tracking-widest text-[#60A5FA]">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-blue-deep)] flex flex-col">
      <Navbar isAbsolute={true} />

      {/* Hero Section */}
      {activeFilm ? (
        <HeroPlayer film={activeFilm} />
      ) : (
        <div className="w-full h-[70vh] flex flex-col gap-4 items-center justify-center text-white/50">
          <p className="text-xl">Aucun film détecté.</p>
          <p className="text-sm">Veuillez d&apos;abord en ajouter depuis le dashboard admin.</p>
        </div>
      )}

      {/* === LIVE TV SECTION === */}
      <div className="px-6 md:px-16 relative z-30 mt-8 mb-2">
        <div className="p-6 md:p-8 rounded-3xl border border-red-500/20 bg-gradient-to-br from-red-950/40 via-[#0A0F2E]/90 to-[#0D1B5E]/60 backdrop-blur-md shadow-[0_0_50px_rgba(239,68,68,0.08)]">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Radio size={10} className="animate-pulse" /> EN DIRECT
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-neon)] bg-[var(--color-neon)]/10 border border-[var(--color-neon)]/20 px-2.5 py-1 rounded-full">
                  TNT PREMIUM
                </span>
              </div>
              <h2 className="text-white font-bold text-xl md:text-2xl font-outfit tracking-wide flex items-center gap-2">
                <Tv size={22} className="text-red-400" />
                Vos Chaînes TNT &amp; IPTV
              </h2>
              <p className="text-gray-400 text-xs md:text-sm mt-1 font-medium">
                Cliquez sur une chaîne pour lancer le direct instantanément ou importer votre playlist IPTV.
              </p>
            </div>
            
            <Link 
              href="/live" 
              className="self-start md:self-auto flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-red-900/30 hover:scale-105"
            >
              Player IPTV Complet <ArrowRight size={14} />
            </Link>
          </div>

          {/* TNT Buttons Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-3">
            {[
              { id: 'tf1', title: 'TF1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/sixty/TF1_logo_2013.svg/200px-TF1_logo_2013.svg.png' },
              { id: 'france2', title: 'France 2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/France_2_logo_2008.svg/200px-France_2_logo_2008.svg.png' },
              { id: 'france3', title: 'France 3', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/France_3_logo_2008.svg/200px-France_3_logo_2008.svg.png' },
              { id: 'france4', title: 'France 4', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/France_4_2014.svg/200px-France_4_2014.svg.png' },
              { id: 'france5', title: 'France 5', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/France_5_logo_2002.svg/200px-France_5_logo_2002.svg.png' },
              { id: 'm6', title: 'M6', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M6_logo_2010.svg/200px-M6_logo_2010.svg.png' },
              { id: 'arte', title: 'Arte', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Arte_Logo_2019.svg/200px-Arte_Logo_2019.svg.png' },
              { id: 'c8', title: 'C8', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/C8_channel_logo.svg/200px-C8_channel_logo.svg.png' },
              { id: 'w9', title: 'W9', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/W9_logo_2012.svg/200px-W9_logo_2012.svg.png' },
              { id: 'tmc', title: 'TMC', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/TMC_TV_logo.svg/200px-TMC_TV_logo.svg.png' },
              { id: 'tfx', title: 'TFX', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/TFX_logo.svg/200px-TFX_logo.svg.png' },
              { id: 'lequipe', title: "L'Équipe", logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/L%27%C3%89quipe_logo.svg/200px-L%27%C3%89quipe_logo.svg.png' },
            ].map((channel) => (
              <Link
                key={channel.id}
                href={`/live?channel=${channel.id}`}
                className="group flex flex-col items-center justify-center p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-[var(--color-neon)]/50 hover:bg-white/5 transition-all duration-200 aspect-square text-center shadow-lg hover:shadow-[var(--color-neon)]/10 hover:scale-105"
              >
                <div className="w-10 h-10 flex items-center justify-center mb-1">
                  <img
                    src={channel.logo}
                    alt={channel.title}
                    className="w-full h-full object-contain transition-opacity group-hover:opacity-100 opacity-80"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <span className="text-[10px] font-bold tracking-wider text-gray-400 group-hover:text-white uppercase transition-colors truncate w-full">
                  {channel.title}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Grille Catalogue VOD */}
      <div className="px-6 md:px-16 mt-8 relative z-30 pb-20">
        <h2 className="text-2xl font-bold uppercase text-white mb-6 drop-shadow-lg tracking-wide">
          Populaire en ce moment
        </h2>

        <div className="flex gap-4 overflow-x-auto pb-8 snap-x scroll-smooth scrollbar-thin scrollbar-thumb-neon/30 scrollbar-track-transparent">
          {films.map((film) => (
            <div key={film.id} className="min-w-[150px] md:min-w-[220px] snap-start">
              <FilmCard film={film} onHover={(f) => setActiveFilm(f)} />
            </div>
          ))}

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
