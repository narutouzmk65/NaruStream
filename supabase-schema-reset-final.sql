-- Script final pour réinitialiser et configurer la base de données NaruStream
-- Ce script supprime TOUT et recrée exactement ce dont le site a besoin

-- Étape 1 : Suppression complète (triggers, fonctions, politiques, tables)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

-- Suppression des politiques RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete their own user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow public read access to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public insert to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public update to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public delete to movies" ON public.movies;
DROP POLICY IF EXISTS "Allow public read access to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public insert to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public update to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public delete to streams" ON public.streams;
DROP POLICY IF EXISTS "Allow public read access to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public insert to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public update to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public delete to content_requests" ON public.content_requests;
DROP POLICY IF EXISTS "Allow public read access to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public insert to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public update to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public delete to sagas" ON public.sagas;
DROP POLICY IF EXISTS "Allow public read access to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public insert to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public update to saga_movies" ON public.saga_movies;
DROP POLICY IF EXISTS "Allow public delete to saga_movies" ON public.saga_movies;

-- Suppression des tables (dans l'ordre pour les clés étrangères)
DROP TABLE IF EXISTS public.saga_movies CASCADE;
DROP TABLE IF EXISTS public.sagas CASCADE;
DROP TABLE IF EXISTS public.content_requests CASCADE;
DROP TABLE IF EXISTS public.streams CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.movies CASCADE;

-- Étape 2 : Recréation de toutes les tables (exactement comme le site le demande)
CREATE TABLE public.movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  poster_url text,
  backdrop_url text,
  trailer_url text,
  release_year text,
  category text,
  content_type text DEFAULT 'film',
  current_link_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.streams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  player_url text NOT NULL,
  m3u8_url text,
  server_name text,
  quality text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE,
  max_profiles integer DEFAULT 5,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  avatar_id integer DEFAULT 0,
  avatar_url text,
  pin text,
  is_kid boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.content_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'film',
  description text,
  requested_by text,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sagas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  poster_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.saga_movies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  saga_id uuid REFERENCES public.sagas(id) ON DELETE CASCADE,
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE,
  order_number integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(saga_id, movie_id)
);

-- Étape 3 : Fonction et trigger pour créer automatiquement le profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Étape 4 : Activation de RLS et création des politiques
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_movies ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Politiques pour user_profiles
CREATE POLICY "Users can view their own user profiles" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user profiles" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user profiles" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user profiles" ON public.user_profiles FOR DELETE USING (auth.uid() = user_id);

-- Politiques pour movies
CREATE POLICY "Allow public read access to movies" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert to movies" ON public.movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to movies" ON public.movies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to movies" ON public.movies FOR DELETE USING (true);

-- Politiques pour streams
CREATE POLICY "Allow public read access to streams" ON public.streams FOR SELECT USING (true);
CREATE POLICY "Allow public insert to streams" ON public.streams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to streams" ON public.streams FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to streams" ON public.streams FOR DELETE USING (true);

-- Politiques pour content_requests
CREATE POLICY "Allow public read access to content_requests" ON public.content_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert to content_requests" ON public.content_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to content_requests" ON public.content_requests FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to content_requests" ON public.content_requests FOR DELETE USING (true);

-- Politiques pour sagas
CREATE POLICY "Allow public read access to sagas" ON public.sagas FOR SELECT USING (true);
CREATE POLICY "Allow public insert to sagas" ON public.sagas FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to sagas" ON public.sagas FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to sagas" ON public.sagas FOR DELETE USING (true);

-- Politiques pour saga_movies
CREATE POLICY "Allow public read access to saga_movies" ON public.saga_movies FOR SELECT USING (true);
CREATE POLICY "Allow public insert to saga_movies" ON public.saga_movies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to saga_movies" ON public.saga_movies FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to saga_movies" ON public.saga_movies FOR DELETE USING (true);
