-- ============================================
-- MIGRATION SÉCURISÉE - NARUSTREAM
-- Ajoute les nouvelles fonctionnalités sans perte de données
-- ============================================

-- 1. Ajouter les colonnes manquantes à la table movies
ALTER TABLE public.movies 
ADD COLUMN IF NOT EXISTS current_link_index integer DEFAULT 0;

-- 2. Ajouter les colonnes manquantes à la table streams
ALTER TABLE public.streams 
ADD COLUMN IF NOT EXISTS m3u8_url text,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS success_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS failure_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;

-- 3. Ajouter les colonnes manquantes à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- 4. Ajouter la colonne manquante à content_requests
ALTER TABLE public.content_requests 
ADD COLUMN IF NOT EXISTS requested_by_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Créer les nouvelles tables si elles n'existent pas
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

-- 5.bis Créer la table "Ma Liste" des utilisateurs (favoris)
CREATE TABLE IF NOT EXISTS public.user_lists (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  added_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, movie_id) -- Empêche d'ajouter le même film plusieurs fois
);

-- 6. Mettre à jour la fonction handle_new_user pour inclure is_admin
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, is_admin)
  VALUES (NEW.id, NEW.email, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recréer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Activer RLS sur les nouvelles tables
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

-- 9. Supprimer les anciennes politiques trop permissives (pour sécurité)
DROP POLICY IF EXISTS "Allow public insert to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public update to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public delete to movies" ON public.movies;

DROP POLICY IF EXISTS "Allow public insert to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public update to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public delete to streams" ON public.streams;

DROP POLICY IF EXISTS "Allow public update to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public delete to content_requests" ON public.content_requests;

DROP POLICY IF EXISTS "Allow public insert to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public update to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public delete to sagas" ON public.sagas;

DROP POLICY IF EXISTS "Allow public insert to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public update to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public delete to saga_movies" ON public.saga_movies;

-- 10. Ajouter les nouvelles politiques sécurisées
-- Politiques pour movies
CREATE POLICY IF NOT EXISTS "Admins can manage movies" ON public.movies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour streams
CREATE POLICY IF NOT EXISTS "Admins can manage streams" ON public.streams FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
CREATE POLICY IF NOT EXISTS "Anyone can increment stream stats" ON public.streams FOR UPDATE USING (true);

-- Politiques pour content_requests
CREATE POLICY IF NOT EXISTS "Admins can manage content_requests" ON public.content_requests FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour sagas
CREATE POLICY IF NOT EXISTS "Admins can manage sagas" ON public.sagas FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour saga_movies
CREATE POLICY IF NOT EXISTS "Admins can manage saga_movies" ON public.saga_movies FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour watch_history
CREATE POLICY IF NOT EXISTS "Users can view their own watch history" ON public.watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can manage their own watch history" ON public.watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admins can view all watch history" ON public.watch_history FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour stream_logs
CREATE POLICY IF NOT EXISTS "Allow public insert to stream_logs" ON public.stream_logs FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "Admins can view all stream logs" ON public.stream_logs FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques pour user_lists (Ma Liste)
DROP POLICY IF EXISTS "Users can view their own list" ON public.user_lists;
CREATE POLICY "Users can view their own list" ON public.user_lists FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can manage their own list" ON public.user_lists;
CREATE POLICY "Users can manage their own list" ON public.user_lists FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all lists" ON public.user_lists;
CREATE POLICY "Admins can view all lists" ON public.user_lists FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- Politiques étendues pour profiles (admins peuvent gérer)
CREATE POLICY IF NOT EXISTS "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);
CREATE POLICY IF NOT EXISTS "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 11. Créer les index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_streams_movie_id ON public.streams(movie_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_logs_stream_id ON public.stream_logs(stream_id);
CREATE INDEX IF NOT EXISTS idx_content_requests_status ON public.content_requests(status);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
-- Pour terminer, tu dois :
-- 1. Aller dans ta table "profiles" sur Supabase
-- 2. Trouver ton propre compte
-- 3. Mettre "is_admin = true" pour toi
