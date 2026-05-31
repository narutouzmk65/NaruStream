-- Mise à jour complète de la base de données et données d'exemple
-- À exécuter DANS L'ORDRE dans l'éditeur SQL de Supabase !
-- 1. D'abord exécutez supabase_migration_complete.sql
-- 2. Puis exécutez add-status-columns.sql
-- 3. Enfin, exécutez ce fichier !

-- 1. Ajouter les colonnes manquantes à la table movies (SAFE)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'age_rating') THEN
    ALTER TABLE movies ADD COLUMN age_rating TEXT DEFAULT 'Tous publics';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'platform') THEN
    ALTER TABLE movies ADD COLUMN platform TEXT DEFAULT 'NaruStream';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'movies' AND column_name = 'status') THEN
    ALTER TABLE movies ADD COLUMN status TEXT DEFAULT 'sortie';
  END IF;
END $$;

-- 2. Ajouter les colonnes manquantes à la table episodes (SAFE)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'episodes' AND column_name = 'status') THEN
    ALTER TABLE episodes ADD COLUMN status TEXT DEFAULT 'sortie';
  END IF;
END $$;

-- 3. Insérer des films d'exemple (sortis) - SEULEMENT SI ILS N'EXISTENT PAS
INSERT INTO movies (title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
SELECT * FROM (VALUES
  ('Le Voyage de Chihiro', 'Une jeune fille traverse un monde magique et fantastique peuplé de dieux et de monstres.', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/ByXuk9QqQkk', '2001', 'Animation, Aventure, Fantaisie', 'film', 'Tous publics', 'Netflix', 'sortie', NOW() - INTERVAL '5 days'),
  ('Inception', 'Un voleur qui vole les secrets des rêves reçoit la tâche inverse : implanter une idée dans l’esprit d’un dirigeant.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/YoHD9XEInc0', '2010', 'Action, ScienceFiction, Thriller', 'film', '12+', 'Netflix', 'sortie', NOW() - INTERVAL '3 days'),
  ('La La Land', 'Un pianiste de jazz et une actrice en herbe tombent amoureux à Los Angeles, mais leurs ambitions menacent de les séparer.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/0pdqf4P9MB8', '2016', 'Comédie, Drame, Romance, Musical', 'film', 'Tous publics', 'Prime Video', 'sortie', NOW() - INTERVAL '1 day'),
  ('Le Parrain', 'L’histoire de la famille Corleone et de la transformation de Michael Corleone en un impitoyable chef du crime.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/sY1S3497zqA', '1972', 'Drame, Historique, Thriller', 'film', '16+', 'Prime Video', 'sortie', NOW() - INTERVAL '10 days'),
  ('Monstre & Cie', 'Dans la ville de Monstropolis, les monstres s’alimentent des cris des enfants, mais tout change quand une petite fille pénètre dans leur monde.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/6tCxnHCqqxg', '2001', 'Animation, Comédie, Famille, Fantaisie', 'film', 'Tous publics', 'Disney+', 'sortie', NOW() - INTERVAL '2 days')
) AS v(title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE movies.title = v.title
);

-- 4. Insérer des films à venir - SEULEMENT SI ILS N'EXISTENT PAS
INSERT INTO movies (title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
SELECT * FROM (VALUES
  ('Avatar 3', 'La saga épique continue avec de nouvelles découvertes et des batailles à couper le souffle sur la planète Pandora.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/d9Myc11U6x0', '2025', 'Action, Aventure, ScienceFiction, Fantaisie', 'film', '12+', 'Disney+', 'à venir', NOW()),
  ('Deadpool & Wolverine', 'Le mercenaire fou et le mutant à griffes s’allient pour une aventure explosive et décalée.', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/73_1biulkYk', '2024', 'Action, Comédie, ScienceFiction', 'film', '16+', 'Disney+', 'à venir', NOW() - INTERVAL '2 hours'),
  ('Dune : Partie Deux', 'Paul Atreides s’allie aux Fremen et à Chani pour se venger des conspirateurs qui ont détruit sa famille.', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/Way9Dexny3w', '2024', 'Action, Aventure, Drame, ScienceFiction', 'film', '12+', 'Max', 'à venir', NOW() - INTERVAL '5 hours')
) AS v(title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE movies.title = v.title
);

-- 5. Insérer une série d'exemple (saison 1, 3 épisodes) - SEULEMENT SI ELLE N'EXISTE PAS
INSERT INTO movies (title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
SELECT * FROM (VALUES
  ('Stranger Things', 'Un groupe d’amis découvre des expériences secrètes du gouvernement, une jeune fille avec des pouvoirs et un monstre menaçant.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/b9EkMc79ZSU', '2016', 'ScienceFiction, Horreur, Aventure, Drame', 'serie', '12+', 'Netflix', 'sortie', NOW() - INTERVAL '1 week')
) AS v(title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE movies.title = v.title
);

-- 6. Ajouter la saison et les épisodes pour Stranger Things (si pas déjà présents)
DO $$
DECLARE
  serie_id uuid;
  saison_id uuid;
BEGIN
  -- Récupérer l'ID de la série
  SELECT id INTO serie_id FROM movies WHERE title = 'Stranger Things';
  
  -- Vérifier si la série existe et si la saison n'existe pas déjà
  IF serie_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM seasons WHERE movie_id = serie_id AND season_number = 1) THEN
    -- Insérer la saison 1
    INSERT INTO seasons (season_number, movie_id, created_at)
    VALUES (1, serie_id, NOW())
    RETURNING id INTO saison_id;
    
    -- Insérer 3 épisodes
    INSERT INTO episodes (title, description, duration, season_number, episode_number, season_id, movie_id, status, created_at)
    SELECT * FROM (VALUES
      ('La Disparition de Will Byers', 'Will disparaît soudainement, et ses amis rencontrent une fille mystérieuse.', 50, 1, 1, saison_id, serie_id, 'sortie', NOW() - INTERVAL '8 days'),
      ('La Chasse à la Chose', 'Les enfants recherchent Will, tandis que Hopper découvre des anomalies inquiétantes.', 55, 1, 2, saison_id, serie_id, 'sortie', NOW() - INTERVAL '7 days'),
      ('Le Monde à l’Envers', 'Les vérités sur le Monde à l’Envers commencent à être révélées.', 58, 1, 3, saison_id, serie_id, 'sortie', NOW() - INTERVAL '6 days')
    ) AS v(title, description, duration, season_number, episode_number, season_id, movie_id, status, created_at)
    WHERE NOT EXISTS (
      SELECT 1 FROM episodes WHERE episodes.movie_id = v.movie_id AND episodes.season_number = v.season_number AND episodes.episode_number = v.episode_number
    );
  END IF;
END $$;

-- Terminé ! Maintenant tu as des films sortis, à venir et une série !

