"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import styles from "../../page.module.css";
import { supabase } from "@/lib/supabase";

const genres = [
  { slug: "animation", name: "Animation" },
  { slug: "action", name: "Action" },
  { slug: "aventure", name: "Aventure" },
  { slug: "fantasy", name: "Fantasy" },
  { slug: "horreur", name: "Horreur" },
  { slug: "romance", name: "Romance" },
  { slug: "thriller", name: "Thriller" },
  { slug: "famille", name: "Famille" },
  { slug: "historique", name: "Historique" },
  { slug: "musical", name: "Musical" },
  { slug: "comedie", name: "Comédie" },
  { slug: "drame", name: "Drame" },
  { slug: "sciencefiction", name: "Science-Fiction" },
];

export default function GenrePage() {
  try {
    const params = useParams();
    const { slug } = params;
    // Normalize slug (lowercase, trim)
    const normalizedSlug = slug.toLowerCase().trim();
    const genre = genres.find(g => g.slug.toLowerCase() === normalizedSlug);
    const [movies, setMovies] = useState([]);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [isClient, setIsClient] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      setIsClient(true);
      if (typeof window !== 'undefined') {
        const savedProfile = sessionStorage.getItem('current_profile');
        if (savedProfile) {
          setSelectedProfile(JSON.parse(savedProfile));
        }
      }
    }, []);

    useEffect(() => {
      const fetchMovies = async () => {
        try {
          const { data, error } = await supabase
            .from('movies')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error fetching movies:', error);
            setError(error);
          } else {
            setMovies(data || []);
          }
        } catch (e) {
          console.error('Exception fetching movies:', e);
          setError(e);
          setMovies([]);
        }
      };

      fetchMovies();
    }, []);

    // Helper function to convert age rating string to number
    const getAgeRatingNumber = (ageRating) => {
      if (!ageRating) return 10; // Default to 10+ if not set
      const match = ageRating.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 10;
    };

    const filterMoviesByAge = (moviesToFilter) => {
      if (!selectedProfile?.is_kid) {
        return moviesToFilter; // Pas de filtre pour les profils adultes
      }
      return moviesToFilter.filter(movie => getAgeRatingNumber(movie.age_rating) <= 10);
    };

    const isNewMovie = (movie) => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const movieDate = new Date(movie.created_at);
      return movieDate >= twoWeeksAgo;
    };

    const [percentages, setPercentages] = useState({});
    
    const getRandomPercentage = (movieId) => {
      if (!isClient) return 90; // Valeur par défaut pour le serveur
      if (percentages[movieId]) return percentages[movieId];
      const value = Math.floor(Math.random() * 21) + 80;
      setPercentages(prev => ({ ...prev, [movieId]: value }));
      return value;
    };

    const genreMovies = filterMoviesByAge(movies.filter(movie => {
    try {
      if (!movie || !movie.category) return false;
      
      // Fonction de normalisation
      const normalize = (str) => 
        str.normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
          .replace(/[-\s]/g, "") // Enlève espaces et tirets
          .toLowerCase(); // Met en minuscule

      // On divise la catégorie en plusieurs genres si elle a des virgules
      const movieCategories = String(movie.category).toLowerCase().split(/[,;]/).map(s => s.trim());
      const normalizedMovieCategories = movieCategories.map(normalize);
      
      const normalizedSlug = normalize(normalizedSlug);
      const normalizedGenreName = genre?.name ? normalize(genre.name) : '';
      
      // Vérifie si la catégorie du film contient le slug OU le nom du genre
      return normalizedMovieCategories.some(cat => 
        cat.includes(normalizedSlug) || (normalizedGenreName && cat.includes(normalizedGenreName))
      );
    } catch (e) {
      console.error('Error filtering movie:', e, movie);
      return false;
    }
  }));

    if (error) {
      return (
        <main className={styles.container}>
          <header className={styles.header}>
            <h1 className={`${styles.logo} text-glow-primary`}>
              NARU<span>.STREAM</span>
            </h1>
          </header>
          <section className={styles.searchResults}>
            <h3 className={styles.sectionTitle}>Erreur</h3>
            <p style={{ color: 'white', textAlign: 'center', padding: '3rem 0' }}>
              Une erreur est survenue: {String(error)}
            </p>
          </section>
        </main>
      );
    }

    if (!genre) {
      return (
        <main className={styles.container}>
          <header className={styles.header}>
            <h1 className={`${styles.logo} text-glow-primary`}>
              NARU<span>.STREAM</span>
            </h1>
          </header>
          <section className={styles.searchResults}>
            <h3 className={styles.sectionTitle}>Genre introuvable</h3>
            <p style={{ color: 'white', textAlign: 'center', padding: '3rem 0' }}>Ce genre n'existe pas.</p>
          </section>
        </main>
      );
    }

    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={`${styles.logo} text-glow-primary`}>
            NARU<span>.STREAM</span>
          </h1>
          <nav className={styles.nav}>
            <Link href="/" className={styles.navLink}>Accueil</Link>
          </nav>
        </header>

        <section className={styles.searchResults}>
          <h3 className={styles.sectionTitle}>{genre.name}</h3>
          {genreMovies.length === 0 ? (
            <p style={{ color: 'white', textAlign: 'center', padding: '3rem 0' }}>Aucun film dans ce genre pour le moment.</p>
          ) : (
            <div className={styles.grid}>
              {genreMovies.map((movie) => (
                <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
                  <div style={{ position: 'relative' }}>
                    {isNewMovie(movie) && <span className={styles.newBadge}>NOUVEAU</span>}
                    <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                    <div className={styles.matchPercentage}>{getRandomPercentage(movie.id)}%</div>
                  </div>
                  <div className={styles.movieInfo}>
                    <h4 className={styles.movieTitle}>{movie.title}</h4>
                    <span className={styles.movieMeta}>HD</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    );
  } catch (e) {
    console.error('GenrePage error:', e);
    return (
      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={`${styles.logo} text-glow-primary`}>
            NARU<span>.STREAM</span>
          </h1>
        </header>
        <section className={styles.searchResults}>
          <h3 className={styles.sectionTitle}>Erreur</h3>
          <p style={{ color: 'white', textAlign: 'center', padding: '3rem 0' }}>
            Une erreur est survenue: {String(e)}
          </p>
        </section>
      </main>
    );
  }
}
