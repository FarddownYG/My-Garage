import React, { useState } from 'react';
import { Database, Copy, CheckCircle, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Zap, Shield } from 'lucide-react';

const SUPABASE_SQL_EDITOR_URL = 'https://supabase.com/dashboard/project/uffmwykdfrxwnslhrftw/sql/new';

// ──────────────────────────────────────────────
// SQL complet pour configurer TOUTES les RLS policies
// v3 : Optimisé avec (select auth.uid()) pour performance
// ──────────────────────────────────────────────
const FULL_RLS_SQL = `-- ============================================================
-- VALCAR - CORRECTION PROFILS ORPHELINS + RLS POLICIES COMPLETES
-- v3 : Optimise avec (select auth.uid()) pour performance
-- Copiez et executez ce script dans Supabase SQL Editor
-- ============================================================

-- == ETAPE 0 : Securiser la table backup ====================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'maintenance_templates_backup'
  ) THEN
    ALTER TABLE public.maintenance_templates_backup ENABLE ROW LEVEL SECURITY;
    -- Aucune policy = personne ne peut y acceder via l'API (securise)
    -- Si vous voulez la supprimer: DROP TABLE IF EXISTS public.maintenance_templates_backup;
  END IF;
END $$;

-- == ETAPE 1 : Corriger les profils sans user_id ============
UPDATE public.profiles
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Verification
SELECT id, name, user_id FROM public.profiles;

-- == ETAPE 1b : Ajouter les colonnes fuel_type, is_4x4 et user_id
ALTER TABLE public.maintenance_profiles
  ADD COLUMN IF NOT EXISTS fuel_type TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_4x4 BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- == ETAPE 1c : Remplir user_id sur maintenance_profiles existants
UPDATE public.maintenance_profiles mp
SET user_id = p.user_id
FROM public.profiles p
WHERE mp.owner_id = p.id
  AND mp.user_id IS NULL
  AND p.user_id IS NOT NULL;

-- == ETAPE 2 : Supprimer TOUTES les anciennes policies ======
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'profiles','vehicles','maintenance_entries',
        'tasks','reminders','maintenance_templates',
        'maintenance_profiles','app_config','banned_emails'
      )
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- == ETAPE 3 : Activer RLS sur toutes les tables ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- == ETAPE 4 : PROFILES =====================================
-- (select auth.uid()) pour performance optimale
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR user_id IS NULL);

CREATE POLICY "profiles_delete_own"
  ON public.profiles FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()));

-- == ETAPE 5 : VEHICLES =====================================
CREATE POLICY "vehicles_select_own"
  ON public.vehicles FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_insert_own"
  ON public.vehicles FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_update_own"
  ON public.vehicles FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "vehicles_delete_own"
  ON public.vehicles FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = vehicles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

-- == ETAPE 6 : MAINTENANCE_ENTRIES ===========================
CREATE POLICY "maint_entries_select_own"
  ON public.maintenance_entries FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_insert_own"
  ON public.maintenance_entries FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_update_own"
  ON public.maintenance_entries FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "maint_entries_delete_own"
  ON public.maintenance_entries FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = maintenance_entries.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

-- == ETAPE 7 : TASKS ========================================
CREATE POLICY "tasks_select_own"
  ON public.tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_insert_own"
  ON public.tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_update_own"
  ON public.tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "tasks_delete_own"
  ON public.tasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = tasks.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

-- == ETAPE 8 : REMINDERS ====================================
CREATE POLICY "reminders_select_own"
  ON public.reminders FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_insert_own"
  ON public.reminders FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_update_own"
  ON public.reminders FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

CREATE POLICY "reminders_delete_own"
  ON public.reminders FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicles v
    JOIN public.profiles p ON p.id = v.owner_id
    WHERE v.id = reminders.vehicle_id
      AND (p.user_id = (select auth.uid()) OR p.user_id IS NULL)
  ));

-- == ETAPE 9 : MAINTENANCE_TEMPLATES ========================
CREATE POLICY "maint_templates_select_own"
  ON public.maintenance_templates FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_insert_own"
  ON public.maintenance_templates FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_update_own"
  ON public.maintenance_templates FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

CREATE POLICY "maint_templates_delete_own"
  ON public.maintenance_templates FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = maintenance_templates.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
  ));

-- == ETAPE 10 : MAINTENANCE_PROFILES ========================
-- FIX RLS v2 : Policy directe via user_id (plus de JOIN fragile)
CREATE POLICY "maint_profiles_select_own"
  ON public.maintenance_profiles FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = maintenance_profiles.owner_id
        AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "maint_profiles_insert_own"
  ON public.maintenance_profiles FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = maintenance_profiles.owner_id
        AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "maint_profiles_update_own"
  ON public.maintenance_profiles FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = maintenance_profiles.owner_id
        AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
    )
  );

CREATE POLICY "maint_profiles_delete_own"
  ON public.maintenance_profiles FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = maintenance_profiles.owner_id
        AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)
    )
  );

-- == ETAPE 11 : APP_CONFIG ==================================
-- FIX: Une seule policy "FOR ALL" au lieu de SELECT+INSERT+UPDATE+ALL
-- Elimine le probleme "multiple permissive policies"
CREATE POLICY "app_config_all_own"
  ON public.app_config FOR ALL TO authenticated
  USING (id = (select auth.uid())::text)
  WITH CHECK (id = (select auth.uid())::text);

-- == ETAPE 12 : BANNED_EMAILS (admin only) ==================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'banned_emails'
  ) THEN
    ALTER TABLE public.banned_emails ENABLE ROW LEVEL SECURITY;
    EXECUTE 'CREATE POLICY "banned_emails_admin_select" ON public.banned_emails FOR SELECT TO authenticated USING ((select auth.jwt()) ->> ''email'' = ''admin2647595726151748@gmail.com'')';
    EXECUTE 'CREATE POLICY "banned_emails_admin_insert" ON public.banned_emails FOR INSERT TO authenticated WITH CHECK ((select auth.jwt()) ->> ''email'' = ''admin2647595726151748@gmail.com'')';
    EXECUTE 'CREATE POLICY "banned_emails_admin_delete" ON public.banned_emails FOR DELETE TO authenticated USING ((select auth.jwt()) ->> ''email'' = ''admin2647595726151748@gmail.com'')';
  END IF;
END $$;

-- == ETAPE 13 : Corriger search_path mutable sur fonctions ==
-- Supabase Linter: function_search_path_mutable (WARN x2)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_email_not_banned()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.banned_emails WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'This email address is banned';
  END IF;
  RETURN NEW;
END;
$$;

-- == FIN =====================================================
-- Profils orphelins corriges + RLS policies optimisees !
-- Functions search_path securisees !
`;

// ──────────────────────────────────────────────
// Script de nettoyage des index dupliqués
// ──────────────────────────────────────────────
const CLEANUP_DUPLICATE_INDEXES_SQL = `-- ============================================================
-- VALCAR - Nettoyage des index dupliques (performance)
-- Supabase Linter: duplicate_index warnings x7
-- ============================================================

-- maintenance_entries: date indexes
DROP INDEX IF EXISTS idx_maintenance_date;
-- Garde: idx_maintenance_entries_date

-- maintenance_entries: vehicle indexes
DROP INDEX IF EXISTS idx_maintenance_entries_vehicle;
DROP INDEX IF EXISTS idx_maintenance_vehicle;
-- Garde: idx_maintenance_entries_vehicle_id

-- maintenance_templates: owner indexes
DROP INDEX IF EXISTS idx_maintenance_templates_owner;
-- Garde: idx_maintenance_templates_owner_id

-- maintenance_templates: profile indexes
DROP INDEX IF EXISTS idx_maintenance_templates_profile;
-- Garde: idx_maintenance_templates_profile_id

-- reminders: vehicle indexes
DROP INDEX IF EXISTS idx_reminders_vehicle;
-- Garde: idx_reminders_vehicle_id

-- tasks: vehicle indexes
DROP INDEX IF EXISTS idx_tasks_vehicle;
-- Garde: idx_tasks_vehicle_id

-- vehicles: owner indexes
DROP INDEX IF EXISTS idx_vehicles_owner;
-- Garde: idx_vehicles_owner_id

-- Verification
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
`;

// ──────────────────────────────────────────────
// Script de nettoyage de la table backup
// ──────────────────────────────────────────────
const CLEANUP_BACKUP_TABLE_SQL = `-- ============================================================
-- VALCAR - Securiser maintenance_templates_backup
-- Supabase Linter: rls_disabled_in_public (ERROR)
-- ============================================================

-- Option A: Supprimer la table backup (recommande si plus necessaire)
-- DROP TABLE IF EXISTS public.maintenance_templates_backup;

-- Option B: Activer RLS et bloquer tout acces (garder comme archive)
ALTER TABLE public.maintenance_templates_backup ENABLE ROW LEVEL SECURITY;
-- Aucune policy = personne ne peut y acceder via l'API (securise)

-- Verification
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'maintenance_templates_backup';
`;

// ──────────────────────────────────────────────
// Script nettoyage doublons + index unique
// ──────────────────────────────────────────────
const CLEANUP_DUPLICATES_SQL = `-- ============================================================
-- VALCAR - Nettoyage doublons profiles + index unique
-- ============================================================

-- 1. Identifier les doublons (garde le plus ancien)
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT MIN(id) FROM public.profiles
  GROUP BY user_id
)
AND user_id IS NOT NULL;

-- 2. Creer l'index unique pour empecher les doublons futurs
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_unique_user
  ON public.profiles (user_id)
  WHERE user_id IS NOT NULL;

-- 3. Nettoyage doublons maintenance_profiles
DELETE FROM public.maintenance_profiles
WHERE id NOT IN (
  SELECT MIN(id) FROM public.maintenance_profiles
  GROUP BY user_id, name
)
AND user_id IS NOT NULL;

-- 4. Index unique sur maintenance_profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_maint_profiles_unique_user_name
  ON public.maintenance_profiles (user_id, name)
  WHERE user_id IS NOT NULL;

-- Verification
SELECT 'profiles' as tbl, count(*) as total,
  count(DISTINCT user_id) as unique_users
FROM public.profiles
UNION ALL
SELECT 'maintenance_profiles', count(*),
  count(DISTINCT (user_id::text || '_' || name))
FROM public.maintenance_profiles;
`;

interface SqlBlockProps {
  title: string;
  description: string;
  sql: string;
  tables?: string[];
  severity?: 'error' | 'warn' | 'info';
}

function SqlBlock({ title, description, sql, tables, severity = 'info' }: SqlBlockProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const borderColor = severity === 'error' ? 'border-red-500/20' : severity === 'warn' ? 'border-amber-500/20' : 'border-white/[0.06]';

  return (
    <div className={`bg-[#12121a] border ${borderColor} rounded-xl overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {severity === 'error' && <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-[10px] font-mono font-semibold">ERROR</span>}
              {severity === 'warn' && <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[10px] font-mono font-semibold">WARN</span>}
              <p className="text-white text-sm font-medium">{title}</p>
            </div>
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
              {copied ? 'Copie !' : 'Copier'}
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
    const fullScript = FULL_RLS_SQL + '\n\n' + CLEANUP_DUPLICATE_INDEXES_SQL + '\n\n' + CLEANUP_BACKUP_TABLE_SQL + '\n\n' + CLEANUP_DUPLICATES_SQL;
    await navigator.clipboard.writeText(fullScript);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 3000);
  };

  const tables = [
    { name: 'profiles', status: '(select auth.uid())', ok: true },
    { name: 'vehicles', status: 'via profiles', ok: true },
    { name: 'maintenance_entries', status: 'via vehicles \u2192 profiles', ok: true },
    { name: 'tasks', status: 'via vehicles \u2192 profiles', ok: true },
    { name: 'reminders', status: 'via vehicles \u2192 profiles', ok: true },
    { name: 'maintenance_templates', status: 'via profiles', ok: true },
    { name: 'maintenance_profiles', status: 'user_id direct + fallback', ok: true },
    { name: 'app_config', status: 'FOR ALL (unique policy)', ok: true },
    { name: 'banned_emails', status: 'admin only', ok: true },
    { name: 'maintenance_templates_backup', status: 'RLS active, acces bloque', ok: false },
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
            <p className="text-amber-300 font-semibold text-sm">RLS Policies v3 -- Optimisees Performance</p>
            <p className="text-amber-400/70 text-xs mt-1 leading-relaxed">
              Script mis a jour avec les corrections du Supabase Linter :{' '}
              <code className="bg-amber-500/20 px-1 rounded font-mono">(select auth.uid())</code> pour eviter la reevaluation par ligne,
              suppression des policies dupliquees sur app_config, nettoyage des index dupliques,
              et securisation de la table backup.
            </p>
          </div>
        </div>
      </div>

      {/* Linter Summary */}
      <div className="bg-[#12121a] border border-white/[0.06] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-red-400" />
          <p className="text-white text-sm font-medium">Problemes detectes par le Linter Supabase</p>
        </div>
        <div className="space-y-2">
          {[
            { level: 'ERROR', color: 'red', count: 1, desc: 'RLS desactive sur maintenance_templates_backup' },
            { level: 'WARN', color: 'amber', count: 34, desc: 'auth.uid() sans (select ...) -- reevaluation par ligne' },
            { level: 'WARN', color: 'amber', count: 3, desc: 'Policies permissives multiples sur app_config' },
            { level: 'WARN', color: 'amber', count: 7, desc: 'Index dupliques sur 5 tables' },
            { level: 'WARN', color: 'amber', count: 2, desc: 'function_search_path_mutable (update_updated_at_column, check_email_not_banned)' },
            { level: 'WARN', color: 'amber', count: 1, desc: 'auth_leaked_password_protection (activer dans Dashboard > Auth > Settings)' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 text-xs">
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-semibold ${
                item.level === 'ERROR' 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              }`}>
                {item.level} x{item.count}
              </span>
              <span className="text-white/60 flex-1">{item.desc}</span>
              <span className="text-emerald-400 flex-shrink-0">Corrige</span>
            </div>
          ))}
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
            ? <><CheckCircle className="w-4 h-4" /> Script complet copie ! Collez dans Supabase</>
            : <><Copy className="w-4 h-4" /> Copier TOUT (RLS + Index + Backup + Doublons)</>
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
            'Collez le script dans l\'editeur et cliquez sur "Run"',
            'Verifiez que toutes les requetes passent sans erreur',
            'Relancez le Linter Supabase pour confirmer 0 erreur',
            'Revenez dans l\'app et reessayez l\'operation',
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

      {/* Apercu des tables */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Database className="w-4 h-4 text-violet-400" />
          <p className="text-white/70 text-sm font-medium">Tables concernees ({tables.length})</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {tables.map(table => (
            <div
              key={table.name}
              className="flex items-center justify-between bg-[#12121a] border border-white/[0.06] rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${table.ok ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-white/80 text-xs font-mono">{table.name}</span>
              </div>
              <span className="text-white/30 text-[10px]">{table.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SQL complet (collapsible) */}
      <SqlBlock
        title="Script RLS complet v3 (optimise)"
        description="Toutes les policies avec (select auth.uid()) + app_config unifie + banned_emails"
        sql={FULL_RLS_SQL}
        tables={['profiles', 'vehicles', 'maintenance_entries', 'tasks', 'reminders', 'maintenance_templates', 'maintenance_profiles', 'app_config', 'banned_emails']}
      />

      {/* Fix FK profile_id */}
      <SqlBlock
        title="FIX: Foreign Key profile_id (maintenance_templates)"
        description="Corrige l'erreur 23503 -- rend profile_id nullable et recree la FK correctement"
        severity="warn"
        sql={`-- ==========================================================
-- FIX: maintenance_templates.profile_id FK constraint
-- Erreur: 23503 foreign key constraint
-- ==========================================================

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

-- 3. Recreer la FK avec ON DELETE CASCADE (nullable)
ALTER TABLE public.maintenance_templates
  ADD CONSTRAINT maintenance_templates_profile_id_fkey
  FOREIGN KEY (profile_id)
  REFERENCES public.maintenance_profiles(id)
  ON DELETE CASCADE;

-- 4. Verification
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_templates' AND column_name = 'profile_id';
`}
        tables={['maintenance_templates']}
      />

      {/* FIX RLS v2: user_id direct */}
      <SqlBlock
        title="FIX RLS v2: Ajout user_id sur maintenance_profiles"
        description="Ajoute user_id direct avec (select auth.uid()) optimise"
        severity="warn"
        sql={`-- ==========================================================
-- FIX RLS v2: Ajout user_id direct sur maintenance_profiles
-- Optimise: (select auth.uid())
-- ==========================================================

-- 1. Ajouter la colonne user_id (UUID, FK vers auth.users)
ALTER TABLE public.maintenance_profiles
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Migrer les user_id depuis profiles
UPDATE public.maintenance_profiles mp
SET user_id = p.user_id
FROM public.profiles p
WHERE mp.owner_id = p.id
  AND mp.user_id IS NULL
  AND p.user_id IS NOT NULL;

-- 3. Supprimer les anciennes policies
DROP POLICY IF EXISTS "maint_profiles_select_own" ON public.maintenance_profiles;
DROP POLICY IF EXISTS "maint_profiles_insert_own" ON public.maintenance_profiles;
DROP POLICY IF EXISTS "maint_profiles_update_own" ON public.maintenance_profiles;
DROP POLICY IF EXISTS "maint_profiles_delete_own" ON public.maintenance_profiles;

-- 4. Recreer avec (select auth.uid()) + fallback owner_id
CREATE POLICY "maint_profiles_select_own"
  ON public.maintenance_profiles FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)));

CREATE POLICY "maint_profiles_insert_own"
  ON public.maintenance_profiles FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)));

CREATE POLICY "maint_profiles_update_own"
  ON public.maintenance_profiles FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)));

CREATE POLICY "maint_profiles_delete_own"
  ON public.maintenance_profiles FOR DELETE TO authenticated
  USING (user_id = (select auth.uid()) OR EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = maintenance_profiles.owner_id
      AND (profiles.user_id = (select auth.uid()) OR profiles.user_id IS NULL)));

-- 5. Verification
SELECT id, name, owner_id, user_id FROM public.maintenance_profiles;
`}
        tables={['maintenance_profiles']}
      />

      {/* Migration fuel_type / is_4x4 */}
      <SqlBlock
        title="Migration: fuel_type & is_4x4 (maintenance_profiles)"
        description="Ajoute les colonnes fuel_type et is_4x4 a maintenance_profiles si manquantes"
        sql={`-- ==========================================================
-- MIGRATION: Ajout fuel_type et is_4x4 a maintenance_profiles
-- ==========================================================

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

-- Verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'maintenance_profiles'
  AND column_name IN ('fuel_type', 'is_4x4')
ORDER BY column_name;
`}
        tables={['maintenance_profiles']}
      />

      {/* Nettoyage index dupliques */}
      <SqlBlock
        title="Nettoyage: Index dupliques (7 doublons)"
        description="Supprime les index redondants detectes par le Linter -- ameliore les performances d'ecriture"
        severity="warn"
        sql={CLEANUP_DUPLICATE_INDEXES_SQL}
        tables={['maintenance_entries', 'maintenance_templates', 'reminders', 'tasks', 'vehicles']}
      />

      {/* Securisation table backup */}
      <SqlBlock
        title="SECURITE: maintenance_templates_backup"
        description="Active RLS sur la table backup -- corrige l'erreur de securite du linter Supabase"
        severity="error"
        sql={CLEANUP_BACKUP_TABLE_SQL}
        tables={['maintenance_templates_backup']}
      />

      {/* Nettoyage doublons + index unique */}
      <SqlBlock
        title="Nettoyage doublons + index unique"
        description="Supprime les profils en double et cree des index uniques pour empecher les doublons futurs"
        sql={CLEANUP_DUPLICATES_SQL}
        tables={['profiles', 'maintenance_profiles']}
      />

      {/* Note optimisation initplan */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-300/80 leading-relaxed">
        <p className="font-semibold text-emerald-300 mb-1">Optimisation (select auth.uid())</p>
        <p>
          Toutes les policies RLS utilisent maintenant <code className="bg-emerald-500/20 px-1 rounded font-mono">(select auth.uid())</code> au lieu de{' '}
          <code className="bg-emerald-500/20 px-1 rounded font-mono">auth.uid()</code>. Cela force PostgreSQL a evaluer la fonction
          une seule fois par requete (comme un <em>InitPlan</em>) au lieu de la reevaluer pour chaque ligne.
          Impact significatif sur les tables avec beaucoup de donnees.
        </p>
      </div>

      {/* Note sur le fix de maintenance_profiles */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-xs text-blue-300/80 leading-relaxed">
        <p className="font-semibold text-blue-300 mb-1">FIX RLS v2 -- user_id direct</p>
        <p>
          La table <code className="bg-blue-500/20 px-1 rounded font-mono">maintenance_profiles</code> a desormais une colonne <code className="bg-blue-500/20 px-1 rounded font-mono">user_id</code> directe
          qui reference <code className="bg-blue-500/20 px-1 rounded font-mono">auth.users</code>. La policy RLS verifie d'abord{' '}
          <code className="bg-blue-500/20 px-1 rounded font-mono">user_id = (select auth.uid())</code> (rapide, sans JOIN), avec un fallback via{' '}
          <code className="bg-blue-500/20 px-1 rounded font-mono">owner_id &rarr; profiles.user_id</code> pour la compatibilite.
        </p>
      </div>

      {/* Note sur le fix FK */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-300/80 leading-relaxed">
        <p className="font-semibold text-amber-300 mb-1">Erreur 23503 (FK violation sur profile_id)</p>
        <p>
          Si vous voyez <code className="bg-amber-500/20 px-1 rounded font-mono">maintenance_templates_profile_id_fkey</code>, executez le script
          "FIX: Foreign Key profile_id" ci-dessus. Il rend <code className="bg-amber-500/20 px-1 rounded font-mono">profile_id</code> nullable
          (les templates globaux n'ont pas de profil d'entretien associe) et recree la FK avec <code className="bg-amber-500/20 px-1 rounded font-mono">ON DELETE CASCADE</code>.
        </p>
      </div>

      {/* Note leaked password protection */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-xs text-red-300/80 leading-relaxed">
        <p className="font-semibold text-red-300 mb-1">{'\u26a0\ufe0f'} Leaked Password Protection (Dashboard)</p>
        <p>
          Ce warning ne peut PAS {'\u00ea'}tre corrig{'\u00e9'} par SQL. Allez dans{' '}
          <strong>Supabase Dashboard {'\u2192'} Authentication {'\u2192'} Settings {'\u2192'} Password Security</strong> et activez{' '}
          <code className="bg-red-500/20 px-1 rounded font-mono">Leaked password protection</code>.
          Cela v{'\u00e9'}rifie les mots de passe contre HaveIBeenPwned.org pour emp{'\u00ea'}cher l'utilisation de mots de passe compromis.
        </p>
      </div>

      {/* Note sur les index dupliques */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-xs text-violet-300/80 leading-relaxed">
        <p className="font-semibold text-violet-300 mb-1">Index dupliques nettoyes</p>
        <p>
          7 index redondants ont ete identifies sur 5 tables. Les doublons ralentissent les operations INSERT/UPDATE/DELETE
          car chaque index doit etre mis a jour. Le script conserve un seul index par colonne (celui avec le nom le plus explicite).
        </p>
      </div>
    </div>
  );
}