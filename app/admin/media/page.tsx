"use client";

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
  Film, Tv, RefreshCw, Edit3, Save, X, Link2, Play,
  Clapperboard, ChevronDown, ChevronUp, AlertCircle, CheckCircle2
} from 'lucide-react';

interface Media {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  trailer_url: string | null;
  stream_url: string | null;
  media_type: 'movie' | 'serie';
  genre: string | null;
  year: number | null;
  views: number;
  created_at: string;
}

interface EditState {
  trailer_url: string;
  stream_url: string;
}

type ToastType = 'success' | 'error';
interface Toast {
  message: string;
  type: ToastType;
}

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ trailer_url: '', stream_url: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [filter, setFilter] = useState<'all' | 'movie' | 'serie'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const supabase = createClient();

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Erreur de chargement : ' + error.message, 'error');
    } else if (data) {
      setMediaList(data);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const startEdit = (media: Media) => {
    setEditingId(media.id);
    setEditState({
      trailer_url: media.trailer_url || '',
      stream_url: media.stream_url || '',
    });
    setExpandedId(media.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState({ trailer_url: '', stream_url: '' });
  };

  const saveEdit = async (mediaId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from('media')
      .update({
        trailer_url: editState.trailer_url || null,
        stream_url: editState.stream_url || null,
      })
      .eq('id', mediaId);

    setSaving(false);
    if (error) {
      showToast('Échec de la sauvegarde : ' + error.message, 'error');
    } else {
      setMediaList(prev => prev.map(m =>
        m.id === mediaId
          ? { ...m, trailer_url: editState.trailer_url || null, stream_url: editState.stream_url || null }
          : m
      ));
      setEditingId(null);
      showToast('Lecteur mis à jour avec succès !', 'success');
    }
  };

  const filtered = mediaList.filter(m => filter === 'all' || m.media_type === filter);

  const getLinkStatus = (url: string | null) => {
    if (!url) return 'missing';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'direct';
  };

  const LinkBadge = ({ url, label }: { url: string | null; label: string }) => {
    const status = getLinkStatus(url);
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold ${
        status === 'missing'
          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
          : status === 'youtube'
          ? 'bg-red-600/15 text-red-300 border border-red-600/30'
          : 'bg-green-500/15 text-green-400 border border-green-500/30'
      }`}>
        <Link2 size={11} />
        {status === 'missing' ? `${label} manquant` : status === 'youtube' ? `${label} YouTube` : `${label} Direct`}
      </span>
    );
  };

  return (
    <div className="p-6 md:p-10 pb-32 w-full max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-500/20 border-green-500/40 text-green-300'
            : 'bg-red-500/20 border-red-500/40 text-red-300'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="font-semibold text-sm">{toast.message}</span>
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-outfit uppercase tracking-widest font-bold text-white flex items-center gap-3 drop-shadow-lg">
            <Clapperboard className="text-[var(--color-neon)]" /> Films &amp; Séries
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Modifiez les lecteurs de vos médias (bandes-annonces &amp; liens de streaming).</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtre */}
          <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 gap-1">
            {(['all', 'movie', 'serie'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition ${
                  filter === f ? 'bg-[var(--color-electric)] text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                {f === 'all' ? 'Tout' : f === 'movie' ? 'Films' : 'Séries'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchMedia}
            className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-md hover:bg-white/10 transition text-sm text-gray-300 font-bold"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Sync
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-[var(--color-neon)] animate-pulse font-outfit tracking-widest uppercase text-sm">
          Chargement des médias...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-500 italic">Aucun média trouvé dans cette catégorie.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((media) => {
            const isEditing = editingId === media.id;
            const isExpanded = expandedId === media.id;

            return (
              <div
                key={media.id}
                className={`rounded-xl border backdrop-blur-md transition-all duration-300 overflow-hidden ${
                  isEditing
                    ? 'border-[var(--color-neon)]/50 bg-[#0D1B5E]/70 shadow-[0_0_30px_rgba(0,255,255,0.08)]'
                    : 'border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15'
                }`}
              >
                {/* Ligne principale */}
                <div className="flex items-center gap-4 p-4">
                  {/* Poster */}
                  <div className="w-14 h-20 rounded-md overflow-hidden flex-shrink-0 bg-white/5 border border-white/10">
                    {media.poster_url ? (
                      <img src={media.poster_url} alt={media.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        {media.media_type === 'movie' ? <Film size={20} /> : <Tv size={20} />}
                      </div>
                    )}
                  </div>

                  {/* Infos */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${
                        media.media_type === 'movie'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {media.media_type === 'movie' ? '🎬 Film' : '📺 Série'}
                      </span>
                      {media.year && <span className="text-xs text-gray-500">{media.year}</span>}
                      {media.genre && <span className="text-xs text-gray-500">• {media.genre}</span>}
                    </div>
                    <div className="font-bold text-white truncate font-outfit">{media.title}</div>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <LinkBadge url={media.trailer_url} label="Bande-annonce" />
                      {media.media_type === 'movie' && <LinkBadge url={media.stream_url} label="Lecteur" />}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : media.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition"
                          title="Voir les détails"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        <button
                          onClick={() => startEdit(media)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--color-electric)]/20 text-[var(--color-neon)] border border-[var(--color-neon)]/30 hover:bg-[var(--color-electric)]/40 transition"
                        >
                          <Edit3 size={14} /> Modifier
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-white/5 text-gray-400 border border-white/15 hover:bg-white/10 transition"
                        >
                          <X size={14} /> Annuler
                        </button>
                        <button
                          onClick={() => saveEdit(media.id)}
                          disabled={saving}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-[var(--color-neon)]/20 text-[var(--color-neon)] border border-[var(--color-neon)]/50 hover:bg-[var(--color-neon)]/40 transition disabled:opacity-50 disabled:cursor-wait"
                        >
                          <Save size={14} className={saving ? 'animate-spin' : ''} />
                          {saving ? 'Enregistrement...' : 'Sauvegarder'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Panneau d'édition/détail */}
                {(isExpanded || isEditing) && (
                  <div className="border-t border-white/8 bg-black/20 p-5 space-y-4">
                    {isEditing ? (
                      <>
                        {/* Champ Bande-annonce */}
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-neon)]">
                            <Play size={12} /> Bande-annonce (Trailer URL)
                          </label>
                          <input
                            type="url"
                            value={editState.trailer_url}
                            onChange={e => setEditState(s => ({ ...s, trailer_url: e.target.value }))}
                            placeholder="https://www.youtube.com/watch?v=... ou lien direct .mp4"
                            className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-neon)]/60 focus:bg-black/60 transition font-mono"
                          />
                          <p className="text-xs text-gray-600">Accepte YouTube (youtube.com/youtu.be) ou un lien vidéo direct.</p>
                        </div>

                        {/* Champ Lecteur (uniquement pour les films) */}
                        {media.media_type === 'movie' && (
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--color-electric)]">
                              <Film size={12} /> Lecteur Principal (Stream URL)
                            </label>
                            <input
                              type="url"
                              value={editState.stream_url}
                              onChange={e => setEditState(s => ({ ...s, stream_url: e.target.value }))}
                              placeholder="https://monserveur.com/films/mon-film.mp4"
                              className="w-full bg-black/40 border border-white/15 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--color-electric)]/60 focus:bg-black/60 transition font-mono"
                            />
                            <p className="text-xs text-gray-600">URL directe vers la vidéo MP4/M3U8. Pour une série, gérez les épisodes séparément.</p>
                          </div>
                        )}

                        {media.media_type === 'serie' && (
                          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4 text-xs text-purple-300">
                            <strong>📺 Série :</strong> Les liens de streaming sont gérés au niveau des épisodes individuels. Seule la bande-annonce est modifiable ici.
                          </div>
                        )}
                      </>
                    ) : (
                      /* Vue détaillée (lecture seule) */
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-neon)] mb-2 flex items-center gap-1">
                            <Play size={11} /> Bande-annonce
                          </div>
                          {media.trailer_url ? (
                            <a
                              href={media.trailer_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-blue-400 hover:text-blue-300 underline break-all"
                            >
                              {media.trailer_url}
                            </a>
                          ) : (
                            <span className="text-xs text-gray-600 italic">Aucune URL définie</span>
                          )}
                        </div>
                        {media.media_type === 'movie' && (
                          <div className="space-y-1">
                            <div className="text-xs font-bold uppercase tracking-widest text-[var(--color-electric)] mb-2 flex items-center gap-1">
                              <Film size={11} /> Lecteur principal
                            </div>
                            {media.stream_url ? (
                              <a
                                href={media.stream_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-mono text-blue-400 hover:text-blue-300 underline break-all"
                              >
                                {media.stream_url}
                              </a>
                            ) : (
                              <span className="text-xs text-gray-600 italic">Aucune URL définie</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
