"use client";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import styles from "../page.module.css";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/SearchBar";

export default function CollectionsPage() {
  const [sagas, setSagas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchSagas = async () => {
      try {
        const { data, error } = await supabase
          .from('sagas')
          .select('*, saga_movies(*, movies(*))')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setSagas(data);
        }
      } catch (e) {
        console.warn("Erreur chargement sagas:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchSagas();
  }, []);

  const handleSearch = (q) => {
    setSearchQuery(q);
  };

  const filteredSagas = searchQuery
    ? sagas.filter(saga => saga.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sagas;

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
            <Link href="/roulette" className={`${styles.navLink} ${styles.desktopOnly}`}>🎰 Roulette</Link>
          </div>
        </nav>
      </header>

      <section style={{ padding: '6rem 2rem 2rem 2rem' }}>
        <h2 className={styles.sectionTitle} style={{ marginBottom: '2rem', fontSize: '2rem' }}>Toutes les Sagas</h2>
        
        {loading ? (
          <p style={{ color: 'white' }}>Chargement des sagas...</p>
        ) : (
          <div className={styles.grid}>
            {filteredSagas.length === 0 ? (
              <p style={{ color: 'white', gridColumn: '1 / -1', textAlign: 'center' }}>Aucune saga trouvée.</p>
            ) : (
              filteredSagas.map((saga) => {
                // Obtenir le poster du premier film de la saga s'il n'y a pas de poster pour la saga elle-même
                let sagaPoster = saga.poster_url;
                if (!sagaPoster && saga.saga_movies && saga.saga_movies.length > 0) {
                  // Trier par ordre pour prendre le premier film
                  const firstMovie = saga.saga_movies.sort((a, b) => a.order_number - b.order_number)[0]?.movies;
                  if (firstMovie) {
                    sagaPoster = firstMovie.poster_url;
                  }
                }
                
                return (
                  <Link href={`/saga/${saga.id}`} key={saga.id} className={styles.movieCard}>
                    <div style={{ position: 'relative' }}>
                      <img 
                        src={sagaPoster || "https://via.placeholder.com/400x600?text=Saga"} 
                        alt={saga.name} 
                        className={styles.moviePoster} 
                      />
                      <div className={styles.watchOverlay}>
                        <button className={styles.watchButton}>Voir la collection</button>
                      </div>
                    </div>
                    <div className={styles.movieInfo}>
                      <h4 className={styles.movieTitle}>{saga.name}</h4>
                      {saga.saga_movies && (
                        <span style={{
                          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                          color: 'white',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          fontWeight: '600'
                        }}>
                          {saga.saga_movies.length} {saga.saga_movies.length > 1 ? 'titres' : 'titre'}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </section>
    </main>
  );
}
