
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

-- Créer la fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour appeler la fonction à chaque mise à jour
CREATE OR REPLACE TRIGGER update_banners_updated_at
    BEFORE UPDATE ON public.banners
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Activer RLS (optionnel, mais sécurisé)
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- Permettre à tout le monde de lire les bannières actives
CREATE POLICY IF NOT EXISTS "Allow public read access to active banners"
    ON public.banners
    FOR SELECT
    USING (is_active = true);

-- Permettre aux admins de gérer les bannières (via le dashboard)
CREATE POLICY IF NOT EXISTS "Allow admin all access to banners"
    ON public.banners
    FOR ALL
    USING (true);
