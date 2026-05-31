-- Fichier pour mettre à jour les films existants et ajouter des exemples pour TOUS les genres
-- Exécute ça dans l'éditeur SQL de Supabase !

-- 1. D'abord, on s'assure que toutes les colonnes sont présentes
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

-- 2. Ajoute des films pour TOUS les genres ! (si pas déjà présents)
INSERT INTO movies (title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
SELECT * FROM (VALUES
  -- Animation
  ('Le Roi Lion', 'Un lion prince doit reconquérir son trône après la mort tragique de son père.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/7TavVZMewss', '1994', 'Animation, Famille, Musical, Aventure', 'film', 'Tous publics', 'Disney+', 'sortie', NOW() - INTERVAL '15 days'),
  -- Action
  ('John Wick', 'Un ex-assassin à la retraite reprend du service pour venger son chien.', 'https://images.unsplash.com/photo-1534809027769-b00d750a6bac?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/2AUmvWm5ZDQ', '2014', 'Action, Thriller', 'film', '16+', 'Netflix', 'sortie', NOW() - INTERVAL '11 days'),
  -- Aventure
  ('Indiana Jones: Les Aventuriers de l\'Arche perdue', 'Un archéologue recherche une arche sacrée avant les nazis.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/XkkzKHCx1U4', '1981', 'Aventure, Action, Historique', 'film', '12+', 'Disney+', 'sortie', NOW() - INTERVAL '9 days'),
  -- Fantasy
  ('Harry Potter à l\'école des sorciers', 'Un jeune garçon découvre qu\'il est un sorcier et part pour Poudlard.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/VyHV0BRtdxo', '2001', 'Fantasy, Aventure, Famille', 'film', 'Tous publics', 'Max', 'sortie', NOW() - INTERVAL '14 days'),
  -- Horreur
  ('Get Out', 'Un jeune homme noir rencontre la famille de sa petite amie blanche et découvre un secret terrifiant.', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/sRfnevzM9m4', '2017', 'Horreur, Thriller', 'film', '16+', 'Netflix', 'sortie', NOW() - INTERVAL '12 days'),
  -- Romance
  ('Titanic', 'Une jeune femme de haute société et un pauvre artiste tombent amoureux sur le Titanic.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/ZQ6klONCq4s', '1997', 'Romance, Drame, Historique', 'film', '12+', 'Disney+', 'sortie', NOW() - INTERVAL '16 days'),
  -- Famille
  ('Les Indestructibles', 'Une famille de super-héros doit retrouver le goût de l\'action.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/eZqbKBYjquM', '2004', 'Famille, Animation, Action, Comédie', 'film', 'Tous publics', 'Disney+', 'sortie', NOW() - INTERVAL '13 days'),
  -- Historique
  ('Braveheart', 'William Wallace mène une rébellion contre l\'Angleterre pour l\'indépendance de l\'Écosse.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/1cnoM8EiGGU', '1995', 'Historique, Drame, Action', 'film', '16+', 'Prime Video', 'sortie', NOW() - INTERVAL '17 days'),
  -- Musical
  ('Moulin Rouge!', 'Un jeune poète tombe amoureux d'une courtisane au Moulin Rouge à Paris.', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/2nJBV8lH6O0', '2001', 'Musical, Romance, Drame', 'film', '12+', 'Disney+', 'sortie', NOW() - INTERVAL '18 days'),
  -- Comédie
  ('The Grand Budapest Hotel', 'Les aventures d\'un concierge d\'un grand hôtel et de son protégé.', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/1Fg5iZldrxI', '2014', 'Comédie, Aventure', 'film', '12+', 'Netflix', 'sortie', NOW() - INTERVAL '19 days'),
  -- Drame
  ('Forrest Gump', 'Un homme au QI faible vit une vie incroyable et traverse plusieurs époques.', 'https://images.unsplash.com/photo-1478720568477-152d9b164e63?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/bLvqoHBptjg', '1994', 'Drame, Romance', 'film', 'Tous publics', 'Prime Video', 'sortie', NOW() - INTERVAL '20 days'),
  -- Science-Fiction
  ('Blade Runner 2049', 'Un blade runner découvre un secret qui menace l\'avenir de l\'humanité.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/gCcx85zbxz4', '2017', 'Science-Fiction, Thriller, Drame', 'film', '12+', 'Netflix', 'sortie', NOW() - INTERVAL '21 days'),
  -- Films à venir (plus)
  ('Jurassic World: Rebirth', 'Les dinosaures reviennent dans une nouvelle aventure palpitante.', 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/RFinNxS5KN4', '2025', 'Aventure, Science-Fiction, Action', 'film', '12+', 'Universal+', 'à venir', NOW() - INTERVAL '1 hour'),
  ('Frozen 3', 'Anna et Elsa partent pour une nouvelle aventure magique.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop', 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200&h=600&fit=crop', 'https://www.youtube.com/embed/TbQm5doF_Uc', '2025', 'Animation, Famille, Musical, Aventure', 'film', 'Tous publics', 'Disney+', 'à venir', NOW() - INTERVAL '3 hours')
) AS v(title, description, poster_url, backdrop_url, trailer_url, release_year, category, content_type, age_rating, platform, status, created_at)
WHERE NOT EXISTS (
  SELECT 1 FROM movies WHERE movies.title = v.title
);

-- Terminé ! Tous les genres sont maintenant représentés !
