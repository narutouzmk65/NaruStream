"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./HeroCarousel.module.css";

const convertToEmbedUrl = (url, isMuted) => {
  if (!url) return null;
  const videoIdMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/
  );
  if (videoIdMatch && videoIdMatch[1]) {
    return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&mute=${isMuted ? 1 : 0}&modestbranding=1&rel=0&showinfo=0&controls=0&loop=1&playlist=${videoIdMatch[1]}&playsinline=1&fs=0&disablekb=1&iv_load_policy=3&quality=hd1080`;
  }
  return url;
};

export default function HeroCarousel({ movies }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerFailed, setTrailerFailed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Listen for movie page opened event to mute
  useEffect(() => {
    const handleMoviePageOpened = () => {
      setIsMuted(true);
    };

    window.addEventListener('moviePageOpened', handleMoviePageOpened);
    return () => window.removeEventListener('moviePageOpened', handleMoviePageOpened);
  }, []);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowTrailer(false);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, movies.length]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setShowTrailer(false);
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, movies.length]);

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setShowTrailer(false);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentIndex]);

  const currentMovie = movies.length > 0 ? movies[currentIndex] : null;
  const trailerEmbedUrl = currentMovie ? convertToEmbedUrl(currentMovie.trailer_url, isMuted) : null;

  // Auto-show trailer after 2 seconds if available
  useEffect(() => {
    setShowTrailer(false); // Reset trailer state when movie changes
    setTrailerFailed(false); // Reset failure state when movie changes
    
    if (trailerEmbedUrl) {
      const autoShowTimer = setTimeout(() => {
        setShowTrailer(true);
      }, 2000);
      return () => clearTimeout(autoShowTimer);
    }
  }, [currentIndex, trailerEmbedUrl]);

  // Auto-switch to next movie every 50 seconds
  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 50000);

    return () => clearInterval(interval);
  }, [movies.length, nextSlide]);

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.hero}>
      {trailerEmbedUrl && showTrailer && !trailerFailed ? (
        <>
          <iframe
            src={trailerEmbedUrl}
            className={styles.heroTrailer}
            allowFullScreen
            frameBorder="0"
            loading="eager"
            referrerPolicy="origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; *"
            onError={() => setTrailerFailed(true)}
          ></iframe>
        </>
      ) : (
        <div
          className={styles.heroBg}
          style={{
            backgroundImage: `linear-gradient(to top, #0a0a0a 0%, rgba(10, 10, 10, 0.4) 50%, rgba(10, 10, 10, 0.2) 100%), url(${currentMovie.backdrop_url || currentMovie.poster_url})`,
          }}
        ></div>
      )}

      <div className={styles.heroContent}>
        <h2 className={`${styles.heroTitle} text-glow-primary`}>{currentMovie.title}</h2>
        <p className={styles.heroDesc}>
          {currentMovie.description || "Plongez dans un catalogue premium de films et séries. Streaming en très haute définition, sans limites."}
        </p>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href={`/movie/${currentMovie.id}`} className="cyber-button primary">
            Regarder Maintenant
          </Link>
          {trailerEmbedUrl && (
            <button className="cyber-button" onClick={() => setShowTrailer(!showTrailer)}>
              {showTrailer ? "Fermer Bande-Annonce" : "Voir Bande-Annonce"}
            </button>
          )}
        </div>
      </div>

      {!showTrailer && (
        <>
          <button className={styles.navArrow} onClick={prevSlide}>
            ‹
          </button>
          <button className={styles.navArrow} style={{ right: "2rem" }} onClick={nextSlide}>
            ›
          </button>

          <div className={styles.dotsContainer}>
            {movies.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${index === currentIndex ? styles.active : ""}`}
                onClick={() => goToSlide(index)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
