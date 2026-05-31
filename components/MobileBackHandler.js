"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function MobileBackHandler() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Gérer le bouton retour Android (via la touche Escape ou le bouton physique)
    const handleBack = (event) => {
      if (event.key === "Escape" || event.type === "popstate") {
        if (pathname === "/") {
          // Sur la page d'accueil : ne rien faire (empêcher de quitter l'app)
          event.preventDefault();
          return false;
        } else {
          // Sinon : retour en arrière
          router.back();
        }
      }
    };

    window.addEventListener("keydown", handleBack);
    window.addEventListener("popstate", handleBack);

    return () => {
      window.removeEventListener("keydown", handleBack);
      window.removeEventListener("popstate", handleBack);
    };
  }, [pathname, router]);

  return null;
}
