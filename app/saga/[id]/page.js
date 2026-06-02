"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import styles from "../../page.module.css";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/SearchBar";

export default function SagaPage() {
  const { id } = useParams();
  const [saga, setSaga] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSagaDetails = async () => {
      try {
        const { data, error } = await supabase
          .from('sagas')
          .select('*, saga_movies(*, movies(*))')
          .eq('id', id)
          .single();

        if (!error && data) {
          setSaga(data);
        }
      } catch (e) {
        console.warn("Erreur chargement saga:", e);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchSagaDetails();
    }
  }, [id]);

  const handleSearch = (q) => {
    setSearchQuery(q);
  };

  if (loading) {
    return (
      <main className={styles.container} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <h1 style={{ color: 'white', fontSize: '1.5rem' }}>Chargement...</h1>
      </main>
    );
  }

  if (!saga) {
    return (
      <main className={styles.container} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '1rem' }}>
        <h1 style={{ color: 'white', fontSize: '1.5rem' }}>Saga introuvable</h1>
        <Link href="/collections" style={{ color: 'var(--neon-blue)', textDecoration: 'underline' }}>Retour aux collections</Link>
      </main>
    );
  }

  // Trier les films par ordre
  const sagaMovies = (saga.saga_movies || [])
    .sort((a, b) => a.order_number - b.order_number)
    .map(sm => sm.movies)
    .filter(Boolean);

  const filteredMovies = searchQuery
    ? sagaMovies.filter(movie => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sagaMovies;

  const isNewMovie = (movie) => {
    if (!movie.created_at) return false;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const movieDate = new Date(movie.created_at);
    return movieDate >= twoWeeksAgo;
  };

  const getAgeRatingNumber = (ageRating) => {
    if (!ageRating) return 10;
    if (ageRating.toLowerCase().includes('tout public')) return 0;
    const match = ageRating.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.logo} text-glow-primary`}>
          <Link href="/">NARU<span>.STREAM</span></Link>
        </h1>
        <nav className={styles.nav}>
          <Suspense fallback={null}>
            <SearchBar onSearch={handleSearch} />
          </Suspense>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/" className={`${styles.navLink} ${styles.desktopOnly}`}>Accueil</Link>
            <Link href="/collections" className={`${styles.navLink} ${styles.desktopOnly}`}>Collections</Link>
          </div>
        </nav>
      </header>

      <section style={{ padding: '6rem 2rem 2rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Link href="/collections" style={{ 
            color: 'white', 
            background: 'rgba(255,255,255,0.1)', 
            width: '40px', 
            height: '40px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '50%',
            textDecoration: 'none'
          }}>
            ←
          </Link>
          <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '2rem' }}>{saga.name}</h2>
        </div>
        
        {saga.description && (
          <p style={{ color: '#aaa', marginBottom: '3rem', maxWidth: '800px', lineHeight: '1.6' }}>
            {saga.description}
          </p>
        )}
        
        <div className={styles.grid}>
          {filteredMovies.length === 0 ? (
            <p style={{ color: 'white', gridColumn: '1 / -1', textAlign: 'center' }}>Aucun film trouvé dans cette saga.</p>
          ) : (
            filteredMovies.map((movie) => (
              <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard} style={{ aspectRatio: movie.content_type === 'serie' ? '16/9' : '2/3' }}>
                <div style={{ position: 'relative' }}>
                  {isNewMovie(movie) && <span className={styles.newBadge}>NOUVEAU</span>}
                  <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                  
                  <div style={{ 
                    position: 'absolute', 
                    top: '0.75rem', 
                    right: '0.75rem', 
                    display: 'flex', 
                    gap: '0.5rem', 
                    flexWrap: 'wrap'
                  }}>
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
                  
                  <div className={styles.watchOverlay}>
                    <button className={styles.watchButton}>▶ Voir maintenant</button>
                  </div>
                </div>
                <div className={styles.movieInfo}>
                  <h4 className={styles.movieTitle}>{movie.title}</h4>
                  {movie.platform && (
                    <span style={{
                      background: 'linear-gradient(135deg, #E50914, #B20710)',
                      color: 'white',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      boxShadow: '0 2px 8px rgba(229, 9, 20, 0.3)'
                    }}>
                      {movie.platform}
                    </span>
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
