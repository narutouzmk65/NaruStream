"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import IPTVPlayer from '@/components/live/IPTVPlayer';
import ChatSim from '@/components/live/ChatSim';
import { parseM3U, IPTVChannel } from '@/utils/m3uParser';
import { 
  Tv, Search, Upload, Plus, AlertCircle, Database, Check, 
  Trash2, HelpCircle, Trophy, Radio, ArrowRight 
} from 'lucide-react';

const DEFAULT_CHANNELS: IPTVChannel[] = [
  {
    id: 'wc-canal1',
    title: 'Coupe du Monde HD - Flux 1 (Demo Sport)',
    url: 'https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8',
    logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=120&auto=format&fit=crop&q=60',
    group: 'Coupe du Monde'
  },
  {
    id: 'wc-canal2',
    title: 'Coupe du Monde HD - Flux 2 (Oceans)',
    url: 'https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8',
    logo: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=120&auto=format&fit=crop&q=60',
    group: 'Coupe du Monde'
  },
  {
    id: 'f24-fr',
    title: 'France 24 HD (Direct)',
    url: 'https://static.france24.com/live/F24_FR_LO/live_tv.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/France_24_Logo.svg',
    group: 'Généraliste'
  },
  {
    id: 'f24-en',
    title: 'France 24 English (Direct)',
    url: 'https://static.france24.com/live/F24_EN_LO/live_tv.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/France_24_Logo.svg',
    group: 'Généraliste'
  },
  {
    id: 'euronews-fr',
    title: 'Euronews Français (Direct)',
    url: 'https://euronews-euronews-french-1-fr.samsung.wurl.tv/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Euronews_logo_2016.svg',
    group: 'Généraliste'
  },
  {
    id: 'nasa-tv',
    title: 'NASA TV Public Stream',
    url: 'https://ntv1.nasatv.live/nasatv/NTV-Public-SPG/playlist.m3u8',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg',
    group: 'Documentaire'
  }
];

export default function LivePage() {
  const [channels, setChannels] = useState<IPTVChannel[]>(DEFAULT_CHANNELS);
  const [selectedChannel, setSelectedChannel] = useState<IPTVChannel>(DEFAULT_CHANNELS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'wc' | 'general' | 'imported'>('all');
  const [m3uUrlInput, setM3uUrlInput] = useState('');
  const [m3uTextInput, setM3uTextInput] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);
  const [importedCount, setImportedCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showChat, setShowChat] = useState(true);

  // Load custom channels from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('antigravity_imported_iptv');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as IPTVChannel[];
        if (parsed.length > 0) {
          setChannels([...DEFAULT_CHANNELS, ...parsed]);
          setImportedCount(parsed.length);
        }
      } catch (e) {
        console.error('Failed to parse saved IPTV playlist', e);
      }
    }
  }, []);

  const handleImportPlaylistText = (text: string) => {
    if (!text.trim()) return;
    setIsImporting(true);
    
    setTimeout(() => {
      const parsedChannels = parseM3U(text);
      if (parsedChannels.length === 0) {
        alert("Aucune chaîne valide trouvée dans la playlist M3U. Assurez-vous que le format commence par #EXTM3U et contient des URLs valides.");
        setIsImporting(false);
        return;
      }

      // Add 'Importé' group to all parsed channels
      const updatedParsed = parsedChannels.map(c => ({
        ...c,
        group: c.group || 'Importé'
      }));

      // Merge and save
      const saved = localStorage.getItem('antigravity_imported_iptv');
      let existingCustom: IPTVChannel[] = [];
      if (saved) {
        try {
          existingCustom = JSON.parse(saved);
        } catch (e) {}
      }

      const mergedCustom = [...existingCustom, ...updatedParsed];
      localStorage.setItem('antigravity_imported_iptv', JSON.stringify(mergedCustom));
      
      setChannels([...DEFAULT_CHANNELS, ...mergedCustom]);
      setImportedCount(mergedCustom.length);
      setSelectedChannel(updatedParsed[0]);
      setIsImporting(false);
      setM3uTextInput('');
      setShowImportForm(false);
      setSelectedCategory('imported');
      
      // Toast confirmation
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }, 1000);
  };

  const handleImportPlaylistUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!m3uUrlInput.trim()) return;

    setIsImporting(true);
    try {
      // Since fetching remote M3Us from a client side app might trigger CORS, 
      // we fetch it via a proxy or standard fetch with a fallback instructions.
      const response = await fetch(m3uUrlInput);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const text = await response.text();
      handleImportPlaylistText(text);
      setM3uUrlInput('');
    } catch (error) {
      console.error("CORS block or request error, attempting backup loading:", error);
      alert(
        "Erreur CORS ou réseau lors de la récupération de la playlist en ligne.\n\n" +
        "CONSEIL : Téléchargez le fichier .m3u et copiez/collez son contenu dans l'onglet 'Coller la Playlist' ci-dessous !"
      );
      setIsImporting(false);
    }
  };

  const clearImported = () => {
    if (confirm("Voulez-vous supprimer toutes les chaînes importées ?")) {
      localStorage.removeItem('antigravity_imported_iptv');
      setChannels(DEFAULT_CHANNELS);
      setImportedCount(0);
      setSelectedChannel(DEFAULT_CHANNELS[0]);
      setSelectedCategory('all');
    }
  };

  const loadSampleM3U = () => {
    const sample = `#EXTM3U
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/8/87/RTS_1_logo.png" group-title="Sports",RTS Sport 1 HD (Test)
https://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/9/91/RMC_Sport_logo.png" group-title="Sports",RMC Sport 1 (Demo)
https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8
#EXTINF:-1 tvg-logo="https://upload.wikimedia.org/wikipedia/commons/e/e0/TF1_logo.svg" group-title="Généraliste",TF1 Direct (Demo)
https://static.france24.com/live/F24_FR_LO/live_tv.m3u8`;

    setM3uTextInput(sample);
  };

  // Filter channels logic
  const filteredChannels = channels.filter(channel => {
    // Search filter
    const matchesSearch = channel.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (channel.group && channel.group.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    // Category filter
    if (selectedCategory === 'wc') {
      return channel.group === 'Coupe du Monde';
    }
    if (selectedCategory === 'general') {
      return channel.group === 'Généraliste' || channel.group === 'Documentaire';
    }
    if (selectedCategory === 'imported') {
      // Find channels not in default list
      return !DEFAULT_CHANNELS.some(def => def.id === channel.id);
    }
    return true; // 'all'
  });

  const isWCChannel = selectedChannel.group === 'Coupe du Monde';

  return (
    <div className="min-h-screen bg-[var(--color-blue-deep)] flex flex-col text-white pb-20">
      {/* Navbar relative to layout */}
      <Navbar isAbsolute={false} />

      {/* Floating Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border bg-green-500/20 border-green-500/40 text-green-300 backdrop-blur-md transition-all duration-300">
          <Check size={18} className="bg-green-500 text-black rounded-full p-0.5" />
          <span className="font-semibold text-sm">Playlist IPTV importée avec succès !</span>
        </div>
      )}

      {/* Hero Section Live */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Main Streaming Window */}
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Player block */}
            <div className="relative">
              <IPTVPlayer url={selectedChannel.url} title={selectedChannel.title} />
              
              {/* Channel Stats Bar */}
              <div className="flex items-center justify-between p-4 bg-[#0A0F2E] border border-white/5 rounded-b-xl mt-[-8px] relative z-0">
                <div className="flex items-center gap-3">
                  {selectedChannel.logo ? (
                    <img 
                      src={selectedChannel.logo} 
                      alt={selectedChannel.title} 
                      className="w-10 h-10 object-contain rounded-md bg-white/5 p-1 border border-white/10"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1598257006458-087169a1f08d?w=80&auto=format&fit=crop&q=60';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-md border border-white/10">
                      <Tv size={20} className="text-[var(--color-neon)]" />
                    </div>
                  )}
                  <div>
                    <h1 className="font-bold text-lg font-outfit text-white tracking-wide">{selectedChannel.title}</h1>
                    <span className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Radio size={12} className="text-red-500" />
                      IPTV URL : <span className="font-mono text-gray-500 truncate max-w-[200px] md:max-w-sm">{selectedChannel.url}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowChat(!showChat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border duration-200 ${
                      showChat 
                        ? 'bg-[#60A5FA]/10 text-[#60A5FA] border-[#60A5FA]/30 hover:bg-[#60A5FA]/20' 
                        : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {showChat ? "Masquer le Chat" : "Afficher le Chat"}
                  </button>
                </div>
              </div>
            </div>

            {/* Description details card */}
            <div className="p-6 rounded-xl bg-white/3 border border-white/5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white uppercase tracking-wider text-sm flex items-center gap-2">
                  <Trophy size={16} className="text-yellow-400" /> Antigravity IPTV Live
                </h3>
                <span className="text-xs px-2.5 py-1 bg-[var(--color-neon)]/15 text-[var(--color-neon)] border border-[var(--color-neon)]/30 rounded-full font-bold uppercase tracking-widest">
                  {selectedChannel.group || 'Général'}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                Regardez les plus grands événements sportifs mondiaux en temps réel ou connectez vos propres abonnements IPTV. Pour tester l'importation de listes IPTV privées, cliquez sur le bouton <strong className="text-[var(--color-neon)]">Importer une Playlist</strong> ci-dessous.
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={() => setShowImportForm(!showImportForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-neon)] text-black hover:bg-white transition duration-200 rounded-lg text-xs font-bold uppercase tracking-wider"
                >
                  <Upload size={14} /> Importer une Playlist IPTV
                </button>
                {importedCount > 0 && (
                  <button
                    onClick={clearImported}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition duration-200 rounded-lg text-xs font-bold uppercase tracking-wider"
                  >
                    <Trash2 size={14} /> Vider les chaînes importées ({importedCount})
                  </button>
                )}
              </div>

              {/* Import IPTV form */}
              {showImportForm && (
                <div className="p-5 rounded-lg bg-[#080B22] border border-white/10 space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm uppercase flex items-center gap-2">
                      <Plus size={16} className="text-[var(--color-neon)]" /> Charger un fichier M3U / M3U8
                    </h4>
                    <button 
                      onClick={() => setShowImportForm(false)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Fermer
                    </button>
                  </div>

                  {/* Tabs input styles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Method A: URL */}
                    <form onSubmit={handleImportPlaylistUrl} className="space-y-3 p-4 bg-white/3 border border-white/5 rounded-lg flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="text-xs font-bold uppercase text-[var(--color-neon)]">Méthode A : Charger par URL</span>
                        <p className="text-xs text-gray-400">Entrez le lien direct HTTP de votre playlist IPTV .m3u8</p>
                        <input
                          type="url"
                          required
                          value={m3uUrlInput}
                          onChange={(e) => setM3uUrlInput(e.target.value)}
                          placeholder="https://moniptv.com/get.php?auth=xyz&output=ts"
                          className="w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-neon)]/50 transition font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isImporting}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white text-white hover:text-black rounded transition text-xs font-bold uppercase duration-200 mt-2 disabled:opacity-50"
                      >
                        {isImporting ? "Chargement..." : "Télécharger"} <ArrowRight size={12} />
                      </button>
                    </form>

                    {/* Method B: Raw M3U Paste */}
                    <div className="space-y-3 p-4 bg-white/3 border border-white/5 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase text-[var(--color-neon)]">Méthode B : Coller la Playlist</span>
                        <button 
                          onClick={loadSampleM3U} 
                          className="text-[10px] text-gray-400 hover:text-[var(--color-neon)] underline font-semibold"
                        >
                          Charger une Démo
                        </button>
                      </div>
                      <textarea
                        value={m3uTextInput}
                        onChange={(e) => setM3uTextInput(e.target.value)}
                        placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo='logo_url',Nom de la chaîne&#10;http://stream_url.m3u8"
                        rows={4}
                        className="w-full bg-black/40 border border-white/15 rounded-md px-3 py-2 text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-neon)]/50 transition font-mono resize-none"
                      />
                      <button
                        onClick={() => handleImportPlaylistText(m3uTextInput)}
                        disabled={isImporting || !m3uTextInput.trim()}
                        className="flex items-center justify-center gap-2 w-full py-2 bg-[var(--color-neon)]/20 hover:bg-[var(--color-neon)]/30 text-[var(--color-neon)] border border-[var(--color-neon)]/30 hover:border-[var(--color-neon)]/50 rounded transition text-xs font-bold uppercase duration-200 disabled:opacity-50"
                      >
                        {isImporting ? "Analyse en cours..." : "Valider le contenu"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Sidebar Chat (Togglable) */}
          {showChat && (
            <div className="w-full lg:w-[350px] h-[55vh] lg:h-[73vh] flex-shrink-0 animate-fadeIn">
              <ChatSim channelName={selectedChannel.title} isWorldCup={isWCChannel} />
            </div>
          )}

        </div>
      </div>

      {/* Channels Directory Panel */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-12 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-xl font-bold uppercase tracking-widest font-outfit text-white">Catalogue des Directs</h2>
            <p className="text-gray-400 text-xs mt-1">Sélectionnez la chaîne pour changer le flux vidéo en direct.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={14} className="text-gray-500" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une chaîne, un sport..."
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-neon)]/50 transition"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition border ${
              selectedCategory === 'all' 
                ? 'bg-white text-black border-white' 
                : 'bg-white/5 text-gray-300 border-white/5 hover:bg-white/10'
            }`}
          >
            Toutes les chaînes
          </button>
          <button
            onClick={() => setSelectedCategory('wc')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition border flex items-center gap-1.5 ${
              selectedCategory === 'wc' 
                ? 'bg-yellow-400 text-black border-yellow-400' 
                : 'bg-yellow-400/5 text-yellow-400/90 border-yellow-400/10 hover:bg-yellow-400/10'
            }`}
          >
            🏆 Coupe du Monde
          </button>
          <button
            onClick={() => setSelectedCategory('general')}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition border ${
              selectedCategory === 'general' 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/10'
            }`}
          >
            📺 TNT &amp; Infos
          </button>
          {importedCount > 0 && (
            <button
              onClick={() => setSelectedCategory('imported')}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition border flex items-center gap-1.5 ${
                selectedCategory === 'imported' 
                  ? 'bg-[var(--color-neon)] text-black border-[var(--color-neon)]' 
                  : 'bg-[var(--color-neon)]/5 text-[var(--color-neon)] border-[var(--color-neon)]/10 hover:bg-[var(--color-neon)]/10'
              }`}
            >
              📥 Importées ({importedCount})
            </button>
          )}
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredChannels.map((channel) => {
            const isSelected = selectedChannel.id === channel.id;
            return (
              <div
                key={channel.id}
                onClick={() => setSelectedChannel(channel)}
                className={`group relative cinematic-hover rounded-xl border p-4 flex flex-col items-center justify-between text-center cursor-pointer select-none transition duration-300 aspect-[1/1] ${
                  isSelected 
                    ? 'border-[var(--color-neon)] bg-[#0A1033] shadow-[0_0_20px_rgba(96,165,250,0.15)]' 
                    : 'border-white/5 bg-white/2 hover:bg-white/5 hover:border-white/10'
                }`}
              >
                {/* Logo or placeholder */}
                <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/5 p-2 flex items-center justify-center mb-2 overflow-hidden transition-transform duration-300 group-hover:scale-110">
                  {channel.logo ? (
                    <img 
                      src={channel.logo} 
                      alt={channel.title} 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = ''; // fallbacks to Tv icon
                      }}
                    />
                  ) : (
                    <Tv size={24} className="text-gray-400 group-hover:text-[var(--color-neon)] transition" />
                  )}
                </div>

                <div className="w-full space-y-1">
                  <div className="text-xs font-bold text-white font-outfit truncate w-full" title={channel.title}>
                    {channel.title}
                  </div>
                  <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider block">
                    {channel.group || 'Général'}
                  </span>
                </div>

                {/* Status Indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                )}
              </div>
            );
          })}

          {filteredChannels.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 text-sm italic space-y-2">
              <AlertCircle className="mx-auto text-gray-600 mb-1" size={24} />
              <div>Aucune chaîne de direct ne correspond à votre recherche.</div>
              {selectedCategory === 'imported' && (
                <div className="text-xs text-[var(--color-neon)]">
                  Cliquez sur "Importer une Playlist" pour ajouter vos propres flux IPTV.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
