-- ============================================================
-- Politique RLS : Permettre aux admins de modifier les médias
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================================

-- Permet aux admins de mettre à jour les médias (stream_url, trailer_url, etc.)
CREATE POLICY "Admins peuvent modifier les médias" ON public.media
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permet aux admins d'insérer de nouveaux médias
CREATE POLICY "Admins peuvent insérer des médias" ON public.media
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Permet aux admins de supprimer des médias
CREATE POLICY "Admins peuvent supprimer des médias" ON public.media
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
