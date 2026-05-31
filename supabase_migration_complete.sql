-- ============================================================================
--  SUPABASE MIGRATION COMPLETE - NARUSTREAM (FINALE)
-- ============================================================================
--  1. Copie TOUT ce fichier
--  2. Colle-le dans l'éditeur SQL de ton projet Supabase
--  3. Clique sur "Run"
-- ============================================================================

-- 1. AJOUTER LES COLONNES MANQUANTES A LA TABLE MOVIES
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'content_type') THEN
    ALTER TABLE public.movies ADD COLUMN content_type text DEFAULT 'film';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'current_link_index') THEN
    ALTER TABLE public.movies ADD COLUMN current_link_index integer DEFAULT 0;
  END IF;
END $$;

-- 2. AJOUTER LES COLONNES MANQUANTES A LA TABLE STREAMS
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

-- 3. CREER/AMELIORER LA TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text,
  is_admin boolean DEFAULT false,
  is_banned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ACTIVER RLS SUR LA TABLE PROFILES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREER LES TABLES SPECIFIQUES A NARUSTREAM SI ELLES N'EXISTENT PAS
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

CREATE TABLE IF NOT EXISTS public.user_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS public.watch_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_profile_id uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  stream_id uuid REFERENCES public.streams(id) ON DELETE SET NULL,
  progress integer DEFAULT 0,
  watched_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  is_completed boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.stream_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id uuid REFERENCES public.streams(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  status text NOT NULL,
  error_message text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ACTIVER RLS SUR TOUTES LES NOUVELLES TABLES
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episode_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_logs ENABLE ROW LEVEL SECURITY;

-- 7. FONCTION TRIGGER POUR CREER AUTOMATIQUEMENT LE PROFILE
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, is_admin)
  VALUES (NEW.id, NEW.email, split_part(NEW.email, '@', 1), false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. CREER LE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. DEFINIR TOUTES LES POLITIQUES RLS
-- POLITIQUES POUR PROFILES
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR SEASONS
DROP POLICY IF EXISTS "Allow public read access to seasons" ON public.seasons;
CREATE POLICY "Allow public read access to seasons" ON public.seasons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage seasons" ON public.seasons;
CREATE POLICY "Admins can manage seasons" ON public.seasons FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR EPISODES
DROP POLICY IF EXISTS "Allow public read access to episodes" ON public.episodes;
CREATE POLICY "Allow public read access to episodes" ON public.episodes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage episodes" ON public.episodes;
CREATE POLICY "Admins can manage episodes" ON public.episodes FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR EPISODE_STREAMS
DROP POLICY IF EXISTS "Allow public read access to episode_streams" ON public.episode_streams;
CREATE POLICY "Allow public read access to episode_streams" ON public.episode_streams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage episode_streams" ON public.episode_streams;
CREATE POLICY "Admins can manage episode_streams" ON public.episode_streams FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Anyone can increment episode stream stats" ON public.episode_streams;
CREATE POLICY "Anyone can increment episode stream stats" ON public.episode_streams FOR UPDATE USING (true);

-- POLITIQUES POUR USER_LISTS
DROP POLICY IF EXISTS "Users can view their own list" ON public.user_lists;
CREATE POLICY "Users can view their own list" ON public.user_lists FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own list" ON public.user_lists;
CREATE POLICY "Users can manage their own list" ON public.user_lists FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all lists" ON public.user_lists;
CREATE POLICY "Admins can view all lists" ON public.user_lists FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR WATCH_HISTORY
DROP POLICY IF EXISTS "Users can view their own watch history" ON public.watch_history;
CREATE POLICY "Users can view their own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own watch history" ON public.watch_history;
CREATE POLICY "Users can manage their own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all watch history" ON public.watch_history;
CREATE POLICY "Admins can view all watch history" ON public.watch_history FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR STREAM_LOGS
DROP POLICY IF EXISTS "Allow public insert to stream_logs" ON public.stream_logs;
CREATE POLICY "Allow public insert to stream_logs" ON public.stream_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all stream logs" ON public.stream_logs;
CREATE POLICY "Admins can view all stream logs" ON public.stream_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR MOVIES
DROP POLICY IF EXISTS "Admins can manage movies" ON public.movies;
CREATE POLICY "Admins can manage movies" ON public.movies FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR STREAMS
DROP POLICY IF EXISTS "Admins can manage streams" ON public.streams;
CREATE POLICY "Admins can manage streams" ON public.streams FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Anyone can increment stream stats" ON public.streams;
CREATE POLICY "Anyone can increment stream stats" ON public.streams FOR UPDATE USING (true);

-- POLITIQUES POUR CONTENT_REQUESTS
DROP POLICY IF EXISTS "Admins can manage content_requests" ON public.content_requests;
CREATE POLICY "Admins can manage content_requests" ON public.content_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR SAGAS
DROP POLICY IF EXISTS "Admins can manage sagas" ON public.sagas;
CREATE POLICY "Admins can manage sagas" ON public.sagas FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- POLITIQUES POUR SAGA_MOVIES
DROP POLICY IF EXISTS "Admins can manage saga_movies" ON public.saga_movies;
CREATE POLICY "Admins can manage saga_movies" ON public.saga_movies FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 10. CREER LES INDEX POUR LES PERFORMANCES
CREATE INDEX IF NOT EXISTS idx_streams_movie_id ON public.streams(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_stream_id ON public.stream_logs(stream_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_seasons_movie_id ON public.seasons(movie_id);
CREATE INDEX IF NOT EXISTS idx_episodes_season_id ON public.episodes(season_id);
CREATE INDEX IF NOT EXISTS idx_episodes_movie_id ON public.episodes(movie_id);
CREATE INDEX IF NOT EXISTS idx_episode_streams_episode_id ON public.episode_streams(episode_id);

-- ============================================================================
--  FIN DU SCRIPT
-- ============================================================================
--  Après avoir exécuté ça :
--  1. Dans Supabase → Authentication → Providers → Email → Désactiver "Confirm email"
--  2. Dans la table profiles, passe ton compte en is_admin: true !
-- ============================================================================
