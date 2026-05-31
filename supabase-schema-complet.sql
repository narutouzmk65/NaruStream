-- Schema SQL COMPLET et MIS À JOUR pour NaruStream
-- À exécuter dans l'éditeur SQL de votre projet Supabase
-- Ce script ajoute TOUT ce qui manque : gestion admins, suivi liens, historique, etc.

-- Suppression des triggers et fonctions existants pour éviter les erreurs
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Création de toutes les tables (avec ajouts)
CREATE TABLE IF NOT EXISTS public.movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  release_year text,
  category text,
  content_type text DEFAULT 'film',
  current_link_index integer DEFAULT 0, -- Index du lien actif pour rotation
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.streams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  player_url text NOT NULL,
  m3u8_url text,
  server_name text,
  quality text,
  is_active boolean DEFAULT true,
  success_count integer DEFAULT 0,
  failure_count integer DEFAULT 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE,
  max_profiles integer DEFAULT 5,
  is_admin boolean DEFAULT false, -- Nouveau : rôle admin
  is_banned boolean DEFAULT false, -- Nouveau : bannir utilisateur
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_url text,
  pin text,
  is_kid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.content_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'film',
  description text,
  requested_by text,
  requested_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nouveau : lien vers l'utilisateur
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sagas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  poster_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saga_movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  saga_id uuid REFERENCES public.sagas(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  order_number integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(saga_id, movie_id)
);

-- NOUVELLE TABLE : Historique de visionnage des utilisateurs
CREATE TABLE IF NOT EXISTS public.watch_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_profile_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES public.streams(id) ON DELETE SET NULL,
  progress integer DEFAULT 0, -- Pourcentage de progression (0-100)
  watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_completed boolean DEFAULT false
);

-- NOUVELLE TABLE : Suivi des échecs/succès des liens de streaming
CREATE TABLE IF NOT EXISTS public.stream_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL, -- 'success' ou 'failure'
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- NOUVELLE TABLE : "Ma Liste" des utilisateurs (favoris)
CREATE TABLE IF NOT EXISTS public.user_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id) -- Empêche d'ajouter le même film plusieurs fois
);

-- Fonction pour créer un profil automatique lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Active RLS (Row Level Security) sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_logs ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour la table user_profiles
CREATE POLICY "Users can view their own user profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user profiles" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user profiles" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user profiles" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour la table movies
CREATE POLICY "Allow public read access to movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour la table streams
CREATE POLICY "Allow public read access to streams" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage streams" ON public.streams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
CREATE POLICY "Anyone can increment stream stats" ON public.streams FOR UPDATE USING (true);

-- Politiques RLS pour la table content_requests
CREATE POLICY "Allow public read access to content_requests" ON public.content_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert to content_requests" ON public.content_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage content_requests" ON public.content_requests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour la table sagas
CREATE POLICY "Allow public read access to sagas" ON public.sagas FOR SELECT USING (true);
CREATE POLICY "Admins can manage sagas" ON public.sagas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour la table saga_movies
CREATE POLICY "Allow public read access to saga_movies" ON public.saga_movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage saga_movies" ON public.saga_movies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour watch_history
CREATE POLICY "Users can view their own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all watch history" ON public.watch_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour stream_logs
CREATE POLICY "Allow public insert to stream_logs" ON public.stream_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all stream logs" ON public.stream_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques RLS pour user_lists (Ma Liste)
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own list" ON public.user_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own list" ON public.user_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lists" ON public.user_lists FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_streams_movie_id ON public.streams(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_stream_id ON public.stream_logs(stream_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);
