-- 🔧 CORRECTION : Fonction de migration de profils
-- Cette version REFUSE de lier un profil déjà lié à un autre utilisateur

CREATE OR REPLACE FUNCTION public.migrate_profile_to_user(
  profile_id_param UUID,
  user_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Vérifier si le profil existe
  SELECT user_id INTO existing_user_id
  FROM public.profiles
  WHERE id = profile_id_param;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile % not found', profile_id_param;
  END IF;
  
  -- ✅ NOUVELLE VÉRIFICATION : Refuser si déjà lié à un autre utilisateur
  IF existing_user_id IS NOT NULL AND existing_user_id != user_id_param THEN
    RAISE EXCEPTION 'Profile % is already linked to another user', profile_id_param;
  END IF;
  
  -- ✅ NOUVELLE VÉRIFICATION : Ignorer si déjà lié au bon utilisateur
  IF existing_user_id = user_id_param THEN
    RAISE NOTICE 'Profile % is already linked to this user', profile_id_param;
    RETURN TRUE;
  END IF;
  
  -- Lier le profil à l'utilisateur
  UPDATE public.profiles
  SET 
    user_id = user_id_param,
    is_migrated = true,
    migrated_at = NOW()
  WHERE id = profile_id_param;
  
  -- Lier tous les véhicules du profil
  -- (pas de changement ici)
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
