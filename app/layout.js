"use client";

import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MobileBackHandler from "@/components/MobileBackHandler";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
});

// Catchy title options that change
const titleOptions = [
  "🍥 NaruStream - Streaming Ninja Premium",
  "⚡ NaruStream - Votre Source pour les Films Naruto",
  "🔥 NaruStream - Le Meilleur Streaming Naruto",
  "👊 NaruStream - Anime Ninja en HD",
  "🌟 NaruStream - Les Films Naruto en Streaming",
  "🎬 NaruStream - Votre Portail Ninja",
  "💥 NaruStream - Streaming Naruto 24/7",
  "🦊 NaruStream - La Plateforme des Ninjas",
];

// Routes that are accessible without login
const publicRoutes = ["/login", "/profiles", "/admin"];
// Routes that don't require profile selection
const noProfileRequiredRoutes = ["/login", "/profiles", "/admin"];

// Fonction pour vider le cache navigateur (sans toucher localStorage/sessionStorage)
const clearBrowserCache = () => {
  if (typeof window !== 'undefined' && 'caches' in window) {
    caches.keys().then(names => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
};

export default function RootLayout({ children }) {
  const [currentTitle, setCurrentTitle] = useState(titleOptions[0]);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const [isLegalDismissed, setIsLegalDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('legal_dismissed');
      if (dismissed !== 'true') {
        setIsLegalDismissed(false);
      }
    }
  }, []);

  const handleDismissLegal = () => {
    setIsLegalDismissed(true);
    localStorage.setItem('legal_dismissed', 'true');
  };

  const handleShowLegal = () => {
    setIsLegalDismissed(false);
    localStorage.removeItem('legal_dismissed');
  };

  // Vider le cache à chaque chargement de l'app
  useEffect(() => {
    clearBrowserCache();
    router.refresh();

    // App resume / focus refresh logic for mobile and windows apps
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        clearBrowserCache();
        // If not on a movie or episode page, do a hard reload to ensure fresh content
        if (!window.location.pathname.startsWith('/movie') && !window.location.pathname.startsWith('/episode')) {
          window.location.reload();
        } else {
          // Soft refresh for video pages to not interrupt playback if they paused
          router.refresh();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [router]);

  // Rotate title every 25 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * titleOptions.length);
      setCurrentTitle(titleOptions[randomIndex]);
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // Update document title
  useEffect(() => {
    document.title = currentTitle;
  }, [currentTitle]);

  // Check authentication and profile in background
  useEffect(() => {
    let authSubscription;

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (user) {
          try {
            const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
            setIsAdmin(profile?.is_admin || false);
          } catch (e) {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
        
        // Redirect to login if not authenticated and not on public route
        if (!user && !publicRoutes.includes(pathname)) {
          router.push("/login");
          return;
        }

        // Redirect to profiles if authenticated, on private route, and no profile selected
        if (user && !noProfileRequiredRoutes.includes(pathname)) {
          if (typeof window !== 'undefined') {
            let savedProfile = sessionStorage.getItem('current_profile');
            if (!savedProfile) {
              router.push("/profiles");
            }
          }
        }
      } catch (e) {
        console.error("Auth error:", e);
      }
    };
    checkAuth();

    // Listen for auth changes
    authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      setUser(user);
      
      if (user) {
        try {
          const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
          setIsAdmin(profile?.is_admin || false);
        } catch (e) {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      
      if (!user && !publicRoutes.includes(pathname)) {
        router.push("/login");
        return;
      }

      if (user && !noProfileRequiredRoutes.includes(pathname)) {
        if (typeof window !== 'undefined') {
          let savedProfile = sessionStorage.getItem('current_profile');
          if (!savedProfile) {
            router.push("/profiles");
          }
        }
      }
    });

    return () => {
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, [pathname]);

  return (
    <html lang="fr" className={`${inter.variable} ${orbitron.variable}`}>
      <head>
        <link rel="icon" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a0a0a" />
        {/* Pas de cache ! Force le navigateur à toujours charger la version la plus récente */}
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0" />
        <meta http-equiv="Pragma" content="no-cache" />
        <meta http-equiv="Expires" content="0" />
        {/* Additional anti-popup security */}
        <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-src *; img-src * data: blob:; media-src * data: blob:;" />
      </head>
      <body>
        <MobileBackHandler />
        {children}
        {!isLegalDismissed ? (
          <div className="legal-notice-banner">
            <span className="legal-notice-icon">⚠</span>
            <p>
              <strong>Avertissement Légal :</strong> La communauté NaruStream n&apos;héberge aucun film ni contenu vidéo sur ses serveurs. Le site se limite exclusivement au référencement de liens hypertextes pointant vers des lecteurs externes ou des sites existants. Des dysfonctionnements ou des erreurs de lecture/bande-annonce peuvent parfois survenir en raison de ces flux tiers. Aucune donnée personnelle n&apos;est collectée ou conservée par le service.
            </p>
            <button onClick={handleDismissLegal} className="legal-notice-ok-btn">
              OK
            </button>
          </div>
        ) : (
          <div className="legal-notice-minimized">
            <button onClick={handleShowLegal} className="legal-notice-toggle-btn">
              Avertissement Légal ⚠
            </button>
          </div>
        )}
      </body>
    </html>
  );
}
