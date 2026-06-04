"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import styles from "./roulette.module.css";

const genres = [
  { slug: "animation", name: "Animation" },
  { slug: "action", name: "Action" },
  { slug: "aventure", name: "Aventure" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "horreur", name: "Horreur" },
  { slug: "romance", name: "Romance" },
  { slug: "thriller", name: "Thriller" },
  { slug: "comedie", name: "Comédie" },
  { slug: "drame", name: "Drame" },
  { slug: "sciencefiction", name: "Science-Fiction" },
];

const CARD_WIDTH = 160;
const CARD_GAP = 12;
const CARD_TOTAL = CARD_WIDTH + CARD_GAP;

// Web Audio API Synthesizer (Click & Success sounds)
const playTickSound = (pitch = 700, volume = 0.05) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    // Silent fail if AudioContext is blocked by browser policy
  }
};

const playWinSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.3);
    });
  } catch (e) {}
};

export default function RoulettePage() {
  const [movies, setMovies] = useState([]);
  const [filteredPool, setFilteredPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Filters
  const [selectedGenre, setSelectedGenre] = useState("");
  const [contentType, setContentType] = useState("all"); // all, movie, serie
  
  // Spinner Reel state
  const [reelItems, setReelItems] = useState([]);
  const [spinning, setSpinning] = useState(false);
  const [offset, setOffset] = useState(0);
  const [winner, setWinner] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const containerRef = useRef(null);
  const animRef = useRef(null);
  
  useEffect(() => {
    // Retrieve profile
    if (typeof window !== "undefined") {
      const savedProfile = sessionStorage.getItem("current_profile");
      if (savedProfile) {
        setSelectedProfile(JSON.parse(savedProfile));
      }
    }
    
    // Fetch movies from DB
    const fetchMovies = async () => {
      try {
        const { data, error } = await supabase
          .from("movies")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          setMovies(data);
        }
      } catch (e) {
        console.error("Error loading movies:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const getAgeRatingNumber = (ageRating) => {
    if (!ageRating) return 10;
    if (ageRating.toLowerCase().includes("tout public")) return 0;
    const match = ageRating.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  // Filter pool whenever active movies or filters change
  useEffect(() => {
    let pool = [...movies];
    
    // Age rating filter for kids
    if (selectedProfile?.is_kid) {
      pool = pool.filter(m => getAgeRatingNumber(m.age_rating) <= 10);
    }
    
    // Content type filter
    if (contentType !== "all") {
      pool = pool.filter(m => m.content_type === contentType);
    }
    
    // Genre filter
    if (selectedGenre) {
      const normalize = (str) => 
        str.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[-\s]/g, "")
          .toLowerCase();
          
      pool = pool.filter(m => {
        if (!m.category) return false;
        const categories = String(m.category).toLowerCase().split(/[,;]/).map(s => s.trim());
        const normalizedCategories = categories.map(normalize);
        return normalizedCategories.some(cat => 
          cat.includes(normalize(selectedGenre))
        );
      });
    }
    
    setFilteredPool(pool);
  }, [movies, selectedGenre, contentType, selectedProfile]);

  const spinRoulette = () => {
    if (spinning || filteredPool.length === 0) return;
    
    setWinner(null);
    setSpinning(true);
    setOffset(0);
    
    // Build a large set of items to spin through
    const repetitions = Math.max(3, Math.ceil(40 / filteredPool.length));
    const items = [];
    for (let r = 0; r < repetitions; r++) {
      items.push(...filteredPool.sort(() => Math.random() - 0.5));
    }
    
    setReelItems(items);
    
    // Pick a winner within the last iteration of the list
    const winnerIdx = items.length - Math.floor(Math.random() * filteredPool.length) - 2;
    const winnerMovie = items[winnerIdx];
    
    const landPos = winnerIdx * CARD_TOTAL;
    const duration = 4000; // 4 seconds animation
    const startTime = performance.now();
    let lastTickCardIndex = -1;
    
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Quart easing out curve
      const eased = 1 - Math.pow(1 - progress, 4);
      const currentOffset = landPos * eased;
      
      // Sound tick logic when a new card crosses
      const currentCardIndex = Math.floor(currentOffset / CARD_TOTAL);
      if (currentCardIndex !== lastTickCardIndex) {
        lastTickCardIndex = currentCardIndex;
        if (soundEnabled && progress < 0.95) {
          playTickSound(600 + (1 - progress) * 200, 0.03 + (1 - progress) * 0.05);
        }
      }
      
      setOffset(currentOffset);
      
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setWinner(winnerMovie);
        if (soundEnabled) {
          playWinSound();
        }
      }
    };
    
    animRef.current = requestAnimationFrame(animate);
  };

  if (loading) {
    return (
      <main className={styles.container} style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
        <h1 className="text-glow-primary">Chargement...</h1>
      </main>
    );
  }

  // Deduplicate and filter options container size
  const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 1200;
  const initialOffset = (containerWidth / 2) - (CARD_WIDTH / 2);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.logo} text-glow-primary`}>
          <Link href="/">NARU<span>.STREAM</span></Link>
        </h1>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>Accueil</Link>
          <Link href="/collections" className={styles.navLink}>Collections</Link>
        </nav>
      </header>

      <div className={styles.content}>
        <div className={styles.titleSection}>
          <h2 className={`${styles.title} text-glow-accent`}>🎰 La Roulette Ninja</h2>
          <p className={styles.subtitle}>Tu ne sais pas quoi regarder ? Laisse le destin décider pour toi !</p>
        </div>

        {/* Filter Selection Panel */}
        {!spinning && (
          <div className={`${styles.filterPanel} glass-panel`}>
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Type de contenu</h4>
              <div className={styles.optionsGrid}>
                <button 
                  className={`${styles.optionButton} ${contentType === "all" ? styles.active : ""}`}
                  onClick={() => setContentType("all")}
                >
                  Tous
                </button>
                <button 
                  className={`${styles.optionButton} ${contentType === "movie" ? styles.active : ""}`}
                  onClick={() => setContentType("movie")}
                >
                  Films
                </button>
                <button 
                  className={`${styles.optionButton} ${contentType === "serie" ? styles.active : ""}`}
                  onClick={() => setContentType("serie")}
                >
                  Séries
                </button>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Genre</h4>
              <div className={styles.optionsGrid}>
                <button 
                  className={`${styles.optionButton} ${selectedGenre === "" ? styles.active : ""}`}
                  onClick={() => setSelectedGenre("")}
                >
                  Tous les genres
                </button>
                {genres.map(g => (
                  <button 
                    key={g.slug}
                    className={`${styles.optionButton} ${selectedGenre === g.slug ? styles.active : ""}`}
                    onClick={() => setSelectedGenre(g.slug)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Spinning Wheel */}
        {(spinning || reelItems.length > 0) && (
          <div className={styles.spinnerWrapper}>
            <div ref={containerRef} className={styles.spinnerContainer}>
              <div className={styles.centerIndicator} />
              <div className={styles.fadeLeft} />
              <div className={styles.fadeRight} />
              
              <div 
                className={styles.reelStrip}
                style={{
                  transform: `translateX(${initialOffset - offset}px)`,
                }}
              >
                {reelItems.map((item, i) => (
                  <div key={`${item.id}-${i}`} className={styles.reelCard}>
                    <img 
                      src={item.poster_url} 
                      alt={item.title} 
                      className={styles.reelPoster}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Start Spin & Audio Controls */}
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <button 
            className="cyber-button primary"
            onClick={spinRoulette}
            disabled={spinning || filteredPool.length === 0}
            style={{ minWidth: "220px" }}
          >
            {spinning ? "Sélection..." : `Lancer la Roulette (${filteredPool.length})`}
          </button>
          
          <button 
            className={styles.soundToggle}
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Couper le son" : "Activer le son"}
          >
            {soundEnabled ? "🔊" : "🔇"}
          </button>
        </div>

        {/* Winner Display Card */}
        {winner && !spinning && (
          <div className={styles.winnerWrapper}>
            <div className={`${styles.winnerCard} glass-panel`}>
              <img src={winner.poster_url} alt={winner.title} className={styles.winnerPoster} />
              <div className={styles.winnerInfo}>
                <h3 className={styles.winnerTitle}>{winner.title}</h3>
                <div className={styles.winnerMeta}>
                  {winner.release_year && <span className={styles.winnerBadge}>{winner.release_year}</span>}
                  {winner.content_type === "serie" && <span className={styles.winnerBadge}>Série</span>}
                  {winner.content_type === "movie" && <span className={styles.winnerBadge}>Film</span>}
                  {winner.age_rating && <span className={styles.winnerBadge}>{winner.age_rating}</span>}
                </div>
                <p className={styles.winnerDesc}>{winner.description || "Aucune description disponible pour ce programme."}</p>
                <div className={styles.actionButtons}>
                  <Link href={`/movie/${winner.id}`} className={styles.playButton}>
                    ▶ Visionner
                  </Link>
                  <button className="cyber-button" onClick={spinRoulette}>
                    🔄 Relancer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
