
-- Créer la table des bannières
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS (optionnel, mais sécurisé)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Permettre à tout le monde de lire les bannières actives
CREATE POLICY "Allow public read access to active banners"
    ON public.banners
    FOR SELECT
    USING (is_active = true);

-- Permettre aux admins de gérer les bannières (via le dashboard)
CREATE POLICY "Allow admin all access to banners"
    ON public.banners
    FOR ALL
    USING (true);
