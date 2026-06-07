"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./episode.module.css";
import { supabase } from "@/lib/supabase";
import NarutostreamPlayer from "@/components/NarutostreamPlayer";

export default function EpisodeDetail() {
  const params = useParams();
  const id = params.id;

  const [episode, setEpisode] = useState(null);
  const [season, setSeason] = useState(null);
  const [series, setSeries] = useState(null);
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [allEpisodes, setAllEpisodes] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [savedProgress, setSavedProgress] = useState(0);
  const watchTimerRef = useRef(null);
  const historyLoggedRef = useRef(false);
  const progressSaveIntervalRef = useRef(null);
  const iframeProgressRef = useRef(0);

  // Helper function to convert age rating string to number
  const getAgeRatingNumber = (ageRating) => {
    if (!ageRating) return 10;
    if (ageRating.toLowerCase().includes('tout public')) return 0;
    const match = ageRating.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  // Function to log stream event and update stats for episodes
  const logStreamEvent = async (stream, status, errorMessage = null) => {
    // Log to stream_logs (we can reuse this for episodes too!)
    await supabase.from('stream_logs').insert({
      stream_id: stream.id,
      movie_id: series.id,
      status: status,
      error_message: errorMessage
    });

    // Update episode stream stats
    const updateField = status === "success" ? "success_count" : "failure_count";
    await supabase
      .from('episode_streams')
      .update({
        [updateField]: (stream[updateField] || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', stream.id);
  };

  // Save progress (in seconds) to watch_history for episodes
  const saveProgress = async (progressSeconds) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !series || !episode) return;
      let userProfile = null;
      if (typeof window !== "undefined") {
        const savedProfile = sessionStorage.getItem('current_profile');
        if (savedProfile) userProfile = JSON.parse(savedProfile);
      }
      await supabase.from("watch_history").upsert({
        user_id: user.id,
        user_profile_id: userProfile?.id || null,
        movie_id: series.id,
        episode_id: episode.id,
        stream_id: activeStream?.id || null,
        progress: Math.floor(progressSeconds),
        watched_at: new Date().toISOString(),
        is_completed: false
      }, { onConflict: 'user_id,movie_id' });
    } catch (error) {
      console.error("Error saving episode progress:", error);
    }
  };

  // Function to add to watch history for episodes
  const addToWatchHistory = async () => {
    if (historyLoggedRef.current) return;
    historyLoggedRef.current = true;
    await saveProgress(savedProgress || 0);
  };

  // Start watch timer + iframe progress interval when stream becomes active
  useEffect(() => {
    if (activeStream && series) {
      if (watchTimerRef.current) clearTimeout(watchTimerRef.current);
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
      historyLoggedRef.current = false;
      iframeProgressRef.current = savedProgress || 0;

      watchTimerRef.current = setTimeout(() => {
        addToWatchHistory();
      }, 5000);

      // For iframe/non-M3U8 players: save progress every 10s
      const isIframePlayer = !activeStream.m3u8_url && !(activeStream.server_name?.toLowerCase().includes('premium'));
      if (isIframePlayer) {
        progressSaveIntervalRef.current = setInterval(() => {
          iframeProgressRef.current += 10;
          saveProgress(iframeProgressRef.current);
        }, 10000);
      }
    }

    return () => {
      if (watchTimerRef.current) clearTimeout(watchTimerRef.current);
      if (progressSaveIntervalRef.current) clearInterval(progressSaveIntervalRef.current);
    };
  }, [activeStream, series]);

  // Function to try next stream
  const tryNextStream = async () => {
    if (streams.length === 0) return;
    if (activeStream) {
      await logStreamEvent(activeStream, "failure", "Failed to load, switching to backup");
    }
    const nextIndex = (currentStreamIndex + 1) % streams.length;
    setCurrentStreamIndex(nextIndex);
    setActiveStream(streams[nextIndex]);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = sessionStorage.getItem('current_profile');
      if (savedProfile) {
        setSelectedProfile(JSON.parse(savedProfile));
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .select('*, seasons(*), movies(*)')
        .eq('id', id)
        .single();
      if (episodeError) {
        console.error(episodeError);
        setLoading(false);
        return;
      }

      setEpisode(episodeData);
      setSeason(episodeData.seasons);
      setSeries(episodeData.movies);

      // Load saved progress for this episode
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: histData } = await supabase
            .from('watch_history')
            .select('progress')
            .eq('user_id', user.id)
            .eq('movie_id', episodeData.movies.id)
            .eq('episode_id', id)
            .single();
          if (histData && histData.progress > 0) {
            setSavedProgress(histData.progress);
            iframeProgressRef.current = histData.progress;
          }
        }
      } catch (e) { /* no saved progress */ }

      const { data: streamsData } = await supabase
        .from('episode_streams')
        .select('*')
        .eq('episode_id', id)
        .eq('is_active', true);

      const isPremium = (s) =>
        s.m3u8_url ||
        (s.server_name && s.server_name.toLowerCase().includes('premium'));
      const sortedStreams = [
        ...(streamsData || []).filter(isPremium),
        ...(streamsData || []).filter(s => !isPremium(s))
      ];
      setStreams(sortedStreams);
      if (sortedStreams.length > 0) {
        setActiveStream(sortedStreams[0]);
      }

      const { data: episodesData } = await supabase
        .from('episodes')
        .select('*')
        .eq('season_id', episodeData.season_id)
        .order('episode_number', { ascending: true });
      setAllEpisodes(episodesData || []);

      setLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Chargement...
      </div>
    );
  }

  // Check if we should block access for child mode
  if (selectedProfile?.is_kid && getAgeRatingNumber(series.age_rating) > 10) {
    return (
      <main className={styles.container} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1.5rem' }}>🔒</div>
        <h1 style={{ color: '#fff', fontFamily: 'var(--font-orbitron)', marginBottom: '1rem' }}>
          Accès refusé
        </h1>
        <p style={{ color: '#aaa', maxWidth: '500px', lineHeight: '1.6' }}>
          Ce contenu n'est pas adapté aux enfants. Veuillez changer de profil pour y accéder.
        </p>
        <Link href="/" style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          background: 'linear-gradient(135deg, #e50914, #b20710)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          ← Retour à l'accueil
        </Link>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      {/* Navigation Back */}
      <Link href={`/movie/${series.id}`} className={styles.backLink}>
        ← Retour à {series.title}
      </Link>

      {/* Player Section */}
      <div className={styles.playerSection}>
        {activeStream && (activeStream.m3u8_url || (activeStream.server_name && activeStream.server_name.toLowerCase().includes('premium'))) ? (
          <div>
            <NarutostreamPlayer src={activeStream.m3u8_url || activeStream.player_url} poster={episode.poster_url || series.poster_url} initialTime={savedProgress} onProgress={(t) => saveProgress(t)} />
            <div className={styles.serverSelector}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 className="text-glow-accent">Serveurs Disponibles</h3>
                {streams.length > 1 && (
                  <button
                    className="cyber-button"
                    onClick={tryNextStream}
                    style={{ fontSize: "0.85rem" }}
                  >
                    🔄 Serveur suivant
                  </button>
                )}
              </div>
              <div className={styles.serverList}>
                {streams.map((stream, index) => (
                  <button
                    key={stream.id}
                    className={`cyber-button ${activeStream?.id === stream.id ? 'primary' : ''}`}
                    onClick={() => {
                      setCurrentStreamIndex(index);
                      setActiveStream(stream);
                      logStreamEvent(stream, "success");
                    }}
                  >
                    {stream.server_name || 'Serveur ' + (index + 1)} {stream.quality ? `(${stream.quality})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className={styles.playerWrapper}>
              <div className={styles.playerUI}>
                <div className={styles.playerHeader}>
                  <span className="text-glow-primary">NARU.STREAM SECURE PLAYER</span>
                  <span className={styles.qualityBadge}>{activeStream?.quality || "PREMIUM"}</span>
                </div>
                {activeStream ? (
                  <iframe
                    src={activeStream.player_url}
                    className={styles.iframePlayer}
                    allowFullScreen
                    frameBorder="0"
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-fullscreen"
                  ></iframe>
                ) : (
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "white" }}>
                    Aucun lien disponible
                  </div>
                )}
              </div>
            </div>

            <div className={styles.serverSelector}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h3 className="text-glow-accent">Serveurs Disponibles</h3>
                {streams.length > 1 && (
                  <button
                    className="cyber-button"
                    onClick={tryNextStream}
                    style={{ fontSize: "0.85rem" }}
                  >
                    🔄 Serveur suivant
                  </button>
                )}
              </div>
              <div className={styles.serverList}>
                {streams.length === 0 && <p style={{ color: "white" }}>Aucun serveur</p>}
                {streams.map((stream, index) => (
                  <button
                    key={stream.id}
                    className={`cyber-button ${activeStream?.id === stream.id ? 'primary' : ''}`}
                    onClick={() => {
                      setCurrentStreamIndex(index);
                      setActiveStream(stream);
                      logStreamEvent(stream, "success");
                    }}
                  >
                    {stream.server_name || 'Serveur ' + (index + 1)} {stream.quality ? `(${stream.quality})` : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* ── Mention légale TMDB (sous le lecteur) ── */}
        <div className={styles.legalNotice}>
          <span className={styles.legalNoticeIcon}>⚠</span>
          <p>
            Les infos, saisons, dates de sortie, proviennent de la base de données publique{" "}
            <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className={styles.tmdbLink}>TMDB</a>.
            {" "}Il peut y avoir des erreurs ou des différences de dates de sortie selon le pays (ex&nbsp;: pas la même date en France qu&apos;en Amérique).
            <span className={styles.legalSeparator}> · </span>
            <Link href="/confidentialite" className={styles.privacyLink}>Charte de confidentialité →</Link>
          </p>
        </div>
      </div>

      {/* Episode Info & Episode List */}
      <div className={styles.contentLayout}>
        {/* Episode Info */}
        <div className={styles.episodeInfo}>
          <h1 className="text-glow-primary">{series.title}</h1>
          <h2>
            Saison {season.season_number} - Épisode {episode.episode_number} : {episode.title}
          </h2>
          {episode.duration && (
            <p className={styles.duration}>
              ⏱️ {episode.duration} min
            </p>
          )}
          {episode.description && (
            <p className={styles.description}>
              {episode.description}
            </p>
          )}
        </div>

        {/* Episode List */}
        <div className={styles.episodeList}>
          <h3>Saison {season.season_number}</h3>
          <div className={styles.episodeItems}>
            {allEpisodes.map(ep => (
              <Link
                key={ep.id}
                href={`/episode/${ep.id}`}
                className={`${styles.episodeItem} ${ep.id === episode.id ? styles.active : ''}`}
              >
                <div 
                  className={styles.episodeThumbnail}
                  style={{ 
                    backgroundImage: ep.poster_url ? `url(${ep.poster_url})` : undefined 
                  }}
                >
                  {!ep.poster_url && `Ép. ${ep.episode_number}`}
                </div>
                <div className={styles.episodeMeta}>
                  <p>
                    {ep.title}
                  </p>
                  {ep.duration && (
                    <span>{ep.duration} min</span>
                  )}
                </div>
                {ep.id === episode.id && (
                  <span className={styles.playingBadge}>En cours</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}