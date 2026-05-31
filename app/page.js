"use client";
import Link from "next/link";
import { useState, useEffect, Suspense, useRef } from "react";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabase";
import SearchBar from "@/components/SearchBar";
import HeroCarousel from "@/components/HeroCarousel";

// Fonction pour vider le cache SANS toucher les données importantes
const clearBrowserCache = () => {
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
  
  // Garde les clés importantes : profile selectionné, auth admin, maintenance mode
  const keysToKeep = ['current_profile', 'adminAuthenticated', 'maintenance_mode', 'lastCacheClear'];
  const tempStorage = {};
  
  // Sauvegarder les valeurs importantes
  keysToKeep.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) tempStorage[key] = value;
  });
  
  // Effacer localStorage puis remettre les valeurs importantes
  localStorage.clear();
  Object.keys(tempStorage).forEach(key => {
    localStorage.setItem(key, tempStorage[key]);
  });
  
  // Ne pas toucher sessionStorage (où le profile est aussi stocké souvent)
  // sessionStorage.clear(); // Commenté pour préserver le profil
};

// Vider le cache à chaque ouverture du site
const checkAndClearCache = () => {
  clearBrowserCache();
  const now = new Date().getTime();
  localStorage.setItem('lastCacheClear', now.toString());
};



// Films de test par défaut (toujours affichés)
const DEFAULT_MOVIES = [
  {
    id: "1",
    title: "Le Roi Lion",
    description: "Un lion prince doit reconquérir son trône",
    poster_url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop",
    category: "Animation, Famille",
    content_type: "film",
    age_rating: "Tous publics",
    platform: "Disney+",
    status: "sortie",
    created_at: new Date().toISOString()
  },
  {
    id: "2",
    title: "John Wick",
    description: "Un ex-assassin à la retraite reprend du service",
    poster_url: "https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop",
    backdrop_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=600&fit=crop",
    category: "Action, Thriller",
    content_type: "film",
    age_rating: "16+",
    platform: "Netflix",
    status: "sortie",
    created_at: new Date().toISOString()
  },
  {
    id: "3",
    title: "Stranger Things",
    description: "Un groupe d'amis découvre des expériences secrètes",
    poster_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    backdrop_url: "https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop",
    category: "Science-Fiction, Horreur",
    content_type: "serie",
    age_rating: "12+",
    platform: "Netflix",
    status: "sortie",
    created_at: new Date().toISOString()
  },
  {
    id: "4",
    title: "Interstellar",
    description: "Un voyage à travers l'espace pour sauver l'humanité",
    poster_url: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop",
    backdrop_url: "https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop",
    category: "Science-Fiction, Drame",
    content_type: "film",
    age_rating: "12+",
    platform: "Max",
    status: "sortie",
    created_at: new Date().toISOString()
  },
  {
    id: "5",
    title: "La La Land",
    description: "Un pianiste et une actrice tombent amoureux à Los Angeles",
    poster_url: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop",
    backdrop_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=1200&h=600&fit=crop",
    category: "Comédie, Romance, Musical",
    content_type: "film",
    age_rating: "Tous publics",
    platform: "Prime Video",
    status: "sortie",
    created_at: new Date().toISOString()
  }
];

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

export default function Home() {
  const [movies, setMovies] = useState(DEFAULT_MOVIES);
  const [sagas, setSagas] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const carouselRefs = useRef({});
  const [isClient, setIsClient] = useState(false);
  const [percentages, setPercentages] = useState({});
  const [greeting, setGreeting] = useState("Bienvenue !"); // Valeur par défaut
  
  const unreadNotifications = notifications.filter(n => !n.is_read);
  
  const scrollCarousel = (key, direction) => {
    const carousel = carouselRefs.current[key];
    if (!carousel) return;
    const scrollAmount = 600;
    carousel.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  };

  useEffect(() => {
    // Vider le cache si nécessaire
    checkAndClearCache();
    
    setIsClient(true);
    // Récupérer le profil sélectionné depuis sessionStorage (only in browser)
    if (typeof window !== 'undefined') {
      const savedProfile = sessionStorage.getItem('current_profile');
      if (savedProfile) {
        setSelectedProfile(JSON.parse(savedProfile));
      }
    }

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        try {
          const { data: notifData, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          if (!error) {
            setNotifications(notifData || []);
          }
        } catch (e) {
          // Ignore if notifications table doesn't exist
        }
      }
    };
    checkUser();

    const fetchMovies = async () => {
      console.log("🔍 Début fetchMovies...");
      try {
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn('⚠️ Erreur Supabase, on garde les films de test :', error);
        } else if (data && data.length > 0) {
          console.log("✅ Films récupérés depuis Supabase !", data.length, "films");
          setMovies(data);
        } else {
          console.log("ℹ️ Aucun film dans Supabase, on garde les films de test.");
        }
      } catch (e) {
        console.warn("⚠️ Erreur générale, on garde les films de test :", e);
      }
    };

    const fetchSagas = async () => {
      const { data, error } = await supabase
        .from('sagas')
        .select('*, saga_movies(*, movies(*))')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sagas:', error);
      } else {
        setSagas(data || []);
      }
    };

    fetchMovies();
    fetchSagas();
  }, []);

  // Générer le greeting seulement après le mount (pour éviter hydration error)
  useEffect(() => {
    if (isClient && selectedProfile) {
      setGreeting(generateGreeting());
    }
  }, [isClient, selectedProfile]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
        
      if (!error) {
        setNotifications(prev => prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        ));
      }
    } catch (e) {
      // Ignore if notifications table doesn't exist
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = unreadNotifications.map(n => n.id);
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds);
        
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      }
    } catch (e) {
      // Ignore if notifications table doesn't exist
    }
  };

  const handleSearch = (q) => {
    setSearchQuery(q);
  };

  // Helper function to convert age rating string to number
  const getAgeRatingNumber = (ageRating) => {
    if (!ageRating) return 10; // Default to 10+ if not set
    const match = ageRating.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 10;
  };

  // Filtrer les films en fonction de l'âge du profil
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

  const getRandomPercentage = (movieId) => {
    if (!isClient) return 90; // Valeur par défaut pour le serveur
    if (percentages[movieId]) return percentages[movieId];
    const value = Math.floor(Math.random() * 21) + 80;
    setPercentages(prev => ({ ...prev, [movieId]: value }));
    return value;
  };

  // Générer le greeting seulement après le mount (pour éviter hydration error)
  const generateGreeting = () => {
    const hour = new Date().getHours();
    const name = selectedProfile?.name || "ninja";
    const greetings = {
      morning: [
        `Bonjour ${name} ! On regarde quoi ce matin ? 🍜`,
        `Hey ${name} ! Prêt pour une session de binge-watching ? ☀️`,
        `Salut ${name} ! Un bon film pour bien commencer la journée ? 🎬`,
        `Morning ${name} ! Choisis ton programme ! 🥢`
      ],
      afternoon: [
        `Bon après-midi ${name} ! On se détend avec un film ? 🍿`,
        `Hey ${name} ! L'après-midi parfait pour un épisode ? 🍕`,
        `Salut ${name} ! Prêt pour un peu d'action ? 💥`,
        `Afternoon ${name} ! De quoi satisfaire ton inner ninja ? 🥷`
      ],
      evening: [
        `Bonsoir ${name} ! Un film pour terminer la journée ? 🌙`,
        `Hey ${name} ! Le moment parfait pour regarder quelque chose ? 🎬`,
        `Salut ${name} ! C'est l'heure du binge ! 🍿`,
        `Evening ${name} ! De quoi te divertir ce soir ? 🎭`
      ]
    };

    let timeOfDay;
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';

    const options = greetings[timeOfDay];
    return options[Math.floor(Math.random() * options.length)];
  };

  const filteredMovies = filterMoviesByAge(
    searchQuery
      ? movies.filter(movie => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
      : movies
  );

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.logo} text-glow-primary`}>
          NARU<span>.STREAM</span>
        </h1>
        <nav className={styles.nav}>
          {/* Barre de recherche - toujours affichée */}
          <Suspense fallback={null}>
            <SearchBar onSearch={handleSearch} />
          </Suspense>
          
          {/* Boutons desktop seulement */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Link href="/" className={`${styles.navLink} ${styles.desktopOnly}`}>Accueil</Link>
            <Link href="/ma-liste" className={`${styles.navLink} ${styles.desktopOnly}`}>Ma Liste</Link>
            
            {/* Genre Dropdown */}
            <div 
              className={`${styles.dropdown} ${styles.desktopOnly}`}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button>Genres ▾</button>
              {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                  {genres.map(genre => (
                    <Link 
                      href={`/genre/${genre.slug}`} 
                      key={genre.slug}
                      className={styles.dropdownItem}
                    >
                      {genre.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Prominent Request Button */}
            <Link href="/request" className={`${styles.navLink} ${styles.requestButton} ${styles.desktopOnly}`}>
              🎬 Demander un film
            </Link>
            
            {/* Contact Button */}
            <Link href="/contact" className={`${styles.navLink} ${styles.desktopOnly}`}>
              📞 Contact
            </Link>

            {/* Download Button */}
            <Link href="/download" className={`${styles.navLink} ${styles.requestButton} ${styles.desktopOnly}`}>
              📲 Télécharger
            </Link>
            
            {/* Notifications */}
            {user && (
              <div style={{ position: 'relative' }} className={styles.desktopOnly}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'white',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  🔔
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: 'var(--neon-pink)',
                        color: 'white',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {notifications.filter(n => !n.is_read).length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      width: '350px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      background: 'rgba(20, 20, 20, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      zIndex: 1000,
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ color: 'white', margin: 0 }}>Notifications</h4>
                      {unreadNotifications.length > 0 && (
                        <button
                          onClick={() => markAllAsRead()}
                          style={{
                            background: 'var(--neon-blue)',
                            border: 'none',
                            color: 'white',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          Marquer tout comme lu
                        </button>
                      )}
                    </div>
                    {unreadNotifications.length === 0 ? (
                      <p style={{ color: '#aaa' }}>Aucune notification non lue</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {unreadNotifications.map(notif => (
                          <div 
                            key={notif.id}
                            onClick={() => markAsRead(notif.id)}
                            style={{
                              padding: '0.75rem',
                              background: 'rgba(255,255,255,0.05)',
                              borderRadius: '6px',
                              border: '1px solid var(--neon-blue)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <strong style={{ color: 'white' }}>{notif.title}</strong>
                            <p style={{ color: '#aaa', margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{notif.message}</p>
                            <span style={{ color: '#666', fontSize: '0.8rem' }}>
                              {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Auth Links */}
            {user ? (
              <Link href="/profiles" className={`${styles.navLink} ${styles.requestButton} ${styles.desktopOnly}`}>
                🎭 Profils
              </Link>
            ) : (
              <div className={styles.desktopOnly}>
                <Link href="/login" className={styles.navLink}>Se connecter</Link>
                <Link href="/login" className={`${styles.navLink} ${styles.requestButton}`}>S'inscrire</Link>
              </div>
            )}
          </div>
        </nav>
      </header>

      {/* Greeting Section */}
      {selectedProfile && (
        <div className={styles.greetingSection}>
          <h2 className={styles.greetingText}>
            {greeting}
          </h2>
        </div>
      )}

      {searchQuery ? (
        <section className={styles.searchResults}>
          <h3 className={styles.sectionTitle}>Résultats pour &quot;{searchQuery}&quot;</h3>
          <div className={styles.grid}>
            {filteredMovies.length === 0 ? (
              <p style={{ color: 'white', gridColumn: '1 / -1', fontSize: '1.2rem', textAlign: 'center', padding: '3rem 0' }}>Aucun film ne correspond à votre recherche.</p>
            ) : (
              filteredMovies.map((movie) => (
                <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
                  <div style={{ position: 'relative' }}>
                    {isNewMovie(movie) && <span className={styles.newBadge}>NOUVEAU</span>}
                    <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                    <div className={styles.matchPercentage}>{getRandomPercentage(movie.id)}%</div>
                    {/* Badges organized better */}
                    <div style={{ 
                      position: 'absolute', 
                      top: '0.75rem', 
                      left: '0.75rem', 
                      display: 'flex', 
                      gap: '0.4rem', 
                      flexWrap: 'wrap',
                      maxWidth: 'calc(100% - 1.5rem)'
                    }}>
                      {movie.status && (
                        <span style={{
                          background: movie.status === 'sortie' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'linear-gradient(135deg, #f97316, #ea580c)',
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
                          {movie.status === 'sortie' ? 'SORTIE' : 'À VENIR'}
                        </span>
                      )}
                      {movie.age_rating && (
                        <span style={{
                          background: getAgeRatingNumber(movie.age_rating) <=10 ? 'linear-gradient(135deg, #4ade80, #22c55e)' : 
                                      getAgeRatingNumber(movie.age_rating) <=12 ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' :
                                      getAgeRatingNumber(movie.age_rating) <=16 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' :
                                      'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          padding: '0.3rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: '700',
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          {movie.age_rating}
                        </span>
                      )}
                      {movie.platform && (
                        <span style={{
                          background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
                          color: 'white',
                          padding: '0.3rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          textShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                        }}>
                          {movie.platform}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={styles.movieInfo}>
                    <h4 className={styles.movieTitle}>{movie.title}</h4>
                    <span className={styles.movieMeta}>HD</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      ) : (
        <>
          <HeroCarousel movies={movies} />
          <section>
          <h3 className={styles.sectionTitle}>Les tendances du moment sur NaruStream</h3>
            <div className={styles.carouselContainer}>
              <button className={`${styles.carouselArrow} ${styles.left}`} onClick={() => scrollCarousel('trending', -1)}>
                ‹
              </button>
              <div className={styles.carousel} ref={el => carouselRefs.current['trending'] = el}>
              {movies.map((movie) => (
              <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard}>
                <div style={{ position: 'relative' }}>
                    {isNewMovie(movie) && <span className={styles.newBadge}>NOUVEAU</span>}
                    <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                    <div className={styles.matchPercentage}>{getRandomPercentage(movie.id)}%</div>
                    {/* Age rating in top-right, NOUVEAU in top-left */}
                        <div style={{ 
                          position: 'absolute', 
                          top: '0.75rem', 
                          right: '0.75rem', 
                          display: 'flex', 
                          gap: '0.5rem', 
                          flexWrap: 'wrap',
                          maxWidth: 'calc(100% - 1.5rem)'
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
            ))}
              </div>
              <button className={`${styles.carouselArrow} ${styles.right}`} onClick={() => scrollCarousel('trending', 1)}>
                ›
              </button>
            </div>
          </section>
          
          {/* Genre Sections */}
          {genres.map(genre => {
            const normalize = (str) => 
              str.normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // Enlève les accents
                .replace(/[-\s]/g, "") // Enlève espaces et tirets
                .toLowerCase(); // Met en minuscule
            const genreMovies = filterMoviesByAge(movies.filter(movie => {
              if (!movie || !movie.category) return false;
              
              // On divise la catégorie en plusieurs genres si elle a des virgules
              const movieCategories = String(movie.category).toLowerCase().split(/[,;]/).map(s => s.trim());
              const normalizedMovieCategories = movieCategories.map(normalize);
              
              const normalizedSlug = normalize(genre.slug);
              const normalizedGenreName = normalize(genre.name);
              
              return normalizedMovieCategories.some(cat => 
                cat.includes(normalizedSlug) || cat.includes(normalizedGenreName)
              );
            }));
            
            if (genreMovies.length === 0) return null;
            
            return (
              <section key={genre.slug}>
                <h3 className={styles.sectionTitle}>{genre.name}</h3>
                <div className={styles.carouselContainer}>
                  <button className={`${styles.carouselArrow} ${styles.left}`} onClick={() => scrollCarousel(genre.slug, -1)}>
                    ‹
                  </button>
                  <div className={styles.carousel} ref={el => carouselRefs.current[genre.slug] = el}>
                  {genreMovies.map((movie) => (
                    <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard} style={{ aspectRatio: movie.content_type === 'serie' ? '16/9' : '2/3' }}>
                      <div style={{ position: 'relative' }}>
                        {isNewMovie(movie) && (
                          <span style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            background: 'linear-gradient(135deg, #e50914, #b20710)',
                            color: 'white',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            textTransform: 'uppercase'
                          }}>
                            NOUVEAU
                          </span>
                        )}
                        <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                        <div className={styles.matchPercentage}>{getRandomPercentage(movie.id)}%</div>
                        {/* Age rating in top-right, same size as NOUVEAU */}
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
                  ))}
                  </div>
                  <button className={`${styles.carouselArrow} ${styles.right}`} onClick={() => scrollCarousel(genre.slug || saga.id, 1)}>
                    ›
                  </button>
                </div>
              </section>
            );
          })}
          
          {/* Sagas Sections */}
          {sagas.map(saga => {
            const sagaMovies = (saga.saga_movies || [])
              .sort((a, b) => a.order_number - b.order_number)
              .map(sm => sm.movies)
              .filter(Boolean);
            
            if (sagaMovies.length === 0) return null;
            
            const filteredSagaMovies = filterMoviesByAge(sagaMovies);
            
            if (filteredSagaMovies.length === 0) return null;
            
            return (
              <section key={saga.id}>
                <h3 className={styles.sectionTitle}>🍿 {saga.name}</h3>
                <div className={styles.carouselContainer}>
                  <button className={`${styles.carouselArrow} ${styles.left}`} onClick={() => scrollCarousel(saga.id, -1)}>
                    ‹
                  </button>
                  <div className={styles.carousel} ref={el => carouselRefs.current[saga.id] = el}>
                  {filteredSagaMovies.map((movie) => (
                    <Link href={`/movie/${movie.id}`} key={movie.id} className={styles.movieCard} style={{ aspectRatio: movie.content_type === 'serie' ? '16/9' : '2/3' }}>
                      <div style={{ position: 'relative' }}>
                        {isNewMovie(movie) && (
                          <span style={{
                            position: 'absolute',
                            top: '0.75rem',
                            left: '0.75rem',
                            background: 'linear-gradient(135deg, #e50914, #b20710)',
                            color: 'white',
                            padding: '0.4rem 0.7rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            textTransform: 'uppercase'
                          }}>
                            NOUVEAU
                          </span>
                        )}
                        <img src={movie.poster_url} alt={movie.title} className={styles.moviePoster} />
                        <div className={styles.matchPercentage}>{getRandomPercentage(movie.id)}%</div>
                        {/* Age rating in top-right, same size as NOUVEAU */}
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
                  ))}
                  </div>
                  <button className={`${styles.carouselArrow} ${styles.right}`} onClick={() => scrollCarousel(genre.slug || saga.id, 1)}>
                    ›
                  </button>
                </div>
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
