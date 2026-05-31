"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "./movie.module.css";
import { supabase } from "@/lib/supabase";
import NarutostreamPlayer from "@/components/NarutostreamPlayer";

const convertToEmbedUrl = (url) => {
  if (!url) return null;
  const videoIdMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
  );
  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=1&modestbranding=1&rel=0&showinfo=0&controls=0&loop=1&playlist=${videoIdMatch[1]}&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&start=0&origin=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : 'https://narustream-omega.vercel.app')}&widget_referrer=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : 'https://narustream-omega.vercel.app')}`;
  }
  return url;
};

export default function MovieDetail() {
  const params = useParams();
  const id = params.id;

  const [movie, setMovie] = useState(null);
  const [streams, setStreams] = useState([]);
  const [activeStream, setActiveStream] = useState(null);
  const [currentStreamIndex, setCurrentStreamIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showMovieTrailer, setShowMovieTrailer] = useState(false);
  const [isInList, setIsInList] = useState(false);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const watchTimerRef = useRef(null);
  const historyLoggedRef = useRef(false);

  // Helper function to convert age rating string to number
  const getAgeRatingNumber = (ageRating) => {
    if (!ageRating) return 10;
    const match = ageRating.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  // Function to log stream event and update stats
  const logStreamEvent = async (stream, status, errorMessage = null) => {
    // Log to stream_logs
    await supabase.from("stream_logs").insert({
      stream_id: stream.id,
      movie_id: movie.id,
      status: status,
      error_message: errorMessage
    });

    // Update stream stats
    const updateField = status === "success" ? "success_count" : "failure_count";
    await supabase
      .from("streams")
      .update({
        [updateField]: (stream[updateField] || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq("id", stream.id);
  };

  // Function to add to watch history
  const addToWatchHistory = async () => {
    if (historyLoggedRef.current) return;
    historyLoggedRef.current = true;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current profile from sessionStorage
      let userProfile = null;
      if (typeof window !== "undefined") {
        const savedProfile = sessionStorage.getItem('current_profile');
        if (savedProfile) {
          userProfile = JSON.parse(savedProfile);
        }
      }

      // Insert into watch_history
      await supabase.from("watch_history").upsert({
        user_id: user.id,
        user_profile_id: userProfile?.id || null,
        movie_id: movie.id,
        stream_id: activeStream?.id || null,
        watched_at: new Date().toISOString(),
        is_completed: false
      }, {
        onConflict: 'user_id,movie_id'
      });
    } catch (error) {
      console.error("Error adding to watch history:", error);
    }
  };

  // Start watch timer when stream becomes active
  useEffect(() => {
    if (activeStream && movie) {
      // Clear any existing timer
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
      }
      // Start new 8 second timer
      watchTimerRef.current = setTimeout(() => {
        addToWatchHistory();
      }, 8000);
    }

    return () => {
      if (watchTimerRef.current) {
        clearTimeout(watchTimerRef.current);
      }
    };
  }, [activeStream, movie]);

  // Function to try next stream
  const tryNextStream = async () => {
    if (streams.length === 0) return;
    
    // Mark current stream as failed if there is one
    if (activeStream) {
      await logStreamEvent(activeStream, "failure", "Failed to load, switching to backup");
    }

    // Try next stream
    const nextIndex = (currentStreamIndex + 1) % streams.length;
    setCurrentStreamIndex(nextIndex);
    setActiveStream(streams[nextIndex]);

    // Update the movie's current_link_index
    await supabase.from("movies").update({ current_link_index: nextIndex }).eq("id", movie.id);
  };

  // Function to check if movie is in user's list
  const checkIfInList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_lists')
        .select('id')
        .eq('user_id', user.id)
        .eq('movie_id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows found"
      setIsInList(!!data);
    } catch (error) {
      console.error('Error checking list:', error);
    }
  };

  // Function to toggle movie in list
  const toggleInList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return alert('Tu dois être connecté !');

      if (isInList) {
        // Remove from list
        const { error } = await supabase
          .from('user_lists')
          .delete()
          .eq('user_id', user.id)
          .eq('movie_id', id);
        if (error) throw error;
        setIsInList(false);
      } else {
        // Add to list
        const { error } = await supabase
          .from('user_lists')
          .insert({
            user_id: user.id,
            movie_id: id
          });
        if (error) throw error;
        setIsInList(true);
      }
    } catch (error) {
      console.error('Error toggling list:', error);
    }
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
    // Dispatch event to mute home page hero
    window.dispatchEvent(new CustomEvent('moviePageOpened'));

    const fetchData = async () => {
      // Fetch movie/series
      const { data: movieData, error: movieError } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (movieError) {
        console.error(movieError);
        setLoading(false);
        return;
      }

      setMovie(movieData);

      if (movieData.content_type === 'serie') {
        // Fetch seasons for this series
        const { data: seasonsData } = await supabase
          .from('seasons')
          .select('*')
          .eq('movie_id', id)
          .order('season_number', { ascending: true });
        setSeasons(seasonsData || []);
        if (seasonsData && seasonsData.length > 0) {
          setSelectedSeason(seasonsData[0]);
          // Fetch episodes for first season
          const { data: episodesData } = await supabase
            .from('episodes')
            .select('*')
            .eq('season_id', seasonsData[0].id)
            .order('episode_number', { ascending: true });
          setEpisodes(episodesData || []);
        }
      } else {
        // It's a movie: fetch streams
        const { data: streamsData } = await supabase
          .from("streams")
          .select("*")
          .eq("movie_id", id)
          .eq("is_active", true);
        setStreams(streamsData || []);
        if (streamsData && streamsData.length > 0) {
          const index = Math.max(0, Math.min((movieData.current_link_index || 0), streamsData.length - 1));
          setCurrentStreamIndex(index);
          setActiveStream(streamsData[index]);
          logStreamEvent(streamsData[index], "success");
        }
      }

      setLoading(false);
      checkIfInList();
    };

    fetchData();

    // Auto-scroll when data loads
    const timer = setTimeout(() => {
      const playerSection = document.querySelector(".playerSection");
      
      if (playerSection) {
        playerSection.scrollIntoView({ behavior: "smooth" });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  // Check if we should block access for child mode
  if (selectedProfile?.is_kid && getAgeRatingNumber(movie.age_rating) > 10) {
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

  const trailerEmbedUrl = convertToEmbedUrl(movie.trailer_url);

  return (
    <main className={styles.container}>
      <Link href="/" className={styles.backLink}>← Retour à l'accueil</Link>

      {trailerEmbedUrl && showMovieTrailer && (
        <div className={styles.trailerSection}>
          <iframe
            src={trailerEmbedUrl}
            className={styles.trailerPlayer}
            allowFullScreen
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          ></iframe>
        </div>
      )}

      {movie.content_type === 'serie' ? (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 3rem'
        }}>
          {/* Season Selector */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '3rem',
            flexWrap: 'wrap'
          }}>
            {seasons.map(season => (
              <button
                key={season.id}
                onClick={async () => {
                  setSelectedSeason(season);
                  const { data: episodesData } = await supabase
                    .from('episodes')
                    .select('*')
                    .eq('season_id', season.id)
                    .order('episode_number', { ascending: true });
                  setEpisodes(episodesData || []);
                }}
                style={{
                  padding: '1rem 2rem',
                  border: selectedSeason?.id === season.id ? '2px solid #e50914' : '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '10px',
                  background: selectedSeason?.id === season.id ? '#e50914' : 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: selectedSeason?.id === season.id ? 'bold' : 'normal',
                  fontSize: '1rem',
                  transition: 'all 0.2s ease'
                }}
              >
                Saison {season.season_number}
              </button>
            ))}
          </div>

          {/* Episodes List */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
            gap: '1.5rem'
          }}>
            {episodes.map(episode => (
              <Link
                key={episode.id}
                href={`/episode/${episode.id}`}
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1rem',
                  background: 'rgba(15,15,15,0.9)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(229, 9, 20, 0.5)';
                  e.currentTarget.style.background = 'rgba(25,25,25,0.95)';
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(15,15,15,0.9)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.2)';
                }}
              >
                <div style={{
                  minWidth: '180px',
                  aspectRatio: '16/9',
                  background: episode.poster_url ? `url(${episode.poster_url}) center/cover` : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.3)'
                }}>
                  {!episode.poster_url && (
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>▶️</div>
                  )}
                  
                  {/* Status Badge */}
                  {episode.status && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      background: episode.status === 'sortie' 
                        ? 'linear-gradient(135deg, #22c55e, #16a34a)' 
                        : 'linear-gradient(135deg, #f97316, #ea580c)',
                      color: 'white',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}>
                      {episode.status === 'sortie' ? 'Sortie' : 'À Venir'}
                    </div>
                  )}

                  <div style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    background: 'rgba(0,0,0,0.8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    color: '#fff'
                  }}>
                    Ép. {episode.episode_number}
                  </div>
                </div>
                <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0.25rem 0' }}>
                  <h3 style={{
                    color: '#fff',
                    fontSize: '1.2rem',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.3',
                    fontWeight: '600'
                  }}>
                    {episode.title}
                  </h3>
                  {episode.description && (
                    <p style={{ 
                      color: '#999', 
                      margin: '0 0 0.75rem 0', 
                      fontSize: '0.95rem',
                      lineHeight: '1.5',
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {episode.description}
                    </p>
                  )}
                  {episode.duration && (
                    <p style={{ 
                      color: '#777', 
                      margin: 0,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ⏱️ {episode.duration} min
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.playerSection}>
          {/* Toujours afficher l'image du film (sans logo YouTube) */}
          <div className={styles.playerWrapper}>
            <div className={styles.playerUI}>
              <div className={styles.playerHeader}>
                <span className="text-glow-primary">NARU.STREAM SECURE PLAYER</span>
                <span className={styles.qualityBadge}>{activeStream?.quality || "PREMIUM"}</span>
              </div>
              {activeStream && activeStream.player_url ? (
                <iframe
                  src={activeStream.player_url}
                  className={styles.iframePlayer}
                  allowFullScreen
                  frameBorder="0"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                ></iframe>
              ) : (
                <div 
                  className={styles.posterPlaceholder}
                  style={{
                    backgroundImage: `url(${movie.backdrop_url || movie.poster_url})`
                  }}
                >
                  <div className={styles.playButton}>▶️</div>
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
                  🔄 Prochain Serveur
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
                    supabase.from("movies").update({ current_link_index: index }).eq("id", movie.id);
                  }}
                >
                  {stream.server_name || "Serveur 1"}
                </button>
              ))}
            </div>
          </div>
      </div>
      )}

      <div className={styles.movieDetails}>
        <img src={movie.poster_url} alt={movie.title} className={styles.detailPoster} />
        <div className={styles.info}>
          <h1 className="text-glow-primary">{movie.title}</h1>
          <div className={styles.meta} style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "15px" }}>
            {movie.platform && (
              <span style={{
                background: 'linear-gradient(135deg, #E50914, #B20710)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '700',
                textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)'
              }}>
                {movie.platform}
              </span>
            )}
            {movie.release_year && <span style={{ padding: "4px 8px", background: "rgba(255, 255, 255, 0.1)", borderRadius: "4px", fontSize: "0.85rem", color: "#ddd" }}>{movie.release_year}</span>}
            {movie.category && <span style={{ padding: "4px 8px", background: "rgba(245,197,24,0.1)", border: "1px solid var(--accent-color)", borderRadius: "4px", color: "var(--accent-color)", fontSize: "0.85rem" }}>{movie.category}</span>}
            {movie.age_rating && (
              <span style={{
                background: getAgeRatingNumber(movie.age_rating) <=10 ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 
                            getAgeRatingNumber(movie.age_rating) <=12 ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' :
                            getAgeRatingNumber(movie.age_rating) <=16 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                            'linear-gradient(135deg, #ef4444, #dc2626)',
                color: 'white',
                padding: '0.4rem 0.7rem',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: '800',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
              }}>
                {movie.age_rating}
              </span>
            )}
          </div>
          <p className={styles.description}>{movie.description}</p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            {trailerEmbedUrl && (
              <button
                className="cyber-button primary"
                onClick={() => setShowMovieTrailer(!showMovieTrailer)}
              >
                {showMovieTrailer ? "Fermer Bande-Annonce" : "Voir Bande-Annonce"}
              </button>
            )}
            <button
              className={`cyber-button ${isInList ? '' : 'primary'}`}
              onClick={toggleInList}
            >
              {isInList ? "❌ Retirer de Ma Liste" : "➕ Ajouter à Ma Liste"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
