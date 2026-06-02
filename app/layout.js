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

  // Vider le cache à chaque chargement de l'app
  useEffect(() => {
    clearBrowserCache();
    router.refresh();
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
      </body>
    </html>
  );
}
