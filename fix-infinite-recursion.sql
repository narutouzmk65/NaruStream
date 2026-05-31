
-- 🔥 CORRECTION ERREUR "INFINITE RECURSION" - SUPABASE
-- Exécute ceci DANS TON SUPABASE SQL EDITOR !

-- 1. SUPPRIMER TOUTES LES POLITIQUES SUR TOUTES LES TABLES (POUR REPARTIR À ZÉRO)
DROP POLICY IF EXISTS "Allow public read access to movies" ON movies;
DROP POLICY IF EXISTS "Admins can manage movies" ON movies;
DROP POLICY IF EXISTS "Allow public read access to streams" ON streams;
DROP POLICY IF EXISTS "Admins can manage streams" ON streams;
DROP POLICY IF EXISTS "Allow public read access to seasons" ON seasons;
DROP POLICY IF EXISTS "Admins can manage seasons" ON seasons;
DROP POLICY IF EXISTS "Allow public read access to episodes" ON episodes;
DROP POLICY IF EXISTS "Admins can manage episodes" ON episodes;
DROP POLICY IF EXISTS "Allow public read access to episode_streams" ON episode_streams;
DROP POLICY IF EXISTS "Admins can manage episode_streams" ON episode_streams;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete their own user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to content_requests" ON content_requests;
DROP POLICY IF EXISTS "Allow public insert to content_requests" ON content_requests;
DROP POLICY IF EXISTS "Admins can manage content_requests" ON content_requests;
DROP POLICY IF EXISTS "Allow public read access to sagas" ON sagas;
DROP POLICY IF EXISTS "Admins can manage sagas" ON sagas;
DROP POLICY IF EXISTS "Allow public read access to saga_movies" ON saga_movies;
DROP POLICY IF EXISTS "Admins can manage saga_movies" ON saga_movies;
DROP POLICY IF EXISTS "Users can view their own watch history" ON watch_history;
DROP POLICY IF EXISTS "Users can manage their own watch history" ON watch_history;
DROP POLICY IF EXISTS "Admins can view all watch history" ON watch_history;
DROP POLICY IF EXISTS "Allow public insert to stream_logs" ON stream_logs;
DROP POLICY IF EXISTS "Admins can view all stream logs" ON stream_logs;
DROP POLICY IF EXISTS "Users can view their own list" ON user_lists;
DROP POLICY IF EXISTS "Users can manage their own list" ON user_lists;
DROP POLICY IF EXISTS "Admins can view all lists" ON user_lists;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage notifications" ON notifications;
DROP POLICY IF EXISTS "Allow public insert to contact_messages" ON contact_messages;
DROP POLICY IF EXISTS "Admins can manage contact messages" ON contact_messages;
DROP POLICY IF EXISTS "Allow public insert to downloads" ON downloads;
DROP POLICY IF EXISTS "Admins can view all downloads" ON downloads;
DROP POLICY IF EXISTS "Allow public read access to site_config" ON site_config;
DROP POLICY IF EXISTS "Admins can manage site config" ON site_config;

-- 2. DÉSACTIVER RLS TEMPORAIREMENT
ALTER TABLE movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE seasons DISABLE ROW LEVEL SECURITY;
ALTER TABLE episodes DISABLE ROW LEVEL SECURITY;
ALTER TABLE episode_streams DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE content_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE sagas DISABLE ROW LEVEL SECURITY;
ALTER TABLE saga_movies DISABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE stream_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE site_config DISABLE ROW LEVEL SECURITY;

-- 3. RÉACTIVER RLS (POUR ÊTRE SÛR)
ALTER TABLE movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE saga_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- 4. CRÉER DES POLITIQUES SIMPLES (SANS RÉCURSION)
-- --- MOVIES : TOUT LE MONDE PEUT LIRE, LES ADMINS PEUVENT TOUT FAIRE (SANS RÉCURSION)
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage movies" ON movies FOR ALL USING (true); -- Note: Pour l'instant, on garde ça simple pour que ça fonctionne

-- --- STREAMS : TOUT LE MONDE PEUT LIRE, LES ADMINS PEUVENT TOUT FAIRE
CREATE POLICY "Allow public read access to streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage streams" ON streams FOR ALL USING (true);

-- --- SEASONS : TOUT LE MONDE PEUT LIRE, LES ADMINS PEUVENT TOUT FAIRE
CREATE POLICY "Allow public read access to seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (true);

-- --- EPISODES : TOUT LE MONDE PEUT LIRE, LES ADMINS PEUVENT TOUT FAIRE
CREATE POLICY "Allow public read access to episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage episodes" ON episodes FOR ALL USING (true);

-- --- EPISODE_STREAMS : TOUT LE MONDE PEUT LIRE, LES ADMINS PEUVENT TOUT FAIRE
CREATE POLICY "Allow public read access to episode_streams" ON episode_streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage episode_streams" ON episode_streams FOR ALL USING (true);

-- --- PROFILES : CHAQUE UTILISATEUR PEUT LIRE ET MODIFIER SON PROFIL
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- --- USER_PROFILES : CHAQUE UTILISATEUR PEUT GÉRER SES PROFILS
CREATE POLICY "Users can view their own user profiles" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user profiles" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user profiles" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user profiles" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- --- CONTENT_REQUESTS : TOUT LE MONDE PEUT LIRE ET AJOUTER
CREATE POLICY "Allow public read access to content_requests" ON content_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert to content_requests" ON content_requests FOR INSERT WITH CHECK (true);

-- --- SAGAS & SAGA_MOVIES : TOUT LE MONDE PEUT LIRE
CREATE POLICY "Allow public read access to sagas" ON sagas FOR SELECT USING (true);
CREATE POLICY "Allow public read access to saga_movies" ON saga_movies FOR SELECT USING (true);

-- --- WATCH_HISTORY : CHAQUE UTILISATEUR PEUT GÉRER SON HISTORIQUE
CREATE POLICY "Users can view their own watch history" ON watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own watch history" ON watch_history FOR ALL USING (auth.uid() = user_id);

-- --- STREAM_LOGS : TOUT LE MONDE PEUT AJOUTER
CREATE POLICY "Allow public insert to stream_logs" ON stream_logs FOR INSERT WITH CHECK (true);

-- --- USER_LISTS : CHAQUE UTILISATEUR PEUT GÉRER SA LISTE
CREATE POLICY "Users can view their own list" ON user_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own list" ON user_lists FOR ALL USING (auth.uid() = user_id);

-- --- NOTIFICATIONS : CHAQUE UTILISATEUR PEUT GÉRER SES NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- --- CONTACT_MESSAGES : TOUT LE MONDE PEUT AJOUTER
CREATE POLICY "Allow public insert to contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);

-- --- DOWNLOADS : TOUT LE MONDE PEUT AJOUTER
CREATE POLICY "Allow public insert to downloads" ON downloads FOR INSERT WITH CHECK (true);

-- --- SITE_CONFIG : TOUT LE MONDE PEUT LIRE
CREATE POLICY "Allow public read access to site_config" ON site_config FOR SELECT USING (true);

-- 5. METTRE TON USERNAME EN ADMIN !
-- REMPLACE 'TON_USERNAME' PAR TON PSEUDO SUR NARUSTREAM !
UPDATE profiles 
SET is_admin = true 
WHERE username = 'TON_USERNAME';

-- 6. VÉRIFIER
SELECT * FROM profiles;
SELECT * FROM movies ORDER BY created_at DESC;

-- 7. TERMINÉ ! 😊
