
-- TEST : Ajout d'un film simple pour vérifier
INSERT INTO movies (title, description, poster_url, category, content_type)
VALUES (
  'Film Test',
  'Ceci est un film de test pour vérifier que le site fonctionne !',
  'https://images.unsplash.com/photo-1489599849980-8191a6c5131e?w=400&h=600&fit=crop',
  'Action',
  'film'
);

-- Vérifier que le film est bien ajouté
SELECT * FROM movies;
