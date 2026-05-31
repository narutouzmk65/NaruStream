
-- 🔥 ACTIVE LA LECTURE DES FILMS SUR SUPABASE (TOUT LE MONDE PEUT LIRE)
-- Exécute ceci dans ton SQL Editor Supabase

-- Désactive RLS complètement pour que ça marche à 100% !
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- Vérifie tes films
SELECT * FROM movies ORDER BY created_at DESC;
