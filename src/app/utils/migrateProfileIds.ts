/**
 * 🔧 Script de migration pour ajouter les profile_id manquants
 * 
 * Ce script corrige les templates créés AVANT le fix du bug profile_id
 * en associant automatiquement les templates aux profils d'entretien correspondants
 */

import { supabase } from './supabase';

export async function migrateProfileIds() {
  try {
    console.log('🚀 Début de la migration des profile_id...');
    
    // 1. Récupérer tous les templates
    const { data: templates, error: templatesError } = await supabase
      .from('maintenance_templates')
      .select('*');
    
    if (templatesError) {
      console.error('❌ Erreur chargement templates:', templatesError);
      return;
    }
    
    // 2. Récupérer tous les profils d'entretien
    const { data: profiles, error: profilesError } = await supabase
      .from('maintenance_profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ Erreur chargement profils:', profilesError);
      return;
    }
    
    if (!templates || !profiles || profiles.length === 0) {
      console.log('ℹ️ Aucune migration nécessaire');
      return;
    }
    
    // 3. Identifier les templates sans profile_id
    const templatesWithoutProfileId = templates.filter(t => !t.profile_id);
    
    if (templatesWithoutProfileId.length === 0) {
      console.log('✅ Tous les templates ont déjà un profile_id');
      return;
    }
    
    console.log(`📊 ${templatesWithoutProfileId.length} templates à migrer`);
    
    // 4. Pour chaque profil, trouver ses templates correspondants
    let migratedCount = 0;
    
    for (const profile of profiles) {
      if (!profile.is_custom) {
        // Profils pré-remplis : pas de templates spécifiques
        continue;
      }
      
      // Pour chaque template sans profile_id, vérifier s'il appartient à ce profil
      // (basé sur le owner_id et la création récente)
      const templatesToUpdate = templatesWithoutProfileId.filter(
        t => t.owner_id === profile.owner_id
      );
      
      if (templatesToUpdate.length > 0) {
        console.log(`🔧 Association de ${templatesToUpdate.length} templates au profil "${profile.name}"`);
        
        for (const template of templatesToUpdate) {
          const { error: updateError } = await supabase
            .from('maintenance_templates')
            .update({ profile_id: profile.id })
            .eq('id', template.id);
          
          if (updateError) {
            console.error(`❌ Erreur mise à jour template ${template.name}:`, updateError);
          } else {
            migratedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Migration terminée : ${migratedCount} templates mis à jour`);
    
    return migratedCount;
  } catch (error) {
    console.error('❌ Erreur durant la migration:', error);
    throw error;
  }
}

/**
 * Vérifier si une migration est nécessaire
 */
export async function checkMigrationNeeded(): Promise<boolean> {
  try {
    const { data: templates } = await supabase
      .from('maintenance_templates')
      .select('id, profile_id')
      .is('profile_id', null);
    
    return (templates?.length || 0) > 0;
  } catch (error) {
    console.error('Erreur vérification migration:', error);
    return false;
  }
}
