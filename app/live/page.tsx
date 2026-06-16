"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import IPTVPlayer from '@/components/live/IPTVPlayer';
import ChatSim from '@/components/live/ChatSim';
import { parseM3U, IPTVChannel } from '@/utils/m3uParser';
import { Tv, Search, Upload, ArrowRight, Wifi, WifiOff, Radio, X, Plus } from 'lucide-react';

// ─── Chaînes TNT françaises ───────────────────────────────────────
const TNT_CHANNELS: IPTVChannel[] = [
  {
    id: 'tf1',
    title: 'TF1',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/sixty/TF1_logo_2013.svg/200px-TF1_logo_2013.svg.png',
    group: 'TNT',
  },
  {
    id: 'france2',
    title: 'France 2',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/France_2_logo_2008.svg/200px-France_2_logo_2008.svg.png',
    group: 'TNT',
  },
  {
    id: 'france3',
    title: 'France 3',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/France_3_logo_2008.svg/200px-France_3_logo_2008.svg.png',
    group: 'TNT',
  },
  {
    id: 'france4',
    title: 'France 4',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/France_4_2014.svg/200px-France_4_2014.svg.png',
    group: 'TNT',
  },
  {
    id: 'france5',
    title: 'France 5',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/France_5_logo_2002.svg/200px-France_5_logo_2002.svg.png',
    group: 'TNT',
  },
  {
    id: 'm6',
    title: 'M6',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M6_logo_2010.svg/200px-M6_logo_2010.svg.png',
    group: 'TNT',
  },
  {
    id: 'arte',
    title: 'Arte',
    url: 'https://arteptweb-a.akamaihd.net/am/ptweb/arte_tv_world_9_q2t/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Arte_Logo_2019.svg/200px-Arte_Logo_2019.svg.png',
    group: 'TNT',
  },
  {
    id: 'c8',
    title: 'C8',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/C8_channel_logo.svg/200px-C8_channel_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'w9',
    title: 'W9',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/W9_logo_2012.svg/200px-W9_logo_2012.svg.png',
    group: 'TNT',
  },
  {
    id: 'tmc',
    title: 'TMC',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/TMC_TV_logo.svg/200px-TMC_TV_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'tfx',
    title: 'TFX',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/TFX_logo.svg/200px-TFX_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'nrj12',
    title: 'NRJ 12',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/NRJ_12_logo_2015.svg/200px-NRJ_12_logo_2015.svg.png',
    group: 'TNT',
  },
  {
    id: 'lcp',
    title: 'LCP',
    url: 'https://lcp.fr/live',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/LCP_-_Assembl%C3%A9e_nationale_logo.svg/200px-LCP_-_Assembl%C3%A9e_nationale_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'franceinfo',
    title: 'Franceinfo',
    url: 'https://simulcast.ftven.fr/france-info/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/France_info_television_logo.svg/200px-France_info_television_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'gulli',
    title: 'Gulli',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Gulli_Logo_2014.svg/200px-Gulli_Logo_2014.svg.png',
    group: 'TNT',
  },
  {
    id: 'tf1seriesfilms',
    title: 'TF1 Séries Films',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/TF1_S%C3%A9ries_Films_logo_2020.svg/200px-TF1_S%C3%A9ries_Films_logo_2020.svg.png',
    group: 'TNT',
  },
  {
    id: 'lequipe',
    title: "L'Équipe",
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/L%27%C3%89quipe_logo.svg/200px-L%27%C3%89quipe_logo.svg.png',
    group: 'TNT',
  },
  {
    id: '6ter',
    title: '6ter',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/6ter_logo.svg/200px-6ter_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'rmcstory',
    title: 'RMC Story',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/RMC_Story_logo_2018.svg/200px-RMC_Story_logo_2018.svg.png',
    group: 'TNT',
  },
  {
    id: 'rmcdecouverte',
    title: 'RMC Découverte',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/RMC_D%C3%A9couverte_logo_2018.svg/200px-RMC_D%C3%A9couverte_logo_2018.svg.png',
    group: 'TNT',
  },
  {
    id: 'cherie25',
    title: 'Chérie 25',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Ch%C3%A9rie_25_logo.svg/200px-Ch%C3%A9rie_25_logo.svg.png',
    group: 'TNT',
  },
  {
    id: 'cnews',
    title: 'CNews',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/CNews_logo_2017.svg/200px-CNews_logo_2017.svg.png',
    group: 'TNT',
  },
  {
    id: 'cstar',
    title: 'CStar',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/CStar_logo.svg/200px-CStar_logo.svg.png',
    group: 'TNT',
  },
];

// ─── Chaînes Info / Internationales ───────────────────────────────
const NEWS_CHANNELS: IPTVChannel[] = [
  {
    id: 'bfmtv',
    title: 'BFMTV',
    url: 'https://ncdn-live-bfmtv.pfd.sfr.net/shls/LIVE$BFMTV/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/BFMTV_logo_2017.svg/200px-BFMTV_logo_2017.svg.png',
    group: 'Info',
  },
  {
    id: 'f24-fr',
    title: 'France 24 FR',
    url: 'https://static.france24.com/live/F24_FR_LO/live_tv.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/France_24_Logo.svg',
    group: 'Info',
  },
  {
    id: 'f24-en',
    title: 'France 24 EN',
    url: 'https://static.france24.com/live/F24_EN_LO/live_tv.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/France_24_Logo.svg',
    group: 'Info',
  },
  {
    id: 'euronews-fr',
    title: 'Euronews FR',
    url: 'https://euronews-euronews-french-1-fr.samsung.wurl.tv/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Euronews_logo_2016.svg',
    group: 'Info',
  },
  {
    id: 'rfi',
    title: 'RFI Monde',
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Radio_France_Internationale_logo.svg/200px-Radio_France_Internationale_logo.svg.png',
    group: 'Info',
  },
  {
    id: 'aljazeera',
    title: 'Al Jazeera EN',
    url: 'https://live-hls-web-aje.getaj.net/AJE/index.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Al_Jazeera_logo.svg/200px-Al_Jazeera_logo.svg.png',
    group: 'Info',
  },
  {
    id: 'bloomberg',
    title: 'Bloomberg',
    url: 'https://bloomenglish-i.akamaihd.net/hls/live/622661/bloombergenglish/master.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Bloomberg_Television_logo.svg/200px-Bloomberg_Television_logo.svg.png',
    group: 'Info',
  },
];

// ─── Chaînes Sport / Coupe du Monde ───────────────────────────────
const SPORT_CHANNELS: IPTVChannel[] = [
  {
    id: 'wc-1',
    title: 'Coupe du Monde HD 1',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Soccer_ball_animated.gif/200px-Soccer_ball_animated.gif',
    group: 'Sport',
  },
  {
    id: 'wc-2',
    title: 'Coupe du Monde HD 2',
    url: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Soccer_ball_animated.gif/200px-Soccer_ball_animated.gif',
    group: 'Sport',
  },
  {
    id: 'equipe-live',
    title: "L'Équipe Live",
    url: '',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/L%27%C3%89quipe_logo.svg/200px-L%27%C3%89quipe_logo.svg.png',
    group: 'Sport',
  },
];

const ALL_DEFAULT_CHANNELS = [...TNT_CHANNELS, ...NEWS_CHANNELS, ...SPORT_CHANNELS];

type Category = 'TNT' | 'Info' | 'Sport' | 'Importé' | 'Tous';

export default function LivePage() {
  const [allChannels, setAllChannels] = useState<IPTVChannel[]>(ALL_DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('TNT');
  const [showImport, setShowImport] = useState(false);
  const [m3uText, setM3uText] = useState('');
  const [importedChannels, setImportedChannels] = useState<IPTVChannel[]>([]);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    let currentChannels = ALL_DEFAULT_CHANNELS;
    const saved = localStorage.getItem('ag_iptv_custom');
    if (saved) {
      try {
        const parsed: IPTVChannel[] = JSON.parse(saved);
        setImportedChannels(parsed);
        currentChannels = [...ALL_DEFAULT_CHANNELS, ...parsed];
        setAllChannels(currentChannels);
      } catch {}
    }

    // Auto-select channel from URL parameter
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    if (channelId) {
      const channel = currentChannels.find(ch => ch.id === channelId);
      if (channel) {
        setSelectedChannel(channel);
        setActiveCategory(channel.group as Category);
      }
    }
  }, []);

  const handleImport = () => {
    if (!m3uText.trim()) return;
    const parsed = parseM3U(m3uText).map(c => ({ ...c, group: c.group || 'Importé' }));
    if (!parsed.length) return alert('Aucune chaîne valide trouvée dans ce fichier M3U.');
    const merged = [...importedChannels, ...parsed];
    setImportedChannels(merged);
    setAllChannels([...ALL_DEFAULT_CHANNELS, ...merged]);
    localStorage.setItem('ag_iptv_custom', JSON.stringify(merged));
    setM3uText('');
    setShowImport(false);
    setActiveCategory('Importé');
  };

  const clearImported = () => {
    setImportedChannels([]);
    setAllChannels(ALL_DEFAULT_CHANNELS);
    localStorage.removeItem('ag_iptv_custom');
    setActiveCategory('TNT');
  };

  const filtered = allChannels.filter(ch => {
    const matchSearch = ch.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (activeCategory === 'Tous') return true;
    return ch.group === activeCategory;
  });

  const categories: Category[] = ['TNT', 'Info', 'Sport', ...(importedChannels.length ? ['Importé' as Category] : []), 'Tous'];

  const isWC = selectedChannel?.group === 'Sport';

  return (
    <div className="min-h-screen bg-[var(--color-blue-deep)] text-white flex flex-col pb-20">
      <Navbar isAbsolute={false} />

      {/* ── PLAYER + CHAT ── */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6">
        {selectedChannel ? (
          <div className="flex flex-col lg:flex-row gap-5">
            {/* Player */}
            <div className="flex-1 flex flex-col gap-0">
              {selectedChannel.url ? (
                <IPTVPlayer url={selectedChannel.url} title={selectedChannel.title} />
              ) : (
                /* Canal sans flux direct */
                <div className="relative w-full aspect-video rounded-xl bg-[#08091e] border border-white/5 flex flex-col items-center justify-center gap-4 text-center px-8 shadow-2xl">
                  {selectedChannel.logo && (
                    <img src={selectedChannel.logo} alt={selectedChannel.title} className="w-20 h-20 object-contain opacity-60 mb-2" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <WifiOff size={36} className="text-gray-600" />
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{selectedChannel.title}</h3>
                    <p className="text-gray-400 text-sm max-w-md">
                      Flux direct non disponible pour cette chaîne. Importez votre abonnement IPTV ou M3U ci-dessous pour regarder cette chaîne.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowImport(true)}
                    className="flex items-center gap-2 px-5 py-2 bg-[var(--color-neon)]/20 text-[var(--color-neon)] border border-[var(--color-neon)]/30 hover:bg-[var(--color-neon)]/30 rounded-lg text-sm font-bold transition"
                  >
                    <Upload size={14} /> Importer un fichier M3U
                  </button>
                </div>
              )}

              {/* Channel info bar */}
              <div className="flex items-center justify-between px-5 py-3 bg-[#0A1033] border border-t-0 border-white/5 rounded-b-xl">
                <div className="flex items-center gap-3">
                  {selectedChannel.logo && (
                    <div className="w-9 h-9 bg-white/5 rounded-lg border border-white/10 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                      <img src={selectedChannel.logo} alt="" className="w-full h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm text-white">{selectedChannel.title}</div>
                    <div className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                      {selectedChannel.url
                        ? <><Radio size={10} className="text-red-500 animate-pulse" /> En direct</>
                        : <><WifiOff size={10} /> Flux requis</>
                      }
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowChat(v => !v)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition border ${showChat ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-white/5 text-gray-500 border-white/10'}`}
                  >
                    Chat
                  </button>
                  <button onClick={() => setSelectedChannel(null)} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition border border-white/5">
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Chat */}
            {showChat && (
              <div className="w-full lg:w-[320px] h-[52vh] lg:h-[68vh] flex-shrink-0">
                <ChatSim channelName={selectedChannel.title} isWorldCup={isWC} />
              </div>
            )}
          </div>
        ) : (
          /* No channel selected — Hero Banner */
          <div className="w-full aspect-video max-h-[55vh] rounded-2xl bg-gradient-to-br from-[#0D1B5E] via-[#0A0F2E] to-black border border-white/5 flex flex-col items-center justify-center gap-5 text-center px-8 shadow-2xl">
            <div className="relative">
              <Tv size={64} className="text-[var(--color-neon)]/30" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold font-outfit uppercase tracking-widest text-white mb-2">TV en Direct</h1>
              <p className="text-gray-400 text-sm md:text-base max-w-md">
                Sélectionnez une chaîne ci-dessous pour commencer à regarder. Importez votre abonnement IPTV pour accéder à toutes les chaînes TNT.
              </p>
            </div>
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--color-neon)] text-black rounded-xl font-bold text-sm hover:bg-white transition"
            >
              <Plus size={16} /> Importer une Playlist IPTV
            </button>
          </div>
        )}
      </div>

      {/* ── IMPORT MODAL ── */}
      {showImport && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#080B22] border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-lg font-outfit uppercase tracking-widest flex items-center gap-2">
                <Plus size={18} className="text-[var(--color-neon)]" /> Importer une Playlist M3U
              </h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
            </div>
            <p className="text-gray-400 text-sm">
              Collez le contenu de votre fichier <code className="text-[var(--color-neon)] bg-white/5 px-1 rounded">.m3u</code> ou <code className="text-[var(--color-neon)] bg-white/5 px-1 rounded">.m3u8</code> pour charger vos chaînes IPTV personnelles.
            </p>
            <textarea
              value={m3uText}
              onChange={e => setM3uText(e.target.value)}
              rows={8}
              placeholder={"#EXTM3U\n#EXTINF:-1 tvg-logo=\"url_logo\" group-title=\"TNT\",TF1\nhttp://votre-flux-iptv.m3u8\n#EXTINF:-1,M6\nhttp://votre-flux-m6.m3u8"}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-neon)]/50 transition font-mono resize-none"
            />
            <div className="flex gap-3">
              <button
                onClick={handleImport}
                disabled={!m3uText.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-[var(--color-neon)] text-black rounded-xl font-bold text-sm hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowRight size={16} /> Charger les chaînes
              </button>
              {importedChannels.length > 0 && (
                <button onClick={clearImported} className="px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 rounded-xl text-sm font-bold transition">
                  Vider
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── CHANNEL GRID ── */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-10 space-y-5">

        {/* Header + Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold font-outfit uppercase tracking-widest text-white">Chaînes disponibles</h2>
            <p className="text-gray-500 text-xs mt-1">{filtered.length} chaîne{filtered.length > 1 ? 's' : ''} • Cliquez pour regarder</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="bg-white/5 border border-white/10 rounded-lg pl-8 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-neon)]/50 transition w-44"
              />
            </div>
            {/* Import button */}
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-neon)]/10 text-[var(--color-neon)] border border-[var(--color-neon)]/20 hover:bg-[var(--color-neon)]/20 rounded-lg text-xs font-bold transition"
            >
              <Upload size={12} /> IPTV
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all border whitespace-nowrap flex-shrink-0 ${
                activeCategory === cat
                  ? cat === 'TNT'     ? 'bg-blue-600 text-white border-blue-600'
                  : cat === 'Info'    ? 'bg-orange-500 text-white border-orange-500'
                  : cat === 'Sport'   ? 'bg-green-600 text-white border-green-600'
                  : cat === 'Importé' ? 'bg-[var(--color-neon)] text-black border-[var(--color-neon)]'
                  :                    'bg-white text-black border-white'
                  : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat === 'TNT'     && '📺 '}
              {cat === 'Info'    && '📡 '}
              {cat === 'Sport'   && '⚽ '}
              {cat === 'Importé' && '📥 '}
              {cat}
            </button>
          ))}
        </div>

        {/* Channels grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {filtered.map(channel => {
            const isSelected = selectedChannel?.id === channel.id;
            const hasStream = !!channel.url;

            return (
              <button
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`group relative flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all duration-200 aspect-square text-center ${
                  isSelected
                    ? 'border-[var(--color-neon)] bg-[#0A1033] shadow-[0_0_20px_rgba(96,165,250,0.2)] scale-105'
                    : 'border-white/5 bg-white/2 hover:bg-white/8 hover:border-white/15 hover:scale-105'
                }`}
              >
                {/* Live dot */}
                {hasStream && (
                  <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
                )}

                {/* Logo */}
                <div className="w-10 h-10 flex items-center justify-center">
                  {channel.logo ? (
                    <img
                      src={channel.logo}
                      alt={channel.title}
                      className={`w-full h-full object-contain transition-opacity duration-200 ${hasStream ? 'opacity-90 group-hover:opacity-100' : 'opacity-40 group-hover:opacity-60'}`}
                      onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : (
                    <Tv size={22} className="text-gray-500 group-hover:text-gray-300 transition" />
                  )}
                </div>

                {/* Title */}
                <span className={`text-[9px] font-bold uppercase tracking-wide leading-tight line-clamp-2 ${isSelected ? 'text-[var(--color-neon)]' : hasStream ? 'text-gray-300' : 'text-gray-600'}`}>
                  {channel.title}
                </span>

                {/* Stream indicator */}
                {hasStream
                  ? <Wifi size={8} className="text-green-500 opacity-70" />
                  : <WifiOff size={8} className="text-gray-700 opacity-50" />
                }
              </button>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-600 text-sm">
              Aucune chaîne ne correspond à &quot;{searchQuery}&quot;
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 pt-2 pb-4 text-[10px] text-gray-600">
          <span className="flex items-center gap-1.5"><Wifi size={10} className="text-green-500" /> Flux disponible</span>
          <span className="flex items-center gap-1.5"><WifiOff size={10} className="text-gray-700" /> Nécessite IPTV</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-500 inline-block" /> En direct</span>
        </div>
      </div>
    </div>
  );
}
