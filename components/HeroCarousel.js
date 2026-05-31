"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./HeroCarousel.module.css";

export default function HeroCarousel({ movies }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const nextSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % movies.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, movies.length]);

  const prevSlide = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, movies.length]);

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentIndex]);

  const currentMovie = movies.length > 0 ? movies[currentIndex] : null;

  // Auto-switch to next movie every 10 seconds
  useEffect(() => {
    if (movies.length === 0) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 10000); // 10 secondes

    return () => clearInterval(interval);
  }, [movies.length, nextSlide]);

  if (movies.length === 0) {
    return null;
  }

  return (
    <section className={styles.hero}>
      <div
        className={styles.heroBg}
        style={{
          backgroundImage: `linear-gradient(to top, #0a0a0a 0%, rgba(10, 10, 10, 0.4) 50%, rgba(10, 10, 10, 0.2) 100%), url(${currentMovie.backdrop_url || currentMovie.poster_url})`,
        }}
      ></div>

      <div className={styles.heroContent}>
        <h2 className={`${styles.heroTitle} text-glow-primary`}>{currentMovie.title}</h2>
        <p className={styles.heroDesc}>
          {currentMovie.description || "Plongez dans un catalogue premium de films et séries. Streaming en très haute définition, sans limites."}
        </p>
        <div style={{ display: "flex", gap: "15px" }}>
          <Link href={`/movie/${currentMovie.id}`} className="cyber-button primary">
            Regarder Maintenant
          </Link>
        </div>
      </div>

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
    </section>
  );
}
