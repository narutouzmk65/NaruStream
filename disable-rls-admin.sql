-- Désactiver RLS sur toutes les tables modifiées par l'admin
-- Car l'admin utilise maintenant un login local (hash SHA-256), pas Supabase Auth

ALTER TABLE public.sagas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.saga_movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_requests DISABLE ROW LEVEL SECURITY;

-- Garder RLS sur les tables utilisateurs pour protéger leurs données privées
-- ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY; -- NE PAS TOUCHER
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY; -- NE PAS TOUCHER
