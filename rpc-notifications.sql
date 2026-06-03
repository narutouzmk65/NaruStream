-- Fonction sécurisée pour envoyer des notifications à tous les utilisateurs
-- Cette fonction "SECURITY DEFINER" contourne les règles RLS (Row Level Security)
-- afin que l'admin puisse envoyer des notifications sans avoir accès en lecture à la table des profils.

CREATE OR REPLACE FUNCTION public.send_notification_to_all_users(p_title text, p_message text)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, is_read)
  SELECT id, p_title, p_message, false
  FROM public.profiles;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
