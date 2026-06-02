"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';
import { supabase } from '@/lib/supabase';

const ADMIN_PASSWORD = "admin123";

// Liste des genres disponibles
const GENRES = [
  "Animation",
  "Action",
  "Aventure",
  "Fantasy",
  "Horreur",
  "Romance",
  "Thriller",
  "Famille",
  "Historique",
  "Musical",
  "Comédie",
  "Drame",
  "Science-Fiction"
];

// Fonction pour vider seulement le cache navigateur (pas localStorage/sessionStorage)
const clearBrowserCache = () => {
  if ('caches' in window) {
    caches.keys().then(names => {
      for (let name of names) {
        caches.delete(name);
      }
    });
  }
};

// Vider le cache navigateur à chaque ouverture du site
const checkAndClearCache = () => {
  clearBrowserCache();
};

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('content');
  const [selectedSeriesForSeason, setSelectedSeriesForSeason] = useState(null);
  const [selectedSeasonForEpisode, setSelectedSeasonForEpisode] = useState(null);
  const [selectedEpisodeForBackup, setSelectedEpisodeForBackup] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sagas, setSagas] = useState([]);
  const [users, setUsers] = useState([]);
  const [streams, setStreams] = useState([]);
  const [episodeStreams, setEpisodeStreams] = useState([]);
  const [streamLogs, setStreamLogs] = useState([]);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contactMessages, setContactMessages] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [banners, setBanners] = useState([]);
  const [editingBanner, setEditingBanner] = useState(null);

  // Comprehensive Form State
  const [contentType, setContentType] = useState('film');
  const [movieTitle, setMovieTitle] = useState('');
  const [movieDesc, setMovieDesc] = useState('');
  const [moviePoster, setMoviePoster] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [category, setCategory] = useState('');
  const [ageRating, setAgeRating] = useState('10+');
  const [platform, setPlatform] = useState('');
  const [contentStatus, setContentStatus] = useState('sortie');
  const [serverName, setServerName] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [m3u8Url, setM3u8Url] = useState('');
  const [quality, setQuality] = useState('');

  // Series direct add state
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [newSeriesDesc, setNewSeriesDesc] = useState('');
  const [newSeriesPoster, setNewSeriesPoster] = useState('');
  const [newSeriesTrailer, setNewSeriesTrailer] = useState('');
  const [newSeriesYear, setNewSeriesYear] = useState('');
  const [newSeriesCategory, setNewSeriesCategory] = useState('');
  const [newSeriesAgeRating, setNewSeriesAgeRating] = useState('10+');
  const [newSeriesPlatform, setNewSeriesPlatform] = useState('');
  const [newSeriesStatus, setNewSeriesStatus] = useState('sortie');

  // Additional stream form state
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [addStreamUrl, setAddStreamUrl] = useState('');
  const [addM3u8Url, setAddM3u8Url] = useState('');
  const [addServerName, setAddServerName] = useState('');
  const [addQuality, setAddQuality] = useState('');
  const [isAddingStream, setIsAddingStream] = useState(false);

  // Episode backup stream state
  const [backupServerName, setBackupServerName] = useState('');
  const [backupStreamUrl, setBackupStreamUrl] = useState('');
  const [backupM3u8Url, setBackupM3u8Url] = useState('');
  const [backupQuality, setBackupQuality] = useState('');
  const [isAddingBackup, setIsAddingBackup] = useState(false);

  // Bulk JSON import state
  const [jsonInput, setJsonInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Editing state
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingSeason, setEditingSeason] = useState(null);
  const [editingEpisode, setEditingEpisode] = useState(null);
  const [editingSaga, setEditingSaga] = useState(null);
  const [selectedSagaForManagement, setSelectedSagaForManagement] = useState(null);

  // Saga form state
  const [newSagaName, setNewSagaName] = useState('');
  const [newSagaDesc, setNewSagaDesc] = useState('');
  const [newSagaPoster, setNewSagaPoster] = useState('');

  // Réinitialiser les états d'ajout au chargement de la page pour éviter les blocages
  useEffect(() => {
    setIsSubmitting(false);
    setIsAddingStream(false);
    setIsAddingBackup(false);
    setIsImporting(false);
  }, []);

  const [errorMessage, setErrorMessage] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  const handleDirectLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      });
      
      if (error) {
        setErrorMessage("Erreur connexion: " + error.message);
        setIsLoading(false);
        return;
      }
      
      // Maintenant on vérifie le statut admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("Utilisateur non trouvé après connexion");
        setIsLoading(false);
        return;
      }
      
      const { data: profile, error: profileError } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
      if (profileError || !profile?.is_admin) {
        await supabase.auth.signOut();
        setErrorMessage("Ce compte n'est pas admin !");
        setIsLoading(false);
        return;
      }
      
      // C'est bon, on est admin !
      setShowLoginForm(false);
      setIsAdmin(true);
      
      // On attend que l'utilisateur entre le mot de passe admin, puis on charge les données
      setIsLoading(false);
      
    } catch (err) {
      setErrorMessage("Erreur: " + err.message);
      setIsLoading(false);
    }
  };
  
  // Vérifier l'authentification et le statut admin
  useEffect(() => {
    const init = async () => {
      // Vérifier le cache d'abord
      checkAndClearCache();
      
      setIsLoading(true);
      
      try {
        // Détecter si on est en développement local
        const isLocal = window.location.hostname === 'localhost';
        
        if (isLocal) {
          // EN LOCAL : On saute la vérification de session (car ports différents), on demande juste le mot de passe !
          console.log("🏠 Mode LOCAL détecté, vérification admin simplifiée");
          setIsAdmin(true);
          setIsLoading(false);
          
          // Vérifier si on a déjà entré le mot de passe pour charger les données
          const savedAuth = sessionStorage.getItem('adminAuthenticated');
          if (savedAuth === 'true') {
            console.log("✅ Mot de passe déjà entré, chargement des données...");
            setIsAuthenticated(true);
            await Promise.all([
              fetchMovies(),
              fetchRequests(),
              fetchSagas(),
              fetchUsers(),
              fetchStreams(),
              fetchStreamLogs(),
              fetchSeries(),
              fetchMaintenanceMode(),
              fetchContactMessages(),
              fetchDownloads(),
              fetchBanners()
            ]);
          }
        } else {
          // EN PRODUCTION : On affiche d'abord le formulaire de connexion, pas d'erreur !
          console.log("🌍 Mode PRODUCTION détecté, affichage formulaire connexion...");
          setShowLoginForm(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Erreur init:", err);
        // En cas d'erreur, on affiche le formulaire de connexion
        setShowLoginForm(true);
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Synchronisation temps réel avec Supabase pour le mode maintenance
  useEffect(() => {
    let subscription;
    try {
      subscription = supabase
        .channel('admin-site-config')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'site_config' }, (payload) => {
          setMaintenanceMode(payload.new.maintenance_mode);
          localStorage.setItem('maintenance_mode', payload.new.maintenance_mode.toString());
        })
        .subscribe();
    } catch (e) {
      console.log('Realtime not available yet');
    }
    
    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const fetchMaintenanceMode = async () => {
    // D'abord charger depuis localStorage pour instantané
    const localMode = localStorage.getItem('maintenance_mode');
    if (localMode !== null) {
      setMaintenanceMode(localMode === 'true');
    }
    
    // Puis charger depuis Supabase
    try {
      const { data } = await supabase.from('site_config').select('maintenance_mode').maybeSingle();
      if (data) {
        setMaintenanceMode(data.maintenance_mode);
        localStorage.setItem('maintenance_mode', data.maintenance_mode.toString());
      }
    } catch (e) {
      console.log('No site_config table yet, using localStorage');
    }
  };

  const toggleMaintenanceMode = async () => {
    const newMode = !maintenanceMode;
    setMaintenanceMode(newMode);
    localStorage.setItem('maintenance_mode', newMode.toString());
    
    try {
      const { error } = await supabase.from('site_config').upsert({
        id: 1,
        maintenance_mode: newMode,
        updated_at: new Date().toISOString()
      });
      
      if (error) {
        console.error('Error toggling maintenance mode:', error);
      }
    } catch (e) {
      console.log('No site_config table yet, using only localStorage');
    }
  };

  const fetchMovies = async () => {
    const { data, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setMovies(data);
    }
  };

  const fetchRequests = async () => {
    const { data, error } = await supabase.from('content_requests').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setRequests(data);
    }
  };

  const fetchSagas = async () => {
    const { data, error } = await supabase.from('sagas').select('*, saga_movies(*, movies(*))').order('created_at', { ascending: false });
    if (!error && data) {
      setSagas(data);
    }
  };

  const fetchSeries = async () => {
    await fetchSeasons();
    await fetchEpisodes();
    await fetchEpisodeStreams();
  };

  const fetchSeasons = async (seriesId = null) => {
    let query = supabase.from('seasons').select('*, movies(*)').order('season_number', { ascending: true });
    if (seriesId) query = query.eq('movie_id', seriesId);
    const { data, error } = await query;
    if (!error && data) setSeasons(data);
  };

  const fetchEpisodes = async (seasonId = null) => {
    let query = supabase.from('episodes').select('*, seasons(*), movies(*)').order('episode_number', { ascending: true });
    if (seasonId) query = query.eq('season_id', seasonId);
    const { data, error } = await query;
    if (!error && data) setEpisodes(data);
  };

  const fetchEpisodeStreams = async () => {
    const { data, error } = await supabase.from('episode_streams').select('*, episodes(*)').order('created_at', { ascending: false });
    if (!error && data) setEpisodeStreams(data);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setUsers(data);
    }
  };

  const fetchStreams = async () => {
    const { data, error } = await supabase.from('streams').select('*, movies(*)').order('created_at', { ascending: false });
    if (!error && data) {
      setStreams(data);
    }
  };

  const fetchStreamLogs = async () => {
    const { data, error } = await supabase.from('stream_logs').select('*, streams(*), movies(*)').order('created_at', { ascending: false }).limit(100);
    if (!error && data) {
      setStreamLogs(data);
    }
  };

  const fetchContactMessages = async () => {
    const { data, error } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setContactMessages(data);
    }
  };

  const markContactMessageRead = async (id) => {
    const { error } = await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    if (!error) {
      fetchContactMessages();
    }
  };

  const deleteContactMessage = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce message ?")) {
      const { error } = await supabase.from('contact_messages').delete().eq('id', id);
      if (!error) {
        fetchContactMessages();
      }
    }
  };

  const fetchDownloads = async () => {
    const { data, error } = await supabase.from('downloads').select('*, profiles(*)').order('downloaded_at', { ascending: false });
    if (!error && data) {
      setDownloads(data);
    }
  };
  
  const fetchBanners = async () => {
    const { data, error } = await supabase.from('banners').select('*').order('display_order', { ascending: true });
    if (!error && data) {
      setBanners(data);
    }
  };
  
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBanner) {
        const { error } = await supabase.from('banners').update({
          title: editingBanner.title,
          description: editingBanner.description,
          image_url: editingBanner.image_url,
          link_url: editingBanner.link_url,
          display_order: editingBanner.display_order || 0,
          is_active: editingBanner.is_active !== false,
          updated_at: new Date().toISOString()
        }).eq('id', editingBanner.id);
        if (!error) {
          alert('Bannière modifiée avec succès !');
          setEditingBanner(null);
          fetchBanners();
        }
      } else {
        const { error } = await supabase.from('banners').insert({
          title: editingBanner?.title || '',
          description: editingBanner?.description,
          image_url: editingBanner?.image_url,
          link_url: editingBanner?.link_url,
          display_order: editingBanner?.display_order || 0,
          is_active: editingBanner?.is_active !== false
        });
        if (!error) {
          alert('Bannière ajoutée avec succès !');
          setEditingBanner(null);
          fetchBanners();
        }
      }
    } catch (e) {
      alert('Erreur lors de la sauvegarde de la bannière !');
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteBanner = async (bannerId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette bannière ?')) {
      const { error } = await supabase.from('banners').delete().eq('id', bannerId);
      if (!error) {
        fetchBanners();
        alert('Bannière supprimée avec succès !');
      }
    }
  };

  const sendNotificationToAll = async (title, message) => {
    try {
      if (users.length > 0) {
        const notifications = users.map(user => ({
          user_id: user.id,
          title: title,
          message: message,
          is_read: false
        }));
        await supabase.from('notifications').insert(notifications);
        console.log(`Notifications sent to ${users.length} users!`);
      }
    } catch (e) {
      console.error("Failed to send notifications", e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!movieTitle || !moviePoster || (contentType === 'film' && !streamUrl)) return alert("Le titre et l'affiche sont requis. Pour un film, le lien vidéo est aussi nécessaire.");
    setIsSubmitting(true);
    
    try {
      const { data: movieData, error: movieError } = await supabase.from('movies').insert([
        { 
          title: movieTitle, 
          description: movieDesc, 
          poster_url: moviePoster,
          trailer_url: trailerUrl || null,
          release_year: releaseYear,
          category: category,
          content_type: contentType,
          age_rating: ageRating,
          platform: platform || null,
          status: contentStatus
        }
      ]).select();
      
      if (movieError || !movieData) {
        alert("Erreur lors de l'ajout du contenu.");
        console.error(movieError);
        return;
      }

      if (contentType === 'film') {
        const { error: streamError } = await supabase.from('streams').insert([
          { 
            movie_id: movieData[0].id, 
            server_name: serverName || 'Serveur 1', 
            player_url: streamUrl,
            m3u8_url: m3u8Url || null,
            quality: quality || 'HD'
          }
        ]);
        
        if (streamError) {
          alert("Le contenu a été ajouté mais une erreur est survenue lors de l'ajout du lien stream.");
          console.error(streamError);
        } else {
          alert("Contenu et lien ajoutés avec succès !");
        }
        try {
          await sendNotificationToAll(
            "Nouveau film disponible !", 
            `Le film "${movieData[0].title}" est maintenant disponible sur NaruStream ! Allez le regarder !`
          );
        } catch (notifyError) {
          console.error("Erreur notification", notifyError);
        }
      } else {
        alert("Série ajoutée avec succès ! Tu peux maintenant ajouter des saisons et des épisodes.");
        try {
          await sendNotificationToAll(
            "Nouvelle série disponible !", 
            `La série "${movieData[0].title}" est maintenant disponible sur NaruStream !`
          );
        } catch (notifyError) {
          console.error("Erreur notification", notifyError);
        }
      }
      
      setMovieTitle('');
      setMovieDesc('');
      setMoviePoster('');
      setReleaseYear('');
      setCategory('');
      setServerName('');
      setStreamUrl('');
      setQuality('');
      fetchMovies();
    } catch (globalError) {
      alert("Erreur inattendue.");
      console.error(globalError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSeries = async (e) => {
    e.preventDefault();
    if (!newSeriesTitle || !newSeriesPoster) {
      return alert('Le titre et l\'affiche sont requis pour la série !');
    }
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.from('movies').insert([
        {
          title: newSeriesTitle,
          description: newSeriesDesc,
          poster_url: newSeriesPoster,
          trailer_url: newSeriesTrailer,
          release_year: newSeriesYear,
          category: newSeriesCategory,
          content_type: 'serie',
          age_rating: newSeriesAgeRating,
          platform: newSeriesPlatform || null,
          status: newSeriesStatus
        }
      ]).select();
      
      if (error) {
        alert('Erreur lors de l\'ajout de la série : ' + error.message);
        console.error(error);
      } else {
        alert('Série ajoutée avec succès ! Tu peux maintenant ajouter des saisons !');
        try {
          await sendNotificationToAll(
            "Nouvelle série disponible !", 
            `La série "${data[0].title}" est maintenant disponible sur NaruStream !`
          );
        } catch (notifyError) {
          console.error("Erreur notification", notifyError);
        }
        setNewSeriesTitle('');
        setNewSeriesDesc('');
        setNewSeriesPoster('');
        setNewSeriesTrailer('');
        setNewSeriesYear('');
        setNewSeriesCategory('');
        setNewSeriesAgeRating('10+');
        setNewSeriesPlatform('');
        fetchMovies();
      }
    } catch (globalError) {
      alert("Erreur inattendue.");
      console.error(globalError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSeason = async (e) => {
    e.preventDefault();
    if (!selectedSeriesForSeason) return alert('Sélectionne une série d\'abord !');
    setIsSubmitting(true);
    
    try {
      const formData = new FormData(e.target);
      const { data: seasonData, error } = await supabase.from('seasons').insert({
        movie_id: selectedSeriesForSeason,
        season_number: parseInt(formData.get('seasonNumber')),
        title: formData.get('seasonTitle'),
        description: formData.get('seasonDescription'),
        poster_url: formData.get('seasonPoster'),
        release_date: formData.get('seasonReleaseDate')
      }).select();
      
      if (error) {
        alert('Erreur lors de l\'ajout de la saison');
        console.error(error);
      } else {
        const series = movies.find(m => m.id === selectedSeriesForSeason);
        alert('Saison ajoutée !');
        if (series) {
          try {
            await sendNotificationToAll(
              "Nouvelle saison disponible !", 
              `La saison ${seasonData[0].season_number} de "${series.title}" est maintenant disponible sur NaruStream !`
            );
          } catch (notifyError) {
            console.error("Erreur notification", notifyError);
          }
        }
        fetchSeasons(selectedSeriesForSeason);
      }
    } catch (globalError) {
      alert("Erreur inattendue.");
      console.error(globalError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    if (!selectedSeasonForEpisode) return alert('Sélectionne une saison d\'abord !');
    setIsSubmitting(true);
    
    try {
      const season = seasons.find(s => s.id === selectedSeasonForEpisode);
      const formData = new FormData(e.target);
      const { data: episodeData, error: episodeError } = await supabase.from('episodes').insert({
        season_id: selectedSeasonForEpisode,
        movie_id: season.movie_id,
        episode_number: parseInt(formData.get('episodeNumber')),
        title: formData.get('episodeTitle'),
        description: formData.get('episodeDescription'),
        duration: parseInt(formData.get('episodeDuration')),
        poster_url: formData.get('episodePoster'),
        status: formData.get('episodeStatus') || 'sortie'
      }).select();
      
      if (episodeError) {
        alert('Erreur lors de l\'ajout de l\'épisode');
        console.error(episodeError);
      } else if (episodeData) {
        const { error: streamError } = await supabase.from('episode_streams').insert({
          episode_id: episodeData[0].id,
          player_url: formData.get('episodePlayerUrl'),
          m3u8_url: formData.get('episodeM3u8Url'),
          server_name: formData.get('episodeServerName'),
          quality: formData.get('episodeQuality')
        });
        if (streamError) alert('Épisode ajouté, mais erreur sur le lien');
        else alert('Épisode et lien ajoutés !');
        
        const series = movies.find(m => m.id === season.movie_id);
        if (series) {
          try {
            await sendNotificationToAll(
              "Nouvel épisode disponible !", 
              `L'épisode ${episodeData[0].episode_number} de "${series.title}" (saison ${season.season_number}) est maintenant disponible sur NaruStream ! Allez le regarder !`
            );
          } catch (notifyError) {
            console.error("Erreur notification", notifyError);
          }
        }
        
        fetchEpisodeStreams();
      }
      fetchEpisodes(selectedSeasonForEpisode);
    } catch (globalError) {
      alert("Erreur inattendue.");
      console.error(globalError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStream = async (e) => {
    e.preventDefault();
    if (!selectedMovieId || !addStreamUrl) return alert("Le film et le lien vidéo sont requis.");
    setIsAddingStream(true);

    const { error: streamError } = await supabase.from('streams').insert([
      { 
        movie_id: selectedMovieId, 
        server_name: addServerName || 'Serveur Alternatif', 
        player_url: addStreamUrl,
        m3u8_url: addM3u8Url || null,
        quality: addQuality || 'HD'
      }
    ]);

    setIsAddingStream(false);
    
    if (streamError) {
      alert("Erreur lors de l'ajout du lien supplémentaire.");
      console.error(streamError);
    } else {
      alert("Nouveau lecteur ajouté avec succès !");
      setAddStreamUrl('');
      setAddM3u8Url('');
      setAddServerName('');
      setAddQuality('');
      setSelectedMovieId('');
      fetchStreams();
    }
  };

  const handleAddEpisodeBackup = async (e) => {
    e.preventDefault();
    if (!selectedEpisodeForBackup || !backupStreamUrl) return alert("L'épisode et le lien vidéo sont requis.");
    setIsAddingBackup(true);

    const { error } = await supabase.from('episode_streams').insert([
      {
        episode_id: selectedEpisodeForBackup,
        server_name: backupServerName || 'Serveur Secours',
        player_url: backupStreamUrl,
        m3u8_url: backupM3u8Url || null,
        quality: backupQuality || 'HD'
      }
    ]);

    setIsAddingBackup(false);
    
    if (error) {
      alert("Erreur lors de l'ajout du lecteur de secours.");
      console.error(error);
    } else {
      alert("Lecteur de secours ajouté avec succès !");
      setBackupStreamUrl('');
      setBackupM3u8Url('');
      setBackupServerName('');
      setBackupQuality('');
      setSelectedEpisodeForBackup('');
      fetchEpisodeStreams();
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return alert("Veuillez coller du JSON valide.");
    
    try {
      setIsImporting(true);
      const content = JSON.parse(jsonInput);
      
      if (!Array.isArray(content)) {
        return alert("Le JSON doit être un tableau de films/séries.");
      }

      let imported = 0;
      for (const item of content) {
        if (!item.title || !item.poster_url || !item.content_type) {
          continue;
        }

        const { data: movieData, error: movieError } = await supabase.from('movies').insert([
          {
            title: item.title,
            description: item.description || '',
            poster_url: item.poster_url,
            trailer_url: item.trailer_url || null,
            release_year: item.release_year || '',
            category: item.category || '',
            content_type: item.content_type,
            age_rating: item.age_rating || '10+',
            platform: item.platform || null
          }
        ]).select();

        if (!movieError && movieData && item.streams && Array.isArray(item.streams)) {
          for (const stream of item.streams) {
            await supabase.from('streams').insert([
              {
                movie_id: movieData[0].id,
                server_name: stream.server_name || 'Serveur',
                player_url: stream.player_url,
                m3u8_url: stream.m3u8_url || null,
                quality: stream.quality || 'HD'
              }
            ]);
          }
        }
        imported++;
      }

      alert(`${imported} élément(s) importé(s) avec succès !`);
      setJsonInput('');
      fetchMovies();
      fetchStreams();
    } catch (err) {
      alert("Erreur de parsing JSON : " + err.message);
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditClick = (movie) => {
    setEditingMovie({ 
      ...movie, 
      category: movie.category || '' 
    });
  };

  const handleEditChange = (field, value) => {
    setEditingMovie(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateMovie = async (e) => {
    e.preventDefault();
    console.log('Updating movie with data:', editingMovie);
    const { error } = await supabase.from('movies').update({
      title: editingMovie.title,
      description: editingMovie.description,
      poster_url: editingMovie.poster_url,
      trailer_url: editingMovie.trailer_url || null,
      release_year: editingMovie.release_year,
      category: editingMovie.category,
      content_type: editingMovie.content_type,
      age_rating: editingMovie.age_rating || '10+',
      platform: editingMovie.platform || null,
      status: editingMovie.status || 'sortie'
    }).eq('id', editingMovie.id);

    if (error) {
      console.error('Update error details:', error);
      alert("Erreur de modification: " + error.message + " (Code: " + error.code + ")");
    } else {
      alert("Contenu modifié avec succès");
      setEditingMovie(null);
      fetchMovies();
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contenu ? Tous ses streams associés seront aussi supprimés.")) {
      const { error } = await supabase.from('movies').delete().eq('id', id);
      if (error) {
        alert("Erreur de suppression");
      } else {
        alert("Contenu supprimé !");
        fetchMovies();
      }
    }
  };

  // Season handlers
  const handleEditSeasonChange = (field, value) => {
    setEditingSeason(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateSeason = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('seasons').update({
      season_number: editingSeason.season_number,
      title: editingSeason.title,
      description: editingSeason.description,
      poster_url: editingSeason.poster_url,
      release_date: editingSeason.release_date
    }).eq('id', editingSeason.id);

    if (error) {
      alert("Erreur de modification de saison");
      console.error(error);
    } else {
      alert("Saison modifiée avec succès");
      setEditingSeason(null);
      fetchSeasons();
    }
  };

  const handleDeleteSeason = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette saison ? Tous ses épisodes et streams associés seront aussi supprimés.")) {
      const { error } = await supabase.from('seasons').delete().eq('id', id);
      if (error) {
        alert("Erreur de suppression");
      } else {
        alert("Saison supprimée !");
        fetchSeasons();
      }
    }
  };

  // Episode handlers
  const handleEditEpisodeChange = (field, value) => {
    setEditingEpisode(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateEpisode = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('episodes').update({
      episode_number: editingEpisode.episode_number,
      title: editingEpisode.title,
      description: editingEpisode.description,
      duration: editingEpisode.duration,
      poster_url: editingEpisode.poster_url,
      status: editingEpisode.status || 'sortie'
    }).eq('id', editingEpisode.id);

    if (error) {
      alert("Erreur de modification d'épisode");
      console.error(error);
    } else {
      alert("Épisode modifié avec succès");
      setEditingEpisode(null);
      fetchEpisodes(editingEpisode.season_id);
    }
  };

  const handleDeleteEpisode = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet épisode ? Tous ses streams associés seront aussi supprimés.")) {
      const { error } = await supabase.from('episodes').delete().eq('id', id);
      if (error) {
        alert("Erreur de suppression");
      } else {
        alert("Épisode supprimé !");
        fetchEpisodes();
      }
    }
  };

  const handleDeleteEpisodeStream = async (streamId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce lecteur ?")) {
      const { error } = await supabase.from('episode_streams').delete().eq('id', streamId);
      if (error) {
        alert("Erreur de suppression");
      } else {
        alert("Lecteur supprimé !");
        fetchEpisodeStreams();
      }
    }
  };

  // Saga handlers
  const handleAddSaga = async (e) => {
    e.preventDefault();
    if (!newSagaName || !newSagaPoster) return alert('Le nom et l\'affiche sont requis !');
    setIsSubmitting(true);
    
    const { data, error } = await supabase.from('sagas').insert({
      name: newSagaName,
      description: newSagaDesc,
      poster_url: newSagaPoster
    }).select();
    
    if (error) {
      alert('Erreur lors de l\'ajout de la saga');
      console.error(error);
    } else {
      alert('Saga ajoutée avec succès !');
      setNewSagaName('');
      setNewSagaDesc('');
      setNewSagaPoster('');
      fetchSagas();
    }
    setIsSubmitting(false);
  };

  const handleEditSaga = (saga) => {
    setEditingSaga({ ...saga });
  };

  const handleEditSagaChange = (field, value) => {
    setEditingSaga(prev => ({ ...prev, [field]: value }));
  };

  const handleUpdateSaga = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('sagas').update({
      name: editingSaga.name,
      description: editingSaga.description,
      poster_url: editingSaga.poster_url
    }).eq('id', editingSaga.id);
    
    if (error) {
      alert('Erreur de modification');
      console.error(error);
    } else {
      alert('Saga modifiée avec succès');
      setEditingSaga(null);
      fetchSagas();
    }
  };

  const handleDeleteSaga = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette saga ? Tous les films associés seront retirés de la saga (pas supprimés).")) {
      const { error } = await supabase.from('sagas').delete().eq('id', id);
      if (error) {
        alert('Erreur de suppression');
        console.error(error);
      } else {
        alert('Saga supprimée !');
        fetchSagas();
      }
    }
  };

  const handleAddMovieToSaga = async (sagaId, movieId) => {
    // Find the next order number
    const saga = sagas.find(s => s.id === sagaId);
    const currentMovies = saga?.saga_movies || [];
    const nextOrder = currentMovies.length > 0 
      ? Math.max(...currentMovies.map(sm => sm.order_number)) + 1 
      : 1;
    
    const { error } = await supabase.from('saga_movies').insert({
      saga_id: sagaId,
      movie_id: movieId,
      order_number: nextOrder
    });
    
    if (error) {
      alert('Erreur lors de l\'ajout du film à la saga');
      console.error(error);
    } else {
      alert('Film ajouté à la saga !');
      fetchSagas();
    }
  };

  const handleRemoveMovieFromSaga = async (sagaMovieId) => {
    if (window.confirm("Retirer ce film de la saga ?")) {
      const { error } = await supabase.from('saga_movies').delete().eq('id', sagaMovieId);
      if (error) {
        alert('Erreur de suppression');
        console.error(error);
      } else {
        alert('Film retiré de la saga !');
        fetchSagas();
      }
    }
  };

  const handleUpdateMovieOrder = async (sagaMovieId, newOrder) => {
    const { error } = await supabase.from('saga_movies').update({
      order_number: newOrder
    }).eq('id', sagaMovieId);
    
    if (error) {
      alert('Erreur de modification de l\'ordre');
      console.error(error);
    } else {
      fetchSagas();
    }
  };

  const updateRequestStatus = async (id, newStatus, requestData) => {
    const { error } = await supabase.from('content_requests').update({ status: newStatus }).eq('id', id);
    if (error) {
      console.error(error);
      alert("Erreur de mise à jour");
    } else {
      fetchRequests();
      
      if (requestData.requested_by_user_id) {
        let notificationTitle, notificationMessage;
        switch (newStatus) {
          case 'in_progress':
            notificationTitle = 'Demande en cours !';
            notificationMessage = `Votre demande pour "${requestData.title}" est en cours de traitement.`;
            break;
          case 'completed':
            notificationTitle = 'Demande terminée !';
            notificationMessage = `Le contenu "${requestData.title}" que vous avez demandé est maintenant disponible !`;
            break;
          case 'rejected':
            notificationTitle = 'Demande refusée';
            notificationMessage = `Malheureusement, votre demande pour "${requestData.title}" a été refusée.`;
            break;
          default:
            return;
        }
        
        await supabase.from('notifications').insert([
          {
            user_id: requestData.requested_by_user_id,
            title: notificationTitle,
            message: notificationMessage
          }
        ]);
      }
    }
  };

  const deleteRequest = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) {
      const { error } = await supabase.from('content_requests').delete().eq('id', id);
      if (error) {
        alert("Erreur de suppression");
      } else {
        fetchRequests();
      }
    }
  };

  const toggleAdmin = async (userId, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ is_admin: !currentStatus }).eq('id', userId);
    if (error) {
      alert("Erreur de modification du rôle admin");
      console.error(error);
    } else {
      fetchUsers();
    }
  };

  const toggleBan = async (userId, currentStatus) => {
    const { error } = await supabase.from('profiles').update({ is_banned: !currentStatus }).eq('id', userId);
    if (error) {
      alert("Erreur de modification du statut");
      console.error(error);
    } else {
      fetchUsers();
    }
  };

  const toggleStreamActive = async (streamId, currentStatus) => {
    const { error } = await supabase.from('streams').update({ is_active: !currentStatus }).eq('id', streamId);
    if (error) {
      alert("Erreur de modification");
      console.error(error);
    } else {
      fetchStreams();
    }
  };

  const resetStreamStats = async (streamId) => {
    const { error } = await supabase.from('streams').update({ success_count: 0, failure_count: 0 }).eq('id', streamId);
    if (error) {
      alert("Erreur de réinitialisation");
      console.error(error);
    } else {
      fetchStreams();
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuthenticated', 'true');
      setIsAuthenticated(true);
      // Load all data now that we're authenticated
      await Promise.all([
        fetchMovies(),
        fetchRequests(),
        fetchSagas(),
        fetchUsers(),
        fetchStreams(),
        fetchStreamLogs(),
        fetchSeries(),
        fetchMaintenanceMode(),
        fetchContactMessages(),
        fetchDownloads(),
        fetchBanners()
      ]);
    } else {
      alert('Mot de passe incorrect !');
    }
  };
  
  const handleAdminLogout = () => {
    sessionStorage.removeItem('adminAuthenticated');
    setIsAuthenticated(false);
  };

  if (errorMessage) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        color: 'white',
        fontSize: '1.2rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#ff3232', marginBottom: '1rem' }}>❌ ERREUR</h1>
        <p style={{ maxWidth: '600px', lineHeight: '1.6' }}>{errorMessage}</p>
        <p style={{ marginTop: '2rem', color: '#aaa' }}>Ouvre la console (F12) pour plus d'infos</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        color: 'white',
        fontSize: '1.5rem'
      }}>
        Chargement...
      </div>
    );
  }

  if (showLoginForm) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(30, 30, 50, 0.95)',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid var(--neon-blue)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
          maxWidth: '450px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 className="text-glow-blue" style={{ marginBottom: '2rem', fontSize: '1.8rem' }}>🔐 Connexion Admin</h1>
          <form onSubmit={handleDirectLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--neon-pink)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
              }}
              autoFocus
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--neon-pink)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
              }}
              required
            />
            <button
              type="submit"
              className="cyber-button primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-color)',
        padding: '2rem'
      }}>
        <div style={{
          background: 'rgba(30, 30, 50, 0.95)',
          padding: '3rem',
          borderRadius: '12px',
          border: '1px solid var(--neon-blue)',
          boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <h1 className="text-glow-blue" style={{ marginBottom: '1rem', fontSize: '2rem' }}>🔒 Accès Admin</h1>
          
          <div style={{ marginBottom: '2rem', textAlign: 'left', color: '#aaa', lineHeight: '1.6' }}>
            <p style={{ marginBottom: '0.5rem' }}>
              {window.location.hostname === 'localhost' 
                ? "🏠 Mode LOCAL : Entrez simplement le mot de passe admin !"
                : "⚠️ Avant de continuer : Tu dois être connecté sur le site principal et avoir un profil admin"}
            </p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <input
              type="password"
              placeholder="Entrez le mot de passe admin"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1.1rem',
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid var(--neon-pink)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none'
              }}
              autoFocus
            />
            <button
              type="submit"
              className="cyber-button primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.2rem' }}
            >
              Accéder au Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className={styles.adminContainer}>
       <header className={styles.adminHeader}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
           <h1 className="text-glow-pink">Admin Dashboard</h1>
           <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 16px', background: maintenanceMode ? 'rgba(255, 50, 50, 0.2)' : 'rgba(0, 255, 100, 0.2)', borderRadius: '8px', border: `1px solid ${maintenanceMode ? '#ff3232' : '#00ff64'}` }}>
               <span style={{ color: maintenanceMode ? '#ff3232' : '#00ff64', fontWeight: 'bold' }}>
                 {maintenanceMode ? 'MAINTENANCE ACTIVÉE' : 'SITE ACTIF'}
               </span>
               <button 
                 onClick={toggleMaintenanceMode}
                 className="cyber-button"
                 style={{ 
                   background: maintenanceMode ? '#00ff64' : '#ff3232',
                   color: '#000',
                   borderColor: maintenanceMode ? '#00ff64' : '#ff3232'
                 }}
               >
                 {maintenanceMode ? 'Désactiver' : 'Activer'} Maintenance
               </button>
             </div>
             <Link href="https://narustream.vercel.app" className="cyber-button">Retour au site</Link>
             <button onClick={handleAdminLogout} className="cyber-button" style={{ borderColor: '#ff4444' }}>Se déconnecter</button>
           </div>
         </div>
       </header>

       {/* Statistics Dashboard */}
      <div className={styles.statsContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎬</div>
          <h2 className="text-glow-blue" style={{ fontSize: '2.5rem', margin: 0 }}>{movies.filter(m => m.content_type === 'film').length}</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Films</p>
        </div>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📺</div>
          <h2 className="text-glow-pink" style={{ fontSize: '2.5rem', margin: 0 }}>{movies.filter(m => m.content_type === 'serie').length}</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Séries</p>
        </div>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎭</div>
          <h2 className="text-glow-green" style={{ fontSize: '2.5rem', margin: 0 }}>{seasons.length}</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Saisons</p>
        </div>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎥</div>
          <h2 className="text-glow-yellow" style={{ fontSize: '2.5rem', margin: 0 }}>{episodes.length}</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Épisodes</p>
        </div>
        <div className={styles.panel} style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
          <h2 className="text-glow-purple" style={{ fontSize: '2.5rem', margin: 0 }}>{users.length}</h2>
          <p style={{ color: '#aaa', margin: 0 }}>Utilisateurs</p>
        </div>
      </div>

       {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('content')}
          className={`cyber-button ${activeTab === 'content' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Contenus
        </button>
        <button
          onClick={() => setActiveTab('series')}
          className={`cyber-button ${activeTab === 'series' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Séries
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`cyber-button ${activeTab === 'users' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('streams')}
          className={`cyber-button ${activeTab === 'streams' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Liens Streaming
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`cyber-button ${activeTab === 'requests' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Demandes
        </button>
        <button
          onClick={() => setActiveTab('sagas')}
          className={`cyber-button ${activeTab === 'sagas' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Sagas
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`cyber-button ${activeTab === 'contact' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Messages Contact
        </button>
        <button
          onClick={() => setActiveTab('downloads')}
          className={`cyber-button ${activeTab === 'downloads' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Téléchargements
        </button>
        <button
          onClick={() => setActiveTab('banners')}
          className={`cyber-button ${activeTab === 'banners' ? 'primary' : ''}`}
          style={{ padding: '10px 20px' }}
        >
          Bannières
        </button>
      </div>

      {/* Contenus Tab */}
      {activeTab === 'content' && (
        <div className={styles.dashboardGrid}>
          {/* Bulk Import Section */}
          <div className={styles.panel} style={{ gridColumn: '1 / -1', marginBottom: '2rem' }}>
            <h2 className="text-glow-blue">📦 Import en Masse (JSON)</h2>
            <p style={{ color: '#aaa', marginBottom: '1rem' }}>
              Format attendu: tableau d'objets avec title, poster_url, content_type, et optionnellement streams (tableau)
            </p>
            <form onSubmit={handleBulkImport} className={styles.adminForm}>
              <div className={styles.formGroup}>
                <textarea
                  className={styles.cyberInput}
                  rows="10"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`[
  {
    "title": "Nom du Film",
    "description": "Description...",
    "poster_url": "https://...",
    "trailer_url": "https://...",
    "release_year": "2024",
    "category": "Action",
    "age_rating": "10+",
    "platform": "Netflix",
    "content_type": "film",
    "streams": [
      { "server_name": "Serveur 1", "player_url": "https://...", "quality": "HD" }
    ]
  }
]`}
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="cyber-button primary" 
                disabled={isImporting}
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
              >
                {isImporting ? 'Importation en cours...' : 'Importer tout le contenu'}
              </button>
            </form>
          </div>

          {/* Main Form: Add New Movie + Stream */}
          <div className={styles.panel} style={{ gridColumn: '1 / -1' }}>
            <h2 className="text-glow-blue">Ajouter un nouveau contenu</h2>
            <form className={styles.adminForm} onSubmit={handleSubmit}>
              
              <div className={styles.formSection}>
                <h3 className="text-glow-pink" style={{ marginBottom: '1rem', marginTop: '1rem' }}>Infos Principales</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Type de contenu *</label>
                    <select className={styles.cyberInput} value={contentType} onChange={(e) => setContentType(e.target.value)} required>
                      <option value="film">Film</option>
                      <option value="serie">Série</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Titre *</label>
                    <input type="text" className={styles.cyberInput} value={movieTitle} onChange={(e) => setMovieTitle(e.target.value)} placeholder="Ex: Matrix 4" required />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Description</label>
                  <textarea className={styles.cyberInput} rows="3" value={movieDesc} onChange={(e) => setMovieDesc(e.target.value)} placeholder="Synopsis..."></textarea>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>URL de l'Affiche *</label>
                    <input type="text" className={styles.cyberInput} value={moviePoster} onChange={(e) => setMoviePoster(e.target.value)} placeholder="https://..." required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>URL de la Bande-Annonce</label>
                    <input type="text" className={styles.cyberInput} value={trailerUrl} onChange={(e) => setTrailerUrl(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Année de sortie</label>
                    <input type="text" className={styles.cyberInput} value={releaseYear} onChange={(e) => setReleaseYear(e.target.value)} placeholder="Ex: 2021" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Catégorie</label>
                    <select 
                      className={styles.cyberInput}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {GENRES.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Classification d'âge</label>
                    <select className={styles.cyberInput} value={ageRating} onChange={(e) => setAgeRating(e.target.value)}>
                      <option value="10+">10+</option>
                      <option value="12+">12+</option>
                      <option value="16+">16+</option>
                      <option value="18+">18+</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Plateforme</label>
                    <select className={styles.cyberInput} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                      <option value="">Sélectionner une plateforme</option>
                      <option value="Netflix">Netflix</option>
                      <option value="Disney+">Disney+</option>
                      <option value="Prime Video">Prime Video</option>
                      <option value="Apple TV+">Apple TV+</option>
                      <option value="Max">Max</option>
                      <option value="Paramount+">Paramount+</option>
                      <option value="Disney">Disney</option>
                      <option value="Marvel">Marvel</option>
                      <option value="Star Wars">Star Wars</option>
                      <option value="DC">DC</option>
                      <option value="Anime">Anime</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Statut</label>
                    <select className={styles.cyberInput} value={contentStatus} onChange={(e) => setContentStatus(e.target.value)}>
                      <option value="sortie">Sortie</option>
                      <option value="a venir">À venir</option>
                    </select>
                  </div>
                </div>
              </div>

              {contentType === 'film' && (
                <div className={styles.formSection}>
                  <h3 className="text-glow-pink" style={{ marginBottom: '1rem', marginTop: '2rem' }}>Lien de Streaming</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>URL du Lecteur (Iframe / Source) *</label>
                      <input type="text" className={styles.cyberInput} value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} placeholder="https://..." required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>URL M3U8 (Pour lecteur interne)</label>
                      <input type="text" className={styles.cyberInput} value={m3u8Url} onChange={(e) => setM3u8Url(e.target.value)} placeholder="https://.../playlist.m3u8" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.formGroup}>
                      <label>Nom du Serveur</label>
                      <input type="text" className={styles.cyberInput} value={serverName} onChange={(e) => setServerName(e.target.value)} placeholder="Ex: Premium 4K" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Qualité</label>
                      <input type="text" className={styles.cyberInput} value={quality} onChange={(e) => setQuality(e.target.value)} placeholder="Ex: 1080p, HD, 4K" />
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" className="cyber-button primary mt-4" disabled={isSubmitting} style={{ width: '100%', marginTop: '2rem', padding: '1rem', fontSize: '1.2rem' }}>
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter le contenu complet'}
              </button>
            </form>
          </div>

          {/* Secondary Form: Add Extra Stream */}
          <div className={styles.panel} style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
            <h2 className="text-glow-blue">Ajouter un lecteur supplémentaire (Backup)</h2>
            <form className={styles.adminForm} onSubmit={handleAddStream}>
              <div className={styles.formSection}>
                <div className={styles.formGroup}>
                  <label>Sélectionner le Film / Série *</label>
                  <select className={styles.cyberInput} value={selectedMovieId} onChange={(e) => setSelectedMovieId(e.target.value)} required>
                    <option value="">-- Choisir un contenu existant --</option>
                    {movies.map(m => (
                      <option key={m.id} value={m.id}>{m.title} ({m.content_type?.toUpperCase()})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>URL du Lecteur (Iframe / Source) *</label>
                    <input type="text" className={styles.cyberInput} value={addStreamUrl} onChange={(e) => setAddStreamUrl(e.target.value)} placeholder="https://..." required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>URL M3U8 (Pour lecteur interne)</label>
                    <input type="text" className={styles.cyberInput} value={addM3u8Url} onChange={(e) => setAddM3u8Url(e.target.value)} placeholder="https://.../playlist.m3u8" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className={styles.formGroup}>
                    <label>Nom du Serveur</label>
                    <input type="text" className={styles.cyberInput} value={addServerName} onChange={(e) => setAddServerName(e.target.value)} placeholder="Ex: Lecteur Secours" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Qualité</label>
                    <input type="text" className={styles.cyberInput} value={addQuality} onChange={(e) => setAddQuality(e.target.value)} placeholder="Ex: 1080p" />
                  </div>
                </div>

                <button type="submit" className="cyber-button mt-4" disabled={isAddingStream} style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                  {isAddingStream ? 'Ajout en cours...' : 'Ajouter le lecteur de secours'}
                </button>
              </div>
            </form>
          </div>

          {/* Manage Existing Content Section */}
          <div className={styles.panel} style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
            <h2 className="text-glow-pink">Gérer les contenus</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {movies.length === 0 && <p style={{ color: 'white' }}>Aucun contenu à afficher.</p>}
              {movies.map(movie => (
                <div key={movie.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div>
                    <strong style={{ color: 'white', fontSize: '1.1rem' }}>{movie.title}</strong> 
                    <span style={{ color: '#aaa', marginLeft: '10px' }}>{movie.release_year ? `(${movie.release_year})` : ''} - {movie.content_type?.toUpperCase()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleEditClick(movie)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>Modifier</button>
                    <button onClick={() => handleDelete(movie.id)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}>Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Séries Tab */}
      {activeTab === 'series' && (
        <div>
          {/* 1. Add New Series Form */}
          <div className={styles.panel} style={{marginBottom: '2rem'}}>
            <h2 className="text-glow-pink">Ajouter une Nouvelle Série</h2>
            <form onSubmit={handleAddSeries} className={styles.adminForm}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className={styles.formGroup}>
                  <label>Titre de la série *</label>
                  <input type="text" className={styles.cyberInput} value={newSeriesTitle} onChange={(e) => setNewSeriesTitle(e.target.value)} placeholder="Ex: Naruto Shippuden" required />
                </div>
                <div className={styles.formGroup}>
                  <label>URL de l'affiche *</label>
                  <input type="text" className={styles.cyberInput} value={newSeriesPoster} onChange={(e) => setNewSeriesPoster(e.target.value)} placeholder="https://..." required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description / Résumé</label>
                <textarea className={styles.cyberInput} rows="3" value={newSeriesDesc} onChange={(e) => setNewSeriesDesc(e.target.value)} placeholder="Synopsis de la série"></textarea>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem'}}>
                <div className={styles.formGroup}>
                  <label>Année de sortie</label>
                  <input type="text" className={styles.cyberInput} value={newSeriesYear} onChange={(e) => setNewSeriesYear(e.target.value)} placeholder="2007" />
                </div>
                <div className={styles.formGroup}>
                  <label>Teaser / Trailer (URL)</label>
                  <input type="text" className={styles.cyberInput} value={newSeriesTrailer} onChange={(e) => setNewSeriesTrailer(e.target.value)} placeholder="https://www.youtube.com/embed/..." />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Catégorie</label>
                <select 
                  className={styles.cyberInput}
                  value={newSeriesCategory}
                  onChange={(e) => setNewSeriesCategory(e.target.value)}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {GENRES.map(genre => (
                    <option key={genre} value={genre}>{genre}</option>
                  ))}
                </select>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div className={styles.formGroup}>
                  <label>Classification d'âge</label>
                  <select className={styles.cyberInput} value={newSeriesAgeRating} onChange={(e) => setNewSeriesAgeRating(e.target.value)}>
                    <option value="10+">10+</option>
                    <option value="12+">12+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Plateforme</label>
                  <select className={styles.cyberInput} value={newSeriesPlatform} onChange={(e) => setNewSeriesPlatform(e.target.value)}>
                    <option value="">Sélectionner une plateforme</option>
                    <option value="Netflix">Netflix</option>
                    <option value="Disney+">Disney+</option>
                    <option value="Prime Video">Prime Video</option>
                    <option value="Apple TV+">Apple TV+</option>
                    <option value="Max">Max</option>
                    <option value="Paramount+">Paramount+</option>
                    <option value="Disney">Disney</option>
                    <option value="Marvel">Marvel</option>
                    <option value="Star Wars">Star Wars</option>
                    <option value="DC">DC</option>
                    <option value="Anime">Anime</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Statut</label>
                  <select className={styles.cyberInput} value={newSeriesStatus} onChange={(e) => setNewSeriesStatus(e.target.value)}>
                    <option value="sortie">Sortie</option>
                    <option value="a venir">À venir</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="cyber-button primary" disabled={isSubmitting} style={{width: '100%', marginTop: '1.5rem', padding: '1rem', fontSize: '1.2rem'}}>
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter la série'}
              </button>
            </form>
          </div>

          <div className={styles.panel} style={{marginBottom: '2rem'}}>
            <h2 className="text-glow-pink">Gérer les Séries</h2>
            <div style={{marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem'}}>
              {/* Add Season Form */}
              <div className={styles.panel}>
                <h3 className="text-glow-blue">Ajouter une Saison</h3>
                <form onSubmit={handleAddSeason} className={styles.adminForm}>
                  <div className={styles.formGroup}>
                    <label>Sélectionner la série *</label>
                    <select className={styles.cyberInput} value={selectedSeriesForSeason || ''} onChange={(e) => { setSelectedSeriesForSeason(e.target.value); fetchSeasons(e.target.value); }} required>
                      <option value="">-- Choisir une série --</option>
                      {movies.filter(m => m.content_type === 'serie').map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Numéro de saison *</label>
                    <input type="number" name="seasonNumber" className={styles.cyberInput} placeholder="1" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Titre de la saison</label>
                    <input type="text" name="seasonTitle" className={styles.cyberInput} placeholder="Saison 1 : Le Commencement" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea name="seasonDescription" className={styles.cyberInput} rows="3"></textarea>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Poster</label>
                    <input type="text" name="seasonPoster" className={styles.cyberInput} placeholder="URL du poster" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date de sortie</label>
                    <input type="date" name="seasonReleaseDate" className={styles.cyberInput} />
                  </div>
                  <button type="submit" className="cyber-button primary" disabled={isSubmitting} style={{width: '100%', marginTop: '1rem'}}>
                    {isSubmitting ? 'Ajout en cours...' : 'Ajouter la saison'}
                  </button>
                </form>
              </div>

              {/* Add Episode Form */}
              <div className={styles.panel}>
                <h3 className="text-glow-blue">Ajouter un Épisode</h3>
                <form onSubmit={handleAddEpisode} className={styles.adminForm}>
                  <div className={styles.formGroup}>
                    <label>Sélectionner la saison *</label>
                    <select className={styles.cyberInput} value={selectedSeasonForEpisode || ''} onChange={(e) => { setSelectedSeasonForEpisode(e.target.value); fetchEpisodes(e.target.value); }} required>
                      <option value="">-- Choisir une saison d'abord --</option>
                      {seasons.map(s => <option key={s.id} value={s.id}>{s.movies?.title} - Saison {s.season_number}</option>)}
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Numéro d'épisode *</label>
                    <input type="number" name="episodeNumber" className={styles.cyberInput} placeholder="1" required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Titre de l'épisode *</label>
                    <input type="text" name="episodeTitle" className={styles.cyberInput} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea name="episodeDescription" className={styles.cyberInput} rows="3"></textarea>
                  </div>
                  <div className={styles.formGroup}>
                    <label>Durée (minutes)</label>
                    <input type="number" name="episodeDuration" className={styles.cyberInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Poster</label>
                    <input type="text" name="episodePoster" className={styles.cyberInput} placeholder="URL du poster" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Statut</label>
                    <select name="episodeStatus" className={styles.cyberInput} defaultValue="sortie">
                      <option value="sortie">Sortie</option>
                      <option value="a venir">À venir</option>
                    </select>
                  </div>
                  <div style={{borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem'}}>
                    <h4 style={{color: '#fff', marginBottom: '1rem'}}>Lien de streaming</h4>
                    <div className={styles.formGroup}>
                      <label>URL du lecteur *</label>
                      <input type="text" name="episodePlayerUrl" className={styles.cyberInput} required />
                    </div>
                    <div className={styles.formGroup}>
                      <label>URL M3U8 (lecteur interne)</label>
                      <input type="text" name="episodeM3u8Url" className={styles.cyberInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Nom du serveur</label>
                      <input type="text" name="episodeServerName" className={styles.cyberInput} placeholder="Serveur Premium" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Qualité</label>
                      <input type="text" name="episodeQuality" className={styles.cyberInput} placeholder="1080p" />
                    </div>
                  </div>
                  <button type="submit" className="cyber-button primary" disabled={isSubmitting} style={{width: '100%', marginTop: '1rem'}}>
                    {isSubmitting ? 'Ajout en cours...' : 'Ajouter l\'épisode'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Add Episode Backup Stream */}
          <div className={styles.panel} style={{marginBottom: '2rem'}}>
            <h2 className="text-glow-blue">🔄 Ajouter un Lecteur de Secours pour un Épisode</h2>
            <form onSubmit={handleAddEpisodeBackup} className={styles.adminForm}>
              <div className={styles.formGroup}>
                <label>Sélectionner l'épisode *</label>
                <select className={styles.cyberInput} value={selectedEpisodeForBackup || ''} onChange={(e) => setSelectedEpisodeForBackup(e.target.value)} required>
                  <option value="">-- Choisir un épisode --</option>
                  {episodes.map(ep => (
                    <option key={ep.id} value={ep.id}>
                      {ep.movies?.title} - S{ep.seasons?.season_number}E{ep.episode_number} - {ep.title}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>URL du Lecteur (Iframe / Source) *</label>
                  <input type="text" className={styles.cyberInput} value={backupStreamUrl} onChange={(e) => setBackupStreamUrl(e.target.value)} placeholder="https://..." required />
                </div>
                <div className={styles.formGroup}>
                  <label>URL M3U8 (Pour lecteur interne)</label>
                  <input type="text" className={styles.cyberInput} value={backupM3u8Url} onChange={(e) => setBackupM3u8Url(e.target.value)} placeholder="https://.../playlist.m3u8" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Nom du Serveur</label>
                  <input type="text" className={styles.cyberInput} value={backupServerName} onChange={(e) => setBackupServerName(e.target.value)} placeholder="Ex: Serveur Secours" />
                </div>
                <div className={styles.formGroup}>
                  <label>Qualité</label>
                  <input type="text" className={styles.cyberInput} value={backupQuality} onChange={(e) => setBackupQuality(e.target.value)} placeholder="Ex: 1080p" />
                </div>
              </div>
              <button type="submit" className="cyber-button primary" disabled={isAddingBackup} style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>
                {isAddingBackup ? 'Ajout en cours...' : 'Ajouter le lecteur de secours'}
              </button>
            </form>
          </div>

          {/* List Series/Seasons/Episodes with Streams */}
          <div className={styles.panel} style={{marginBottom: '2rem'}}>
            <h2 className="text-glow-pink">Liste des Séries & Épisodes</h2>
            {movies.filter(m => m.content_type === 'serie').map(serie => (
              <div key={serie.id} style={{border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem'}}>
                <h3 style={{color: '#fff', marginBottom: '1rem'}}>{serie.title}</h3>
                {seasons.filter(s => s.movie_id === serie.id).map(season => (
                  <div key={season.id} style={{background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '6px', marginBottom: '1rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                      <h4 style={{color: '#aaa', margin: 0}}>Saison {season.season_number} {season.title ? `- ${season.title}` : ''}</h4>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <button onClick={() => setEditingSeason(season)} className="cyber-button" style={{padding: '4px 10px', fontSize: '0.8rem'}}>Modifier</button>
                        <button onClick={() => handleDeleteSeason(season.id)} className="cyber-button" style={{padding: '4px 10px', fontSize: '0.8rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)'}}>Supprimer</button>
                      </div>
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      {episodes.filter(e => e.season_id === season.id).map(episode => {
                        const epStreams = episodeStreams.filter(es => es.episode_id === episode.id);
                        return (
                          <div key={episode.id} style={{background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '4px'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <span style={{color: '#fff'}}><strong>Épisode {episode.episode_number}:</strong> {episode.title} {episode.duration ? `(${episode.duration}min)` : ''}</span>
                              <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                <span style={{color: '#888', fontSize: '0.9rem'}}>
                                  {epStreams.length} lecteur{epStreams.length > 1 ? 's' : ''}
                                </span>
                                <button onClick={() => setEditingEpisode(episode)} className="cyber-button" style={{padding: '3px 8px', fontSize: '0.75rem'}}>Modifier</button>
                                <button onClick={() => handleDeleteEpisode(episode.id)} className="cyber-button" style={{padding: '3px 8px', fontSize: '0.75rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)'}}>Supprimer</button>
                              </div>
                            </div>
                            {epStreams.length > 0 && (
                              <div style={{marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--neon-blue)'}}>
                                {epStreams.map(stream => (
                                  <div key={stream.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', fontSize: '0.9rem'}}>
                                    <span style={{color: '#aaa'}}>
                                      📺 {stream.server_name} ({stream.quality || 'HD'})
                                    </span>
                                    <button 
                                      onClick={() => handleDeleteEpisodeStream(stream.id)} 
                                      style={{background: 'none', border: 'none', color: '#ff3232', cursor: 'pointer'}}
                                    >
                                      Supprimer
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilisateurs Tab */}
      {activeTab === 'users' && (
        <div className={styles.panel}>
          <h2 className="text-glow-pink">Gestion des Utilisateurs</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {users.length === 0 && <p style={{ color: 'white' }}>Aucun utilisateur.</p>}
            {users.map(user => (
              <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <strong style={{ color: 'white', fontSize: '1.1rem' }}>{user.username || user.email}</strong>
                  {user.username && <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>{user.email}</div>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      background: user.is_admin ? 'rgba(0,255,100,0.2)' : 'rgba(100,100,100,0.2)',
                      border: `1px solid ${user.is_admin ? '#00ff64' : '#666'}`,
                      color: user.is_admin ? '#00ff64' : '#aaa'
                    }}>
                      {user.is_admin ? 'ADMIN' : 'UTILISATEUR'}
                    </span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      background: user.is_banned ? 'rgba(255,50,50,0.2)' : 'rgba(0,255,100,0.2)',
                      border: `1px solid ${user.is_banned ? '#ff3232' : '#00ff64'}`,
                      color: user.is_banned ? '#ff3232' : '#00ff64'
                    }}>
                      {user.is_banned ? 'BANNI' : 'ACTIF'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => toggleAdmin(user.id, user.is_admin)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                    {user.is_admin ? 'Retirer Admin' : 'Rendre Admin'}
                  </button>
                  <button onClick={() => toggleBan(user.id, user.is_banned)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}>
                    {user.is_banned ? 'Débannir' : 'Bannir'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liens Streaming Tab */}
      {activeTab === 'streams' && (
        <div>
          <div className={styles.panel} style={{ marginBottom: '2rem' }}>
            <h2 className="text-glow-pink">Statistiques des Liens</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              {streams.length === 0 && <p style={{ color: 'white' }}>Aucun lien de streaming.</p>}
              {streams.map(stream => (
                <div key={stream.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: 'white', fontSize: '1rem' }}>{stream.movies?.title || 'Film inconnu'}</strong>
                    <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '5px' }}>
                      {stream.server_name || 'Serveur'} - {stream.quality || 'HD'}
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
                      <span style={{ color: '#00ff64' }}>✓ Succès: {stream.success_count || 0}</span>
                      <span style={{ color: '#ff3232' }}>✗ Échecs: {stream.failure_count || 0}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      background: stream.is_active ? 'rgba(0,255,100,0.2)' : 'rgba(255,50,50,0.2)',
                      border: `1px solid ${stream.is_active ? '#00ff64' : '#ff3232'}`,
                      color: stream.is_active ? '#00ff64' : '#ff3232'
                    }}>
                      {stream.is_active ? 'ACTIF' : 'DÉSACTIVÉ'}
                    </span>
                    <button onClick={() => toggleStreamActive(stream.id, stream.is_active)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                      {stream.is_active ? 'Désactiver' : 'Activer'}
                    </button>
                    <button onClick={() => resetStreamStats(stream.id)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>
                      Reset Stats
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.panel}>
            <h2 className="text-glow-pink">Journal des Événements</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
              {streamLogs.length === 0 && <p style={{ color: 'white' }}>Aucun événement.</p>}
              {streamLogs.map(log => (
                <div key={log.id} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '4px' }}>
                  <span style={{ color: log.status === 'success' ? '#00ff64' : '#ff3232', fontWeight: 'bold' }}>
                    {log.status === 'success' ? '✓ SUCCÈS' : '✗ ÉCHEC'}
                  </span>
                  <span style={{ color: '#aaa', marginLeft: '10px' }}>
                    {log.movies?.title || 'Film'} - {new Date(log.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Demandes Tab */}
      {activeTab === 'requests' && (
        <div className={styles.panel}>
          <h2 className="text-glow-pink">Demandes de contenu</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {requests.length === 0 && <p style={{ color: 'white' }}>Aucune demande.</p>}
            {requests.map(request => (
              <div key={request.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div>
                  <strong style={{ color: 'white', fontSize: '1.1rem' }}>{request.title}</strong> 
                  <span style={{ color: '#aaa', marginLeft: '10px' }}>({request.content_type?.toUpperCase()})</span>
                  {request.requested_by && <span style={{ color: '#aaa', marginLeft: '10px' }}>- {request.requested_by}</span>}
                  <div style={{ marginTop: '0.5rem' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      background: request.status === 'pending' ? 'rgba(255,200,0,0.2)' : request.status === 'in_progress' ? 'rgba(0,150,255,0.2)' : request.status === 'completed' ? 'rgba(0,255,100,0.2)' : 'rgba(255,50,50,0.2)',
                      border: `1px solid ${request.status === 'pending' ? '#ffc800' : request.status === 'in_progress' ? '#0096ff' : request.status === 'completed' ? '#00ff64' : '#ff3232'}`,
                      color: request.status === 'pending' ? '#ffc800' : request.status === 'in_progress' ? '#0096ff' : request.status === 'completed' ? '#00ff64' : '#ff3232'
                    }}>
                      {request.status}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <select 
                    value={request.status}
                    onChange={(e) => updateRequestStatus(request.id, e.target.value, request)}
                    style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--glass-border)', color: 'white', borderRadius: '4px' }}
                  >
                    <option value="pending">En attente</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminé</option>
                    <option value="rejected">Refusé</option>
                  </select>
                  <button onClick={() => deleteRequest(request.id)} className="cyber-button" style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sagas Tab */}
      {activeTab === 'sagas' && (
        <div>
          {/* Add New Saga Form */}
          <div className={styles.panel} style={{ marginBottom: '2rem' }}>
            <h2 className="text-glow-pink">Ajouter une Nouvelle Saga</h2>
            <form onSubmit={handleAddSaga} className={styles.adminForm}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Nom de la Saga *</label>
                  <input 
                    type="text" 
                    className={styles.cyberInput} 
                    value={newSagaName} 
                    onChange={(e) => setNewSagaName(e.target.value)} 
                    placeholder="Ex: Marvel Cinematic Universe" 
                    required 
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>URL de l'Affiche *</label>
                  <input 
                    type="text" 
                    className={styles.cyberInput} 
                    value={newSagaPoster} 
                    onChange={(e) => setNewSagaPoster(e.target.value)} 
                    placeholder="https://..." 
                    required 
                  />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea 
                  className={styles.cyberInput} 
                  rows="3" 
                  value={newSagaDesc} 
                  onChange={(e) => setNewSagaDesc(e.target.value)} 
                  placeholder="Synopsis de la saga"
                ></textarea>
              </div>
              <button 
                type="submit" 
                className="cyber-button primary" 
                disabled={isSubmitting}
                style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}
              >
                {isSubmitting ? 'Ajout en cours...' : 'Ajouter la Saga'}
              </button>
            </form>
          </div>

          {/* Manage Existing Sagas */}
          <div className={styles.panel}>
            <h2 className="text-glow-pink">Gérer les Sagas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
              {sagas.length === 0 && <p style={{ color: 'white' }}>Aucune saga.</p>}
              {sagas.map(saga => (
                <div 
                  key={saga.id} 
                  style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '1.5rem', 
                    borderRadius: '8px', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      {saga.poster_url && (
                        <img 
                          src={saga.poster_url} 
                          alt={saga.name} 
                          style={{ width: '100px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                      )}
                      <div>
                        <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{saga.name}</h3>
                        {saga.description && (
                          <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>{saga.description}</p>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => handleEditSaga(saga)} 
                        className="cyber-button" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                      >
                        Modifier
                      </button>
                      <button 
                        onClick={() => setSelectedSagaForManagement(selectedSagaForManagement?.id === saga.id ? null : saga)}
                        className="cyber-button" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                      >
                        Gérer les Films
                      </button>
                      <button 
                        onClick={() => handleDeleteSaga(saga.id)} 
                        className="cyber-button" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>

                  {/* Manage Movies for this Saga */}
                  {selectedSagaForManagement?.id === saga.id && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                      <h4 style={{ color: 'white', marginBottom: '1rem' }}>Films dans la Saga ({saga.saga_movies?.length || 0})</h4>
                      
                      {/* Add Movie to Saga */}
                      <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>Ajouter un Film à la Saga</label>
                        <select 
                          className={styles.cyberInput} 
                          style={{ width: '100%', marginBottom: '0.5rem' }}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddMovieToSaga(saga.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        >
                          <option value="">-- Sélectionner un film --</option>
                          {movies
                            .filter(m => !saga.saga_movies?.some(sm => sm.movie_id === m.id))
                            .map(m => (
                              <option key={m.id} value={m.id}>{m.title} ({m.release_year})</option>
                            ))
                          }
                        </select>
                      </div>

                      {/* List of Movies in Saga */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {(saga.saga_movies || [])
                          .sort((a, b) => a.order_number - b.order_number)
                          .map(sagaMovie => (
                            <div 
                              key={sagaMovie.id} 
                              style={{ 
                                display: 'flex', 
                                gap: '1rem', 
                                alignItems: 'center', 
                                background: 'rgba(0,0,0,0.3)', 
                                padding: '1rem', 
                                borderRadius: '8px' 
                              }}
                            >
                              <div style={{ width: '40px', textAlign: 'center' }}>
                                <input 
                                  type="number" 
                                  value={sagaMovie.order_number} 
                                  onChange={(e) => handleUpdateMovieOrder(sagaMovie.id, parseInt(e.target.value))}
                                  style={{ 
                                    width: '100%', 
                                    background: 'rgba(255,255,255,0.1)', 
                                    border: '1px solid rgba(255,255,255,0.2)', 
                                    color: 'white', 
                                    padding: '0.5rem',
                                    borderRadius: '4px'
                                  }}
                                />
                              </div>
                              {sagaMovie.movies?.poster_url && (
                                <img 
                                  src={sagaMovie.movies.poster_url} 
                                  alt={sagaMovie.movies.title} 
                                  style={{ width: '50px', height: '75px', objectFit: 'cover', borderRadius: '4px' }} 
                                />
                              )}
                              <div style={{ flex: 1 }}>
                                <p style={{ color: 'white', margin: 0 }}>{sagaMovie.movies?.title}</p>
                                <p style={{ color: '#aaa', margin: 0, fontSize: '0.875rem' }}>{sagaMovie.movies?.release_year}</p>
                              </div>
                              <Link 
                                href={`/movie/${sagaMovie.movie_id}`} 
                                className="cyber-button" 
                                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                              >
                                Voir
                              </Link>
                              <button 
                                onClick={() => handleRemoveMovieFromSaga(sagaMovie.id)} 
                                className="cyber-button" 
                                style={{ padding: '4px 8px', fontSize: '0.8rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
                              >
                                Retirer
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Contact Messages Tab */}
      {activeTab === 'contact' && (
        <div className={styles.panel}>
          <h2 className="text-glow-pink">Messages de Contact</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {contactMessages.length === 0 && <p style={{ color: 'white' }}>Aucun message.</p>}
            {contactMessages.map(message => (
              <div 
                key={message.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: `1px solid ${message.is_read ? 'rgba(255,255,255,0.1)' : 'var(--neon-blue)'}`,
                  opacity: message.is_read ? 0.7 : 1
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'white', fontSize: '1.1rem' }}>{message.name}</strong>
                    <span style={{ color: '#aaa', fontSize: '0.9rem' }}>{message.email}</span>
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem',
                      background: message.is_read ? 'rgba(100,100,100,0.2)' : 'rgba(0,150,255,0.2)',
                      border: `1px solid ${message.is_read ? '#666' : '#0096ff'}`,
                      color: message.is_read ? '#aaa' : '#0096ff'
                    }}>
                      {message.is_read ? 'Lu' : 'Non lu'}
                    </span>
                  </div>
                  {message.subject && (
                    <p style={{ color: 'white', marginBottom: '0.5rem', fontStyle: 'italic' }}>{message.subject}</p>
                  )}
                  <p style={{ color: '#aaa', whiteSpace: 'pre-wrap' }}>{message.message}</p>
                  <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {new Date(message.created_at).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {!message.is_read && (
                    <button 
                      onClick={() => markContactMessageRead(message.id)} 
                      className="cyber-button" 
                      style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                    >
                      Marquer comme lu
                    </button>
                  )}
                  <button 
                    onClick={() => deleteContactMessage(message.id)} 
                    className="cyber-button" 
                    style={{ padding: '6px 12px', fontSize: '0.9rem', borderColor: 'var(--neon-pink)', color: 'var(--neon-pink)' }}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
    )}

    {/* Downloads Tab */}
    {activeTab === 'downloads' && (
      <div className={styles.panel}>
        <h2 className="text-glow-pink">Suivi des Téléchargements</h2>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
          marginBottom: '2rem',
          marginTop: '1rem'
        }}>
          <div style={{ 
            background: 'rgba(0,150,255,0.1)', 
            border: '1px solid rgba(0,150,255,0.3)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>Windows</h3>
            <p style={{ color: 'var(--neon-blue)', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {downloads.filter(d => d.platform === 'windows').length}
            </p>
          </div>
          <div style={{ 
            background: 'rgba(34,197,94,0.1)', 
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>Android</h3>
            <p style={{ color: 'var(--neon-green)', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {downloads.filter(d => d.platform === 'android').length}
            </p>
          </div>
          <div style={{ 
            background: 'rgba(251,191,36,0.1)', 
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '8px',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontSize: '1rem' }}>iOS</h3>
            <p style={{ color: 'var(--neon-yellow)', fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              {downloads.filter(d => d.platform === 'ios').length}
            </p>
          </div>
        </div>

        <h3 style={{ color: 'white', marginBottom: '1rem' }}>Historique des Téléchargements</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          {downloads.length === 0 && <p style={{ color: 'white' }}>Aucun téléchargement.</p>}
          {downloads.map(download => (
            <div 
              key={download.id} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: 'rgba(255,255,255,0.05)', 
                padding: '1rem', 
                borderRadius: '8px', 
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  <strong style={{ color: 'white', fontSize: '1.1rem' }}>
                    {download.platform.charAt(0).toUpperCase() + download.platform.slice(1)}
                  </strong>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    background: download.platform === 'windows' ? 'rgba(0,150,255,0.2)' : 
                             download.platform === 'android' ? 'rgba(34,197,94,0.2)' : 
                             'rgba(251,191,36,0.2)',
                    border: '1px solid ' + (download.platform === 'windows' ? '#0096ff' : 
                                      download.platform === 'android' ? '#22c55e' : 
                                      '#fbbf24'),
                    color: download.platform === 'windows' ? '#0096ff' : 
                           download.platform === 'android' ? '#22c55e' : 
                           '#fbbf24'
                  }}>
                    {download.platform.toUpperCase()}
                  </span>
                </div>
                {download.profiles && (
                  <p style={{ color: '#aaa', fontSize: '0.9rem', margin: 0 }}>
                    Utilisateur: {download.profiles.email || 'Invité'}
                  </p>
                )}
                <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  {new Date(download.downloaded_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    
    {/* Banners Tab */}
    {activeTab === 'banners' && (
      <div className={styles.panel}>
        <h2 className="text-glow-yellow">🎨 Gestion des Bannières</h2>
        
        {/* Add/Edit Banner Form */}
        <div className={styles.panel} style={{ marginTop: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)' }}>
          <h3 className="text-glow-blue" style={{ marginBottom: '1rem' }}>{editingBanner ? 'Modifier la Bannière' : 'Ajouter une Bannière'}</h3>
          <form className={styles.adminForm} onSubmit={handleSaveBanner}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>Titre *</label>
                <input 
                  type="text" 
                  className={styles.cyberInput} 
                  value={editingBanner?.title || ''} 
                  onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), title: e.target.value }))} 
                  placeholder="Titre de la bannière..." 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>Ordre d'affichage</label>
                <input 
                  type="number" 
                  className={styles.cyberInput} 
                  value={editingBanner?.display_order || 0} 
                  onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), display_order: parseInt(e.target.value) || 0 }))} 
                  placeholder="0" 
                />
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea 
                className={styles.cyberInput} 
                rows="3" 
                value={editingBanner?.description || ''} 
                onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), description: e.target.value }))} 
                placeholder="Description courte..."
              ></textarea>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>URL de l'image *</label>
                <input 
                  type="text" 
                  className={styles.cyberInput} 
                  value={editingBanner?.image_url || ''} 
                  onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), image_url: e.target.value }))} 
                  placeholder="https://example.com/image.jpg" 
                  required 
                />
              </div>
              <div className={styles.formGroup}>
                <label>URL du lien (optionnel)</label>
                <input 
                  type="text" 
                  className={styles.cyberInput} 
                  value={editingBanner?.link_url || ''} 
                  onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), link_url: e.target.value }))} 
                  placeholder="/movie/123 ou https://..."
                />
              </div>
            </div>
            
            <div className={styles.formGroup} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ margin: 0 }}>Actif</label>
              <input 
                type="checkbox" 
                checked={editingBanner?.is_active !== false} 
                onChange={(e) => setEditingBanner(prev => ({ ...(prev || {}), is_active: e.target.checked }))} 
                style={{ width: 'auto', transform: 'scale(1.5)', cursor: 'pointer' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="cyber-button primary" disabled={isSubmitting}>
                {editingBanner ? 'Sauvegarder' : 'Ajouter'}
              </button>
              {editingBanner && (
                <button 
                  type="button" 
                  className="cyber-button" 
                  onClick={() => setEditingBanner(null)}
                >
                  Annuler
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Banner List */}
        <h3 className="text-glow-green" style={{ marginBottom: '1rem' }}>Liste des Bannières</h3>
        {banners.length === 0 ? (
          <p style={{ color: '#aaa' }}>Aucune bannière pour le moment.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {banners.map(banner => (
              <div 
                key={banner.id} 
                style={{ 
                  background: 'rgba(255,255,255,0.05)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  border: `1px solid ${banner.is_active ? 'var(--neon-blue)' : '#444'}` 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h4 style={{ color: 'white', margin: 0, fontSize: '1rem' }}>{banner.title}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      onClick={() => setEditingBanner(banner)} 
                      className="cyber-button" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                    >
                      ✏️ Modifier
                    </button>
                    <button 
                      onClick={() => handleDeleteBanner(banner.id)} 
                      className="cyber-button" 
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderColor: '#ff4444' }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
                <p style={{ color: '#aaa', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                  {banner.description}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    background: banner.is_active ? 'rgba(0,255,100,0.2)' : 'rgba(255,0,0,0.2)', 
                    border: `1px solid ${banner.is_active ? '#00ff64' : '#ff4444'}`, 
                    color: banner.is_active ? '#00ff64' : '#ff4444' 
                  }}>
                    {banner.is_active ? 'ACTIF' : 'INACTIF'}
                  </span>
                  <span style={{ 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem', 
                    background: 'rgba(0,0,0,0.3)', 
                    border: '1px solid #444', 
                    color: '#aaa' 
                  }}>
                    Ordre: {banner.display_order}
                  </span>
                </div>
                {banner.image_url && (
                  <img 
                    src={banner.image_url} 
                    alt={banner.title} 
                    style={{ width: '100%', borderRadius: '4px', marginTop: '0.5rem', maxHeight: '150px', objectFit: 'cover' }} 
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )}

    {/* Edit Modal */}
      {editingMovie && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.panel} style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--neon-blue)', boxShadow: '0 0 30px rgba(0, 243, 255, 0.3)' }}>
            <h2 className="text-glow-blue" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              Modifier: {editingMovie.title}
              <button onClick={() => setEditingMovie(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </h2>
            <form className={styles.adminForm} onSubmit={handleUpdateMovie}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Type</label>
                  <select className={styles.cyberInput} value={editingMovie.content_type || 'film'} onChange={(e) => handleEditChange('content_type', e.target.value)}>
                    <option value="film">Film</option>
                    <option value="serie">Série</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Titre</label>
                  <input type="text" className={styles.cyberInput} value={editingMovie.title} onChange={(e) => handleEditChange('title', e.target.value)} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea className={styles.cyberInput} rows="3" value={editingMovie.description || ''} onChange={(e) => handleEditChange('description', e.target.value)}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Affiche (URL)</label>
                  <input type="text" className={styles.cyberInput} value={editingMovie.poster_url} onChange={(e) => handleEditChange('poster_url', e.target.value)} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Bande-Annonce (URL)</label>
                  <input type="text" className={styles.cyberInput} value={editingMovie.trailer_url || ''} onChange={(e) => handleEditChange('trailer_url', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Année</label>
                  <input type="text" className={styles.cyberInput} value={editingMovie.release_year || ''} onChange={(e) => handleEditChange('release_year', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Catégorie</label>
                  <select 
                    className={styles.cyberInput}
                    value={editingMovie.category || ''}
                    onChange={(e) => handleEditChange('category', e.target.value)}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {GENRES.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Classification d'âge</label>
                  <select className={styles.cyberInput} value={editingMovie.age_rating || '10+'} onChange={(e) => handleEditChange('age_rating', e.target.value)}>
                    <option value="10+">10+</option>
                    <option value="12+">12+</option>
                    <option value="16+">16+</option>
                    <option value="18+">18+</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Plateforme</label>
                  <select className={styles.cyberInput} value={editingMovie.platform || ''} onChange={(e) => handleEditChange('platform', e.target.value)}>
                    <option value="">Sélectionner une plateforme</option>
                    <option value="Netflix">Netflix</option>
                    <option value="Disney+">Disney+</option>
                    <option value="Prime Video">Prime Video</option>
                    <option value="Apple TV+">Apple TV+</option>
                    <option value="Max">Max</option>
                    <option value="Paramount+">Paramount+</option>
                    <option value="Disney">Disney</option>
                    <option value="Marvel">Marvel</option>
                    <option value="Star Wars">Star Wars</option>
                    <option value="DC">DC</option>
                    <option value="Anime">Anime</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Statut</label>
                  <select className={styles.cyberInput} value={editingMovie.status || 'sortie'} onChange={(e) => handleEditChange('status', e.target.value)}>
                    <option value="sortie">Sortie</option>
                    <option value="a venir">À venir</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="cyber-button primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}>
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Season Modal */}
      {editingSeason && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.panel} style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--neon-pink)', boxShadow: '0 0 30px rgba(255, 102, 178, 0.3)' }}>
            <h2 className="text-glow-pink" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              Modifier la Saison {editingSeason.season_number}
              <button onClick={() => setEditingSeason(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </h2>
            <form className={styles.adminForm} onSubmit={handleUpdateSeason}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Numéro de Saison</label>
                  <input type="number" className={styles.cyberInput} value={editingSeason.season_number} onChange={(e) => handleEditSeasonChange('season_number', parseInt(e.target.value))} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Titre de la Saison</label>
                  <input type="text" className={styles.cyberInput} value={editingSeason.title || ''} onChange={(e) => handleEditSeasonChange('title', e.target.value)} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea className={styles.cyberInput} rows="3" value={editingSeason.description || ''} onChange={(e) => handleEditSeasonChange('description', e.target.value)}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Poster (URL)</label>
                  <input type="text" className={styles.cyberInput} value={editingSeason.poster_url || ''} onChange={(e) => handleEditSeasonChange('poster_url', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Date de sortie</label>
                  <input type="date" className={styles.cyberInput} value={editingSeason.release_date || ''} onChange={(e) => handleEditSeasonChange('release_date', e.target.value)} />
                </div>
              </div>
              <button type="submit" className="cyber-button primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}>
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Episode Modal */}
      {editingEpisode && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
          <div className={styles.panel} style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', border: '2px solid var(--neon-green)', boxShadow: '0 0 30px rgba(0, 255, 100, 0.3)' }}>
            <h2 className="text-glow-green" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              Modifier l'Épisode {editingEpisode.episode_number}
              <button onClick={() => setEditingEpisode(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </h2>
            <form className={styles.adminForm} onSubmit={handleUpdateEpisode}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Numéro d'Épisode</label>
                  <input type="number" className={styles.cyberInput} value={editingEpisode.episode_number} onChange={(e) => handleEditEpisodeChange('episode_number', parseInt(e.target.value))} required />
                </div>
                <div className={styles.formGroup}>
                  <label>Titre</label>
                  <input type="text" className={styles.cyberInput} value={editingEpisode.title} onChange={(e) => handleEditEpisodeChange('title', e.target.value)} required />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>Description</label>
                <textarea className={styles.cyberInput} rows="3" value={editingEpisode.description || ''} onChange={(e) => handleEditEpisodeChange('description', e.target.value)}></textarea>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className={styles.formGroup}>
                  <label>Durée (minutes)</label>
                  <input type="number" className={styles.cyberInput} value={editingEpisode.duration || ''} onChange={(e) => handleEditEpisodeChange('duration', parseInt(e.target.value))} />
                </div>
                <div className={styles.formGroup}>
                  <label>Poster (URL)</label>
                  <input type="text" className={styles.cyberInput} value={editingEpisode.poster_url || ''} onChange={(e) => handleEditEpisodeChange('poster_url', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label>Statut</label>
                  <select className={styles.cyberInput} value={editingEpisode.status || 'sortie'} onChange={(e) => handleEditEpisodeChange('status', e.target.value)}>
                    <option value="sortie">Sortie</option>
                    <option value="a venir">À venir</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="cyber-button primary" style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}>
                Enregistrer les modifications
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
