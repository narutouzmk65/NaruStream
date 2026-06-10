-- Fonction intelligente et sécurisée pour la délégation des droits
CREATE OR REPLACE FUNCTION public.set_admin_role(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Vérifier que l'utilisateur qui appelle la fonction a bien le rôle 'admin'
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    -- Mettre à jour le profil cible
    UPDATE public.profiles SET role = 'admin' WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Accès refusé. Vous n''êtes pas un administrateur.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour retirer les droits d'un admin
CREATE OR REPLACE FUNCTION public.remove_admin_role(target_user_id uuid)
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
    UPDATE public.profiles SET role = 'user' WHERE id = target_user_id;
  ELSE
    RAISE EXCEPTION 'Accès refusé.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
