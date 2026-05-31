
-- 🔥 ACTIVE LA LECTURE DES FILMS SUR SUPABASE (TOUT LE MONDE PEUT LIRE)
-- Exécute ceci dans ton SQL Editor Supabase

-- Désactive RLS temporairement pour tester (ça veut dire TOUT LE MONDE a accès)
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;

-- Si tu préfères garder RLS activé, remplace la ligne ci-dessus par :
-- ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public read access to movies" ON movies;
-- CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);

-- Vérifie tes films
SELECT * FROM movies ORDER BY created_at DESC;
