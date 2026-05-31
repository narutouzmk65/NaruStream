-- Add status column to movies table
ALTER TABLE movies 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sortie';

-- Add status column to episodes table
ALTER TABLE episodes 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sortie';
