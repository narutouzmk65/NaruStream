-- MIGRATION: Add Downloads Tracking Table
CREATE TABLE IF NOT EXISTS public.downloads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    platform text NOT NULL, -- "windows", "android", or "ios"
    user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    downloaded_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies for Downloads
DROP POLICY IF EXISTS "Allow public insert for downloads" ON public.downloads;
CREATE POLICY "Allow public insert for downloads" ON public.downloads FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view all downloads" ON public.downloads;
CREATE POLICY "Admins can view all downloads" ON public.downloads FOR SELECT USING (public.is_admin());

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_downloads_platform ON public.downloads(platform);
CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON public.downloads(user_id);
