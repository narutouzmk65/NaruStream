
-- 1. Vérifier si RLS est activé sur la table movies
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'movies';

-- 2. Voir les politiques actuelles pour movies
SELECT * FROM pg_policies WHERE tablename = 'movies' AND schemaname = 'public';

-- 3. Si aucune politique n'existe, créer les politiques nécessaires :
-- Politique pour que TOUT LE MONDE puisse lire les films (important !)
DROP POLICY IF EXISTS "Allow public read access to movies" ON movies;
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);

-- Politique pour que les admins puissent modifier les films
DROP POLICY IF EXISTS "Admins can manage movies" ON movies;
CREATE POLICY "Admins can manage movies" ON movies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 4. S'assurer que RLS est activé
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
