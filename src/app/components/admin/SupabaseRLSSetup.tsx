import React, { useState } from 'react';
import { Database, Copy, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Zap } from 'lucide-react';

const SUPABASE_SQL_EDITOR_URL = 'https://supabase.com/dashboard/project/uffmwykdfrxwnslhrftw/sql/new';

// ──────────────────────────────────────────────
// SQL complet pour configurer TOUTES les RLS policies
// ──────────────────────────────────────────────
const FULL_RLS_SQL = `-- ============================================================
-- VALCAR - CORRECTION PROFILS ORPHELINS + RLS POLICIES COMPLÈTES
-- Copiez et exécutez ce script dans Supabase SQL Editor
-- ============================================================

-- ── ÉTAPE 1 : Corriger les profils sans user_id ──────────────
-- Associe chaque profil orphelin au premier utilisateur auth
UPDATE public.profiles
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Vérification
SELECT id, name, user_id FROM public.profiles;

-- ── ÉTAPE 1b : Ajouter les colonnes fuel_type et is_4x4 ─────
-- (si elles n'existent pas encore)
ALTER TABLE public.maintenance_profiles
  ADD COLUMN IF NOT EXISTS fuel_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_4x4 BOOLEAN DEFAULT FALSE;

-- ── ÉTAPE 2 : Supprimer TOUTES les anciennes policies ────────
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','vehicles','maintenance_entries',
        'tasks','reminders','maintenance_templates',
        'maintenance_profiles','app_config'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- ── ÉTAPE 3 : Activer RLS sur toutes les tables ─────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- ── ÉTAPE 4 : PROFILES ──────────────────────────────────────
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── ÉTAPE 5 : VEHICLES ──────────────────────────────────────
CREATE POLICY "vehicles_select_own"
  ON public.vehicles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_insert_own"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_update_own"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_delete_own"
  ON public.vehicles FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

-- ── ÉTAPE 6 : MAINTENANCE_ENTRIES ────────────────────────────
CREATE POLICY "maint_entries_select_own"
  ON public.maintenance_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_insert_own"
  ON public.maintenance_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_update_own"
  ON public.maintenance_entries FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_delete_own"
  ON public.maintenance_entries FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

-- ── ÉTAPE 7 : TASKS ─────────────────────────────────────────
CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

-- ── ÉTAPE 8 : REMINDERS ─────────────────────────────────────
CREATE POLICY "reminders_select_own"
  ON public.reminders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_insert_own"
  ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_update_own"
  ON public.reminders FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_delete_own"
  ON public.reminders FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = auth.uid() OR p.user_id IS NULL)
  ));

-- ── ÉTAPE 9 : MAINTENANCE_TEMPLATES ─────────────────────────
CREATE POLICY "maint_templates_select_own"
  ON public.maintenance_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_insert_own"
  ON public.maintenance_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_update_own"
  ON public.maintenance_templates FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_delete_own"
  ON public.maintenance_templates FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

-- ── ÉTAPE 10 : MAINTENANCE_PROFILES ─────────────────────────
CREATE POLICY "maint_profiles_select_own"
  ON public.maintenance_profiles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_profiles_insert_own"
  ON public.maintenance_profiles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_profiles_update_own"
  ON public.maintenance_profiles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_profiles_delete_own"
  ON public.maintenance_profiles FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = auth.uid() OR profiles.user_id IS NULL)
  ));

-- ── ÉTAPE 11 : APP_CONFIG ────────────────────────────────────
CREATE POLICY "app_config_select_own"
  ON public.app_config FOR SELECT TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "app_config_insert_own"
  ON public.app_config FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid()::text);

CREATE POLICY "app_config_update_own"
  ON public.app_config FOR UPDATE TO authenticated
  USING (id = auth.uid()::text);

CREATE POLICY "app_config_upsert_own"
  ON public.app_config FOR ALL TO authenticated
  USING (id = auth.uid()::text)
  WITH CHECK (id = auth.uid()::text);

-- ── FIN ──────────────────────────────────────────────────────
-- Profils orphelins corrigés + RLS policies configurées !
`;

interface SqlBlockProps {
  title: string;
  description: string;
  sql: string;
  tables?: string[];
}

function SqlBlock({ title, description, sql, tables }: SqlBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#12121a] border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{title}</p>
            <p className="text-white/40 text-xs mt-0.5">{description}</p>
            {tables && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tables.map(t => (
                  <span key={t} className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded px-1.5 py-0.5 font-mono">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-lg text-xs text-white/60 transition-colors"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? 'Masquer' : 'Voir SQL'}
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20'
              }`}
            >
              {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-white/[0.06] bg-black/40 p-3 overflow-x-auto">
          <pre className="text-[11px] text-emerald-300/80 font-mono whitespace-pre leading-relaxed">{sql}</pre>
        </div>
      )}
    </div>
  );
}

export function SupabaseRLSSetup() {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(FULL_RLS_SQL);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 3000);
  };

  const tables = [
    { name: 'profiles', status: 'user_id = auth.uid()' },
    { name: 'vehicles', status: 'via profiles.user_id' },
    { name: 'maintenance_entries', status: 'via vehicles → profiles' },
    { name: 'tasks', status: 'via vehicles → profiles' },
    { name: 'reminders', status: 'via vehicles → profiles' },
    { name: 'maintenance_templates', status: 'via profiles.user_id' },
    { name: 'maintenance_profiles', status: 'via profiles.user_id' },
    { name: 'app_config', status: 'id = auth.uid()' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-amber-300 font-semibold text-sm">RLS Policies à configurer</p>
            <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
              Les Row Level Security policies Supabase n'ont pas encore été configurées. Sans elles,
              certaines opérations (création de profils d'entretien, etc.) sont bloquées.
              Exécutez le script SQL ci-dessous dans votre SQL Editor Supabase.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton principal */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleCopyAll}
          className={`flex items-center justify-center gap-2 flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            allCopied
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 text-white border border-cyan-500/20'
          }`}
        >
          {allCopied
            ? <><CheckCircle className="w-4 h-4" /> Script copié ! Collez dans Supabase</>
            : <><Copy className="w-4 h-4" /> Copier tout le script SQL (recommandé)</>
          }
        </button>
        <a
          href={SUPABASE_SQL_EDITOR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-xl text-sm text-white/70 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ouvrir SQL Editor
        </a>
      </div>

      {/* Instructions */}
      <div className="bg-[#12121a] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-cyan-400" />
          <p className="text-white text-sm font-medium">Comment appliquer ?</p>
        </div>
        <ol className="space-y-2">
          {[
            'Copiez le script SQL complet (bouton ci-dessus)',
            'Ouvrez Supabase SQL Editor via le lien "Ouvrir SQL Editor"',
            'Collez le script dans l\'éditeur et cliquez sur "Run"',
            'Vérifiez que toutes les requêtes passent sans erreur',
            'Revenez dans l\'app et réessayez l\'opération',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-xs text-white/60">
              <span className="w-5 h-5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Aperçu des tables */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-violet-400" />
          <p className="text-white/70 text-sm font-medium">Tables concernées ({tables.length})</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tables.map(table => (
            <div
              key={table.name}
              className="flex items-center justify-between bg-[#12121a] border border-white/[0.06] rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                <span className="text-white/80 text-xs font-mono">{table.name}</span>
              </div>
              <span className="text-white/30 text-[10px]">{table.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL complet (collapsible) */}
      <SqlBlock
        title="Script SQL complet"
        description="Toutes les policies en un seul bloc — recommandé pour une installation propre"
        sql={FULL_RLS_SQL}
        tables={['profiles', 'vehicles', 'maintenance_entries', 'tasks', 'reminders', 'maintenance_templates', 'maintenance_profiles', 'app_config']}
      />

      {/* Fix FK profile_id */}
      <SqlBlock
        title="FIX: Foreign Key profile_id (maintenance_templates)"
        description="Corrige l'erreur 23503 — rend profile_id nullable et recrée la FK correctement"
        sql={`-- ══════════════════════════════════════════════════════════════
-- FIX: maintenance_templates.profile_id FK constraint
-- Erreur: 23503 foreign key constraint "maintenance_templates_profile_id_fkey"
-- ══════════════════════════════════════════════════════════════

-- 1. Supprimer l'ancienne FK constraint si elle existe
ALTER TABLE public.maintenance_templates
  DROP CONSTRAINT IF EXISTS maintenance_templates_profile_id_fkey;

-- 2. S'assurer que la colonne profile_id existe et est NULLABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'maintenance_templates'
      AND column_name = 'profile_id'
  ) THEN
    ALTER TABLE public.maintenance_templates ADD COLUMN profile_id TEXT DEFAULT NULL;
  ELSE
    ALTER TABLE public.maintenance_templates ALTER COLUMN profile_id DROP NOT NULL;
    ALTER TABLE public.maintenance_templates ALTER COLUMN profile_id SET DEFAULT NULL;
  END IF;
END $$;

-- 3. Recréer la FK avec ON DELETE CASCADE (nullable)
ALTER TABLE public.maintenance_templates
  ADD CONSTRAINT maintenance_templates_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.maintenance_profiles(id)
  ON DELETE CASCADE;

-- 4. Vérification
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_templates' AND column_name = 'profile_id';
`}
        tables={['maintenance_templates']}
      />

      {/* Migration fuel_type / is_4x4 */}
      <SqlBlock
        title="Migration: fuel_type & is_4x4 (maintenance_profiles)"
        description="Ajoute les colonnes fuel_type et is_4x4 à maintenance_profiles si manquantes"
        sql={`-- ══════════════════════════════════════════════════════════════
-- MIGRATION: Ajout fuel_type et is_4x4 à maintenance_profiles
-- ══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'maintenance_profiles'
      AND column_name = 'fuel_type'
  ) THEN
    ALTER TABLE public.maintenance_profiles ADD COLUMN fuel_type TEXT DEFAULT 'essence';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'maintenance_profiles'
      AND column_name = 'is_4x4'
  ) THEN
    ALTER TABLE public.maintenance_profiles ADD COLUMN is_4x4 BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Vérification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_profiles'
  AND column_name IN ('fuel_type', 'is_4x4')
ORDER BY column_name;
`}
        tables={['maintenance_profiles']}
      />

      {/* Note sur le fix de maintenance_profiles */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300/80 leading-relaxed">
        <p className="font-semibold text-blue-300 mb-1">💡 Pourquoi cette erreur ?</p>
        <p>
          La table <code className="bg-blue-500/20 px-1 rounded font-mono">maintenance_profiles</code> utilise un <code className="bg-blue-500/20 px-1 rounded font-mono">owner_id</code> qui
          référence un profil (pas directement l'auth user). La policy RLS doit donc vérifier la chaîne :
          <code className="bg-blue-500/20 px-1 rounded font-mono ml-1">maintenance_profiles.owner_id → profiles.id → profiles.user_id = auth.uid()</code>.
          Le script ci-dessus configure exactement ce comportement pour toutes les tables.
        </p>
      </div>

      {/* Note sur le fix FK */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300/80 leading-relaxed">
        <p className="font-semibold text-amber-300 mb-1">⚠️ Erreur 23503 (FK violation sur profile_id)</p>
        <p>
          Si vous voyez <code className="bg-amber-500/20 px-1 rounded font-mono">maintenance_templates_profile_id_fkey</code>, exécutez le script
          "FIX: Foreign Key profile_id" ci-dessus. Il rend <code className="bg-amber-500/20 px-1 rounded font-mono">profile_id</code> nullable
          (les templates globaux n'ont pas de profil d'entretien associé) et recrée la FK avec <code className="bg-amber-500/20 px-1 rounded font-mono">ON DELETE CASCADE</code>.
        </p>
      </div>
    </div>
  );
}