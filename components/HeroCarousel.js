"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./HeroCarousel.module.css";
import { supabase } from "@/lib/supabase";

export default function HeroCarousel({ movies }) {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Charger les bannières OU fallback sur les films (RAPIDE !)
  useEffect(() => {
    // D'abord, on prépare les films en fallback pour que ça soit instantané
    const fallbackBanners = movies.map(movie => ({
      id: movie.id,
      title: movie.title,
      description: movie.description,
      image_url: movie.backdrop_url || movie.poster_url,
      link_url: `/movie/${movie.id}`
    }));
    
    // Puis on essaie de charger les vraies bannières depuis la BDD
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banners")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });
          
        if (!error && data && data.length > 0) {
          setBanners(data);
        }
      } catch (e) {
        console.error("Erreur chargement bannières:", e);
      }
    };
    
    setBanners(fallbackBanners); // Affiche qqchose IMMÉDIATEMENT
    fetchBanners();
  }, [movies]);

  const nextSlide = useCallback(() => {
    if (isTransitioning || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, banners.length]);

  const prevSlide = useCallback(() => {
    if (isTransitioning || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, banners.length]);

  const goToSlide = useCallback((index) => {
    if (isTransitioning || index === currentIndex || banners.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, currentIndex, banners.length]);

  const currentBanner = banners.length > 0 ? banners[currentIndex] : null;

  // Auto-switch to next banner every 10 seconds
  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 10000);

    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) {
    return null;
  }

  return (
    <section className={styles.hero}>
      <div
        className={styles.heroBg}
        style={{
          backgroundImage: `linear-gradient(to top, #0a0a0a 0%, rgba(10, 10, 10, 0.4) 50%, rgba(10, 10, 10, 0.2) 100%), url(${currentBanner.image_url})`,
        }}
      ></div>

      <div className={styles.heroContent}>
        <h2 className={`${styles.heroTitle} text-glow-primary`}>{currentBanner.title}</h2>
        <p className={styles.heroDesc}>
          {currentBanner.description || "Plongez dans un catalogue premium de films et séries. Streaming en très haute définition, sans limites."}
        </p>
        <div style={{ display: "flex", gap: "15px" }}>
          {currentBanner.link_url && (
            <Link href={currentBanner.link_url} className="cyber-button primary">
              Voir Plus
            </Link>
          )}
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
          {banners.map((_, index) => (
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
