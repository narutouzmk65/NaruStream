-- Nettoyage global de la base actuelle (comme c'est le début, on désintègre l'ancienne)
DROP TABLE IF EXISTS public.saga_entries cascade;
DROP TABLE IF EXISTS public.sagas cascade;
DROP TABLE IF EXISTS public.episodes cascade;
DROP TABLE IF EXISTS public.seasons cascade;
DROP TABLE IF EXISTS public.watch_history cascade;
DROP TABLE IF EXISTS public.watchlist cascade;
DROP TABLE IF EXISTS public.films cascade;
DROP TABLE IF EXISTS public.media cascade;
DROP TABLE IF EXISTS public.profiles cascade;
DROP FUNCTION IF EXISTS public.handle_new_user cascade;

-- 1. Utilisateurs
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  username text,
  avatar_url text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Media : Table mère unifiée remplaçant "films" (Gère les Films ET les Séries)
CREATE TABLE public.media (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  poster_url text,
  trailer_url text,
  stream_url text, -- Utilisé si c'est un Film, vide si c'est une Série
  media_type text not null check (media_type in ('movie', 'serie')),
  genre text,
  year integer,
  language text,
  rating numeric,
  views integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  added_by uuid references auth.users
);

-- 3. Séries : Saisons
CREATE TABLE public.seasons (
  id uuid default gen_random_uuid() primary key,
  media_id uuid references public.media on delete cascade not null,
  season_number integer not null,
  unique (media_id, season_number)
);

-- 4. Séries : Épisodes
CREATE TABLE public.episodes (
  id uuid default gen_random_uuid() primary key,
  season_id uuid references public.seasons on delete cascade not null,
  episode_number integer not null,
  title text,
  description text,
  stream_url text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (season_id, episode_number)
);

-- 5. Sagas : L'Univers étendu
CREATE TABLE public.sagas (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  poster_url text
);

-- 6. Sagas : La Chronologie (Lie une Saga à un "Media" qu'il soit série ou film)
CREATE TABLE public.saga_entries (
  id uuid default gen_random_uuid() primary key,
  saga_id uuid references public.sagas on delete cascade not null,
  media_id uuid references public.media on delete cascade not null,
  view_order integer not null, -- Numéro chronologique dans la Saga
  unique(saga_id, view_order)
);

-- 7. Watchlist (Mise à jour pour cibler 'media')
CREATE TABLE public.watchlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  media_id uuid references public.media not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Watch History (Mise à jour)
CREATE TABLE public.watch_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  media_id uuid references public.media,
  episode_id uuid references public.episodes, -- Rempli si c'est le visionnage d'un épisode précis
  watched_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- -- Gestion de la Sécurité (RLS simplifiée) -- --
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lecture pour tous (Media)" ON public.media FOR SELECT USING (true);
CREATE POLICY "Lecture pour tous (Seasons)" ON public.seasons FOR SELECT USING (true);
CREATE POLICY "Lecture pour tous (Episodes)" ON public.episodes FOR SELECT USING (true);
CREATE POLICY "Lecture pour tous (Sagas)" ON public.sagas FOR SELECT USING (true);
CREATE POLICY "Lecture pour tous (Saga_entries)" ON public.saga_entries FOR SELECT USING (true);

-- Trigger pour création Auto Profil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role)
  VALUES (new.id, new.email, 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
