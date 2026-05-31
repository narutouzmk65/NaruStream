"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import styles from "./download.module.css";

export default function DownloadPage() {
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [user, setUser] = useState(null);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));
    setIsWindows(/win/.test(userAgent));

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    checkUser();
  }, []);

  const trackDownload = async (platform) => {
    try {
      await supabase.from('downloads').insert([
        { platform, user_id: user?.id || null }
      ]);
    } catch (e) {
      console.error('Error tracking download:', e);
    }
  };

  const handleDownload = async (platform) => {
    setDownloading(platform);
    await trackDownload(platform);

    const links = {
      windows: '/downloads/NaruStream-Windows.exe',
      android: 'https://github.com/narutouzmk65/NaruStream/archive/refs/heads/main.zip',
      ios: 'https://github.com/narutouzmk65/NaruStream/archive/refs/heads/main.zip'
    };

    // Utiliser fetch pour télécharger, puis créer un blob (meilleure expérience)
    try {
      const response = await fetch(links[platform]);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const filenames = {
        windows: 'narustream-windows.zip',
        android: 'narustream-android.zip',
        ios: 'narustream-ios.zip'
      };
      link.download = filenames[platform];
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      // Si fetch échoue, utiliser la méthode ancienne
      const link = document.createElement('a');
      link.href = links[platform];
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    
    setTimeout(() => {
      setDownloading(null);
    }, 3000); // Augmenter le délai pour être sûr
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Télécharger NaruStream</h1>
        <p className={styles.description}>
          Profitez de votre expérience de streaming préférée sur mobile, desktop et plus !
        </p>

        <div className={styles.platforms}>
          {/* Windows */}
          <div className={styles.platformCard}>
            <div className={styles.platformIcon}>🪟</div>
            <h2>Windows</h2>
            <p>Pour Windows 10 et 11</p>
            <button
              onClick={() => handleDownload('windows')}
              disabled={downloading === 'windows'}
              className={styles.downloadBtn}
            >
              {downloading === 'windows' ? 'Téléchargement en cours...' : 'Télécharger EXE'}
            </button>
          </div>

          {/* Android */}
          <div className={styles.platformCard}>
            <div className={styles.platformIcon}>🤖</div>
            <h2>Android</h2>
            <p>Pour téléphones et tablettes Android</p>
            <button
              onClick={() => handleDownload('android')}
              disabled={downloading === 'android'}
              className={styles.downloadBtn}
            >
              {downloading === 'android' ? 'Téléchargement en cours...' : 'Télécharger APK'}
            </button>
          </div>

          {/* iOS */}
          <div className={styles.platformCard}>
            <div className={styles.platformIcon}>🍎</div>
            <h2>iOS</h2>
            <p>Pour iPhone et iPad</p>
            <button
              onClick={() => handleDownload('ios')}
              disabled={downloading === 'ios'}
              className={styles.downloadBtn}
            >
              {downloading === 'ios' ? 'Téléchargement en cours...' : 'Télécharger IPA'}
            </button>
          </div>
        </div>

        <div className={styles.instructions}>
          <h3>Instructions d'installation</h3>
          <div className={styles.instructionList}>
            <div className={styles.instructionItem}>
              <strong>Windows :</strong>
              <p>
                Double-cliquez sur le fichier EXE et suivez les instructions à l'écran.
              </p>
            </div>
            <div className={styles.instructionItem}>
              <strong>Android :</strong>
              <p>
                Activer les "Sources inconnues" dans les paramètres, puis ouvrir le fichier APK pour l'installer.
              </p>
            </div>
            <div className={styles.instructionItem}>
              <strong>iOS :</strong>
              <p>
                Utilisez TestFlight ou un outil de signature d'IPA pour installer l'application sur votre appareil.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
