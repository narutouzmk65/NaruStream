-- 🔥 SUPABASE COMPLETE SETUP FOR NARUSTREAM 🔥
-- Exécute ce fichier DANS L'ORDRE dans SQL Editor Supabase

-- 1. Supprime les anciens triggers (pour éviter les erreurs)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- 2. Crée TOUTES les tables nécessaires
CREATE TABLE IF NOT EXISTS public.movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  backdrop_url TEXT,
  trailer_url TEXT,
  release_year TEXT,
  category TEXT,
  content_type TEXT DEFAULT 'film',
  current_link_index INTEGER DEFAULT 0,
  age_rating TEXT DEFAULT 'Tous publics',
  platform TEXT,
  status TEXT DEFAULT 'sortie',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  player_url TEXT NOT NULL,
  m3u8_url TEXT,
  server_name TEXT,
  quality TEXT,
  is_active BOOLEAN DEFAULT true,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  username TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  max_profiles INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  pin TEXT,
  is_kid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.content_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'film',
  description TEXT,
  requested_by TEXT,
  requested_by_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.sagas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.saga_movies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  saga_id UUID REFERENCES public.sagas(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  order_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(saga_id, movie_id)
);

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL,
  title TEXT,
  poster_url TEXT,
  description TEXT,
  release_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(movie_id, season_number)
);

CREATE TABLE IF NOT EXISTS public.episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.seasons(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  poster_url TEXT,
  status TEXT DEFAULT 'sortie',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(season_id, episode_number)
);

CREATE TABLE IF NOT EXISTS public.episode_streams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_id UUID REFERENCES public.episodes(id) ON DELETE CASCADE,
  player_url TEXT NOT NULL,
  m3u8_url TEXT,
  server_name TEXT,
  quality TEXT,
  is_active BOOLEAN DEFAULT true,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  stream_id UUID REFERENCES public.streams(id) ON DELETE SET NULL,
  progress INTEGER DEFAULT 0,
  watched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_completed BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stream_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID REFERENCES public.streams(id) ON DELETE CASCADE,
  movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.downloads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.site_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  maintenance_mode BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, is_admin)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crée le trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. ACTIVE LA SÉCURITÉ RLS SUR TOUTES LES TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 6. POLITIQUES RLS (sécurité)
-- POLITIQUES pour PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour USER_PROFILES
DROP POLICY IF EXISTS "Users can view their own user profiles" ON public.user_profiles;
CREATE POLICY "Users can view their own user profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert their own user profiles" ON public.user_profiles;
CREATE POLICY "Users can insert their own user profiles" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own user profiles" ON public.user_profiles;
CREATE POLICY "Users can update their own user profiles" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete their own user profiles" ON public.user_profiles;
CREATE POLICY "Users can delete their own user profiles" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- POLITIQUES pour MOVIES
DROP POLICY IF EXISTS "Allow public read access to movies" ON public.movies;
CREATE POLICY "Allow public read access to movies" ON public.movies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage movies" ON public.movies;
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour STREAMS
DROP POLICY IF EXISTS "Allow public read access to streams" ON public.streams;
CREATE POLICY "Allow public read access to streams" ON public.streams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage streams" ON public.streams;
CREATE POLICY "Admins can manage streams" ON public.streams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Anyone can increment stream stats" ON public.streams;
CREATE POLICY "Anyone can increment stream stats" ON public.streams FOR UPDATE USING (true);

-- POLITIQUES pour CONTENT_REQUESTS
DROP POLICY IF EXISTS "Allow public read access to content_requests" ON public.content_requests;
CREATE POLICY "Allow public read access to content_requests" ON public.content_requests FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert to content_requests" ON public.content_requests;
CREATE POLICY "Allow public insert to content_requests" ON public.content_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage content_requests" ON public.content_requests;
CREATE POLICY "Admins can manage content_requests" ON public.content_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour SAGAS & SAGA_MOVIES
DROP POLICY IF EXISTS "Allow public read access to sagas" ON public.sagas;
CREATE POLICY "Allow public read access to sagas" ON public.sagas FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage sagas" ON public.sagas;
CREATE POLICY "Admins can manage sagas" ON public.sagas FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Allow public read access to saga_movies" ON public.saga_movies;
CREATE POLICY "Allow public read access to saga_movies" ON public.saga_movies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage saga_movies" ON public.saga_movies;
CREATE POLICY "Admins can manage saga_movies" ON public.saga_movies FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour SEASONS
DROP POLICY IF EXISTS "Allow public read access to seasons" ON public.seasons;
CREATE POLICY "Allow public read access to seasons" ON public.seasons FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage seasons" ON public.seasons;
CREATE POLICY "Admins can manage seasons" ON public.seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour EPISODES
DROP POLICY IF EXISTS "Allow public read access to episodes" ON public.episodes;
CREATE POLICY "Allow public read access to episodes" ON public.episodes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage episodes" ON public.episodes;
CREATE POLICY "Admins can manage episodes" ON public.episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour EPISODE_STREAMS
DROP POLICY IF EXISTS "Allow public read access to episode_streams" ON public.episode_streams;
CREATE POLICY "Allow public read access to episode_streams" ON public.episode_streams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage episode_streams" ON public.episode_streams;
CREATE POLICY "Admins can manage episode_streams" ON public.episode_streams FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
DROP POLICY IF EXISTS "Anyone can increment episode stream stats" ON public.episode_streams;
CREATE POLICY "Anyone can increment episode stream stats" ON public.episode_streams FOR UPDATE USING (true);

-- POLITIQUES pour WATCH_HISTORY
DROP POLICY IF EXISTS "Users can view their own watch history" ON public.watch_history;
CREATE POLICY "Users can view their own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own watch history" ON public.watch_history;
CREATE POLICY "Users can manage their own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all watch history" ON public.watch_history;
CREATE POLICY "Admins can view all watch history" ON public.watch_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour STREAM_LOGS
DROP POLICY IF EXISTS "Allow public insert to stream_logs" ON public.stream_logs;
CREATE POLICY "Allow public insert to stream_logs" ON public.stream_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all stream logs" ON public.stream_logs;
CREATE POLICY "Admins can view all stream logs" ON public.stream_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour USER_LISTS
DROP POLICY IF EXISTS "Users can view their own list" ON public.user_lists;
CREATE POLICY "Users can view their own list" ON public.user_lists FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own list" ON public.user_lists;
CREATE POLICY "Users can manage their own list" ON public.user_lists FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all lists" ON public.user_lists;
CREATE POLICY "Admins can view all lists" ON public.user_lists FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour NOTIFICATIONS
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
CREATE POLICY "Admins can manage notifications" ON public.notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour CONTACT_MESSAGES
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON public.contact_messages;
CREATE POLICY "Allow public insert to contact_messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can manage contact messages" ON public.contact_messages;
CREATE POLICY "Admins can manage contact messages" ON public.contact_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour DOWNLOADS
DROP POLICY IF EXISTS "Allow public insert to downloads" ON public.downloads;
CREATE POLICY "Allow public insert to downloads" ON public.downloads FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can view all downloads" ON public.downloads;
CREATE POLICY "Admins can view all downloads" ON public.downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- POLITIQUES pour SITE_CONFIG
DROP POLICY IF EXISTS "Allow public read access to site_config" ON public.site_config;
CREATE POLICY "Allow public read access to site_config" ON public.site_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage site config" ON public.site_config;
CREATE POLICY "Admins can manage site config" ON public.site_config FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 7. CRÉE LES INDEX pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_streams_movie_id ON public.streams(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_stream_id ON public.stream_logs(stream_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_movie_id ON public.seasons(movie_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON public.episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_movie_id ON public.episodes(movie_id);
CREATE INDEX IF NOT EXISTS idx_episode_streams_episode_id ON public.episode_streams(episode_id);

-- 8. Insère la config par défaut
INSERT INTO public.site_config (id, maintenance_mode)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- 9. 🎉 FÉLICITATIONS ! Maintenant, tu es prêt à utiliser NaruStream !
-- Prochaine étape : exécute le fichier "update-movies-categories.sql" pour avoir des exemples de contenu
