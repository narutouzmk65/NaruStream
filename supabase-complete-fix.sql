
-- 🔥 SUPABASE COMPLETE FIX - TOUTES LES POLITIQUES RLS + ADMIN BY USERNAME
-- Exécute ceci DANS TON SUPABASE SQL EDITOR !

-- 1. ACTIVER RLS SUR TOUTES LES TABLES
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

-- 2. SUPPRIMER LES ANCIENNES POLITIQUES (SÉCURITÉ)
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

-- 3. CRÉER LES POLITIQUES RLS
-- --- MOVIES
CREATE POLICY "Allow public read access to movies" ON movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage movies" ON movies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- STREAMS
CREATE POLICY "Allow public read access to streams" ON streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage streams" ON streams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- SEASONS
CREATE POLICY "Allow public read access to seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Admins can manage seasons" ON seasons FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- EPISODES
CREATE POLICY "Allow public read access to episodes" ON episodes FOR SELECT USING (true);
CREATE POLICY "Admins can manage episodes" ON episodes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- EPISODE_STREAMS
CREATE POLICY "Allow public read access to episode_streams" ON episode_streams FOR SELECT USING (true);
CREATE POLICY "Admins can manage episode_streams" ON episode_streams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- PROFILES
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- USER_PROFILES
CREATE POLICY "Users can view their own user profiles" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own user profiles" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own user profiles" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own user profiles" ON user_profiles FOR DELETE USING (auth.uid() = user_id);

-- --- CONTENT_REQUESTS
CREATE POLICY "Allow public read access to content_requests" ON content_requests FOR SELECT USING (true);
CREATE POLICY "Allow public insert to content_requests" ON content_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage content_requests" ON content_requests FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- SAGAS & SAGA_MOVIES
CREATE POLICY "Allow public read access to sagas" ON sagas FOR SELECT USING (true);
CREATE POLICY "Admins can manage sagas" ON sagas FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Allow public read access to saga_movies" ON saga_movies FOR SELECT USING (true);
CREATE POLICY "Admins can manage saga_movies" ON saga_movies FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- WATCH_HISTORY
CREATE POLICY "Users can view their own watch history" ON watch_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own watch history" ON watch_history FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all watch history" ON watch_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- STREAM_LOGS
CREATE POLICY "Allow public insert to stream_logs" ON stream_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all stream logs" ON stream_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- USER_LISTS
CREATE POLICY "Users can view their own list" ON user_lists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own list" ON user_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all lists" ON user_lists FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- NOTIFICATIONS
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- CONTACT_MESSAGES
CREATE POLICY "Allow public insert to contact_messages" ON contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage contact messages" ON contact_messages FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- DOWNLOADS
CREATE POLICY "Allow public insert to downloads" ON downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all downloads" ON downloads FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- --- SITE_CONFIG
CREATE POLICY "Allow public read access to site_config" ON site_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage site config" ON site_config FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 4. METTRE TON USERNAME EN ADMIN !
-- REMPLACE 'TON_USERNAME' PAR TON PSEUDO SUR NARUSTREAM !
UPDATE profiles 
SET is_admin = true 
WHERE username = 'TON_USERNAME';

-- 5. VÉRIFIER
SELECT * FROM profiles;
SELECT * FROM movies ORDER BY created_at DESC;

-- 6. TERMINÉ ! 😊
