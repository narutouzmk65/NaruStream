
-- ============================================
-- SUPABASE MIGRATION FINALE - NARUSTREAM
-- ============================================

-- 1. Ajouter colonne pour distinguer films et séries dans la table movies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'content_type') THEN
    ALTER TABLE public.movies ADD COLUMN content_type text DEFAULT 'film';
  END IF;
END $$;

-- 2. Ajouter colonnes pour la gestion des liens (films)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'current_link_index') THEN
    ALTER TABLE public.movies ADD COLUMN current_link_index integer DEFAULT 0;
  END IF;
END $$;

-- 3. Mettre à jour la table streams
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'm3u8_url') THEN
    ALTER TABLE public.streams ADD COLUMN m3u8_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'is_active') THEN
    ALTER TABLE public.streams ADD COLUMN is_active boolean DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'success_count') THEN
    ALTER TABLE public.streams ADD COLUMN success_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'failure_count') THEN
    ALTER TABLE public.streams ADD COLUMN failure_count integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'streams' AND column_name = 'last_used_at') THEN
    ALTER TABLE public.streams ADD COLUMN last_used_at timestamp with time zone;
  END IF;
END $$;

-- 4. Mettre à jour la table profiles pour les admins/utilisateurs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_banned') THEN
    ALTER TABLE public.profiles ADD COLUMN is_banned boolean DEFAULT false;
  END IF;
END $$;

-- 5. Créer la table des saisons
CREATE TABLE IF NOT EXISTS public.seasons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  season_number integer NOT NULL,
  title text,
  poster_url text,
  description text,
  release_date date,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(movie_id, season_number)
);

-- 6. Créer la table des épisodes
CREATE TABLE IF NOT EXISTS public.episodes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id uuid REFERENCES public.seasons(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_number integer NOT NULL,
  title text NOT NULL,
  description text,
  duration integer,
  poster_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(season_id, episode_number)
);

-- 7. Créer la table des liens d'épisodes
CREATE TABLE IF NOT EXISTS public.episode_streams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE CASCADE,
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

-- 8. Créer la table "Ma Liste" des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

-- 9. Créer la table watch_history (si pas déjà là)
DO $$ BEGIN
  ALTER TABLE public.watch_history ADD COLUMN IF NOT EXISTS episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL;
EXCEPTION
  WHEN undefined_column THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.watch_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_profile_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_id uuid REFERENCES public.episodes(id) ON DELETE SET NULL,
  stream_id uuid REFERENCES public.streams(id) ON DELETE SET NULL,
  progress integer DEFAULT 0,
  watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_completed boolean DEFAULT false
);

-- 10. Créer la table stream_logs (si pas déjà là)
CREATE TABLE IF NOT EXISTS public.stream_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Mettre à jour la fonction handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 13. Activer RLS sur les nouvelles tables
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_logs ENABLE ROW LEVEL SECURITY;

-- 14. Définir les politiques de sécurité (RLS)

-- Politiques pour seasons
DROP POLICY IF EXISTS "Allow public read access to seasons" ON public.seasons;
CREATE POLICY "Allow public read access to seasons" ON public.seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage seasons" ON public.seasons;
CREATE POLICY "Admins can manage seasons" ON public.seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour episodes
DROP POLICY IF EXISTS "Allow public read access to episodes" ON public.episodes;
CREATE POLICY "Allow public read access to episodes" ON public.episodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage episodes" ON public.episodes;
CREATE POLICY "Admins can manage episodes" ON public.episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour episode_streams
DROP POLICY IF EXISTS "Allow public read access to episode_streams" ON public.episode_streams;
CREATE POLICY "Allow public read access to episode_streams" ON public.episode_streams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage episode_streams" ON public.episode_streams;
CREATE POLICY "Admins can manage episode_streams" ON public.episode_streams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Anyone can increment episode stream stats" ON public.episode_streams;
CREATE POLICY "Anyone can increment episode stream stats" ON public.episode_streams FOR UPDATE USING (true);

-- Politiques pour user_lists (Ma Liste)
DROP POLICY IF EXISTS "Users can view their own list" ON public.user_lists;
CREATE POLICY "Users can view their own list" ON public.user_lists FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own list" ON public.user_lists;
CREATE POLICY "Users can manage their own list" ON public.user_lists FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all lists" ON public.user_lists;
CREATE POLICY "Admins can view all lists" ON public.user_lists FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour watch_history
DROP POLICY IF EXISTS "Users can view their own watch history" ON public.watch_history;
CREATE POLICY "Users can view their own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own watch history" ON public.watch_history;
CREATE POLICY "Users can manage their own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all watch history" ON public.watch_history;
CREATE POLICY "Admins can view all watch history" ON public.watch_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour stream_logs
DROP POLICY IF EXISTS "Allow public insert to stream_logs" ON public.stream_logs;
CREATE POLICY "Allow public insert to stream_logs" ON public.stream_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all stream logs" ON public.stream_logs;
CREATE POLICY "Admins can view all stream logs" ON public.stream_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour movies (supprimer les anciennes, mettre à jour)
DROP POLICY IF EXISTS "Allow public insert to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public update to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public delete to movies" ON public.movies;
DROP POLICY IF EXISTS "Admins can manage movies" ON public.movies;
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour streams (supprimer les anciennes, mettre à jour)
DROP POLICY IF EXISTS "Allow public insert to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public update to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public delete to streams" ON public.streams;
DROP POLICY IF EXISTS "Admins can manage streams" ON public.streams;
CREATE POLICY "Admins can manage streams" ON public.streams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Anyone can increment stream stats" ON public.streams;
CREATE POLICY "Anyone can increment stream stats" ON public.streams FOR UPDATE USING (true);

-- Politiques pour content_requests
DROP POLICY IF EXISTS "Allow public update to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public delete to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Admins can manage content_requests" ON public.content_requests;
CREATE POLICY "Admins can manage content_requests" ON public.content_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour sagas
DROP POLICY IF EXISTS "Allow public insert to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public update to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public delete to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Admins can manage sagas" ON public.sagas;
CREATE POLICY "Admins can manage sagas" ON public.sagas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques pour saga_movies
DROP POLICY IF EXISTS "Allow public insert to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public update to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public delete to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Admins can manage saga_movies" ON public.saga_movies;
CREATE POLICY "Admins can manage saga_movies" ON public.saga_movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Politiques étendues pour profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Allow inserting profiles (for new users)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles 
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id);

-- 16. Créer la table des notifications utilisateurs
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Politiques pour notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can mark their notifications as read" ON public.notifications;
CREATE POLICY "Users can mark their notifications as read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications" ON public.notifications FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 15. Créer les index pour les performances
CREATE INDEX IF NOT EXISTS idx_streams_movie_id ON public.streams(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_stream_id ON public.stream_logs(stream_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_movie_id ON public.seasons(movie_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON public.episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_movie_id ON public.episodes(movie_id);
CREATE INDEX IF NOT EXISTS idx_episode_streams_episode_id ON public.episode_streams(episode_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
