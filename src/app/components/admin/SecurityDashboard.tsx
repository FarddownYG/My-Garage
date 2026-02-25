import { useState } from 'react';
import { Shield, CheckCircle, AlertTriangle, XCircle, Lock, Database, Key, ChevronDown, ChevronUp, ExternalLink, Copy, Check } from 'lucide-react';

interface SecurityIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'rls' | 'functions' | 'auth' | 'policies';
  title: string;
  description: string;
  affectedTable?: string;
  fix: string;
  fixType: 'sql' | 'dashboard';
  isFixed?: boolean;
}

const SECURITY_ISSUES: SecurityIssue[] = [
  {
    id: 'rls_backup',
    severity: 'critical',
    category: 'rls',
    title: 'RLS désactivé — maintenance_templates_backup',
    description: 'La table maintenance_templates_backup est publique sans Row Level Security.',
    affectedTable: 'public.maintenance_templates_backup',
    fix: 'ALTER TABLE maintenance_templates_backup ENABLE ROW LEVEL SECURITY;\n\nCREATE POLICY "Admins can manage backup templates"\n  ON maintenance_templates_backup FOR ALL\n  USING (EXISTS (\n    SELECT 1 FROM profiles\n    WHERE user_id = auth.uid()\n    AND is_admin = true\n  ))\n  WITH CHECK (EXISTS (\n    SELECT 1 FROM profiles\n    WHERE user_id = auth.uid()\n    AND is_admin = true\n  ));',
    fixType: 'sql',
  },
  {
    id: 'func_update_at',
    severity: 'warning',
    category: 'functions',
    title: 'Function Search Path Mutable — update_updated_at_column',
    description: 'La fonction update_updated_at_column n\'a pas de search_path défini, permettant des attaques de type search_path hijacking.',
    affectedTable: 'public.update_updated_at_column',
    fix: 'CREATE OR REPLACE FUNCTION public.update_updated_at_column()\nRETURNS TRIGGER\nSECURITY DEFINER\nSET search_path = public\nLANGUAGE plpgsql\nAS $$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$$;',
    fixType: 'sql',
  },
  {
    id: 'func_check_banned',
    severity: 'warning',
    category: 'functions',
    title: 'Function Search Path Mutable — check_email_not_banned',
    description: 'La fonction check_email_not_banned n\'a pas de search_path défini.',
    affectedTable: 'public.check_email_not_banned',
    fix: 'CREATE OR REPLACE FUNCTION public.check_email_not_banned()\nRETURNS TRIGGER\nSECURITY DEFINER\nSET search_path = public\nLANGUAGE plpgsql\nAS $$\nBEGIN\n  IF EXISTS (\n    SELECT 1 FROM public.banned_emails\n    WHERE email = LOWER(NEW.email)\n  ) THEN\n    RAISE EXCEPTION \'Email address is banned\';\n  END IF;\n  RETURN NEW;\nEND;\n$$;',
    fixType: 'sql',
  },
  {
    id: 'policy_always_true_app_config',
    severity: 'critical',
    category: 'policies',
    title: 'RLS Policy Always True — app_config',
    description: 'La policy "Anyone can read app config" utilise USING(true) permettant un accès non authentifié.',
    affectedTable: 'public.app_config',
    fix: 'DROP POLICY IF EXISTS "Anyone can read app config" ON app_config;\n\nCREATE POLICY "app_config_select_authenticated"\n  ON app_config FOR SELECT\n  USING (auth.role() = \'authenticated\');',
    fixType: 'sql',
  },
  {
    id: 'policy_always_true_others',
    severity: 'critical',
    category: 'policies',
    title: 'RLS Policies Always True — autres tables',
    description: 'Des policies avec USING(true) existent sur profiles, vehicles, maintenance_entries, tasks, reminders, maintenance_templates. Elles donnent accès à toutes les données sans restriction.',
    fix: 'Exécuter le fichier SECURITY_FIX.sql complet dans Supabase SQL Editor.\nIl supprime dynamiquement TOUTES les anciennes policies et recrée des policies strictes basées sur auth.uid().',
    fixType: 'sql',
  },
  {
    id: 'leaked_password',
    severity: 'warning',
    category: 'auth',
    title: 'Leaked Password Protection désactivée',
    description: 'La protection contre les mots de passe compromis (HaveIBeenPwned) n\'est pas activée.',
    fix: '1. Ouvrir Supabase Dashboard\n2. Aller dans Authentication → Settings\n3. Activer "Enable HaveIBeenPwned (HIBP) integration"\n4. Sauvegarder',
    fixType: 'dashboard',
  },
];

export function SecurityDashboard() {
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [fixedIssues, setFixedIssues] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const markAsFixed = (id: string) => {
    setFixedIssues(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
    }
  };

  const criticalCount = SECURITY_ISSUES.filter(i => i.severity === 'critical' && !fixedIssues.has(i.id)).length;
  const warningCount = SECURITY_ISSUES.filter(i => i.severity === 'warning' && !fixedIssues.has(i.id)).length;
  const fixedCount = fixedIssues.size;
  const totalCount = SECURITY_ISSUES.length;

  // Score calculation
  const rawScore = Math.round(((fixedCount + (totalCount - fixedCount - criticalCount) * 0.3) / totalCount) * 100);
  const baseScore = 72; // score de départ (audit 9.2/10 = ~72% avant ces fixes)
  const maxBonus = 28;
  const bonus = Math.round((fixedCount / totalCount) * maxBonus);
  const displayScore = Math.min(100, baseScore + bonus);

  const getSeverityConfig = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'critical': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XCircle, label: 'Critique' };
      case 'warning': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Avertissement' };
      case 'info': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Shield, label: 'Info' };
    }
  };

  const getCategoryIcon = (category: SecurityIssue['category']) => {
    switch (category) {
      case 'rls': return Database;
      case 'functions': return Key;
      case 'auth': return Lock;
      case 'policies': return Shield;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const groupedIssues = {
    rls: SECURITY_ISSUES.filter(i => i.category === 'rls'),
    policies: SECURITY_ISSUES.filter(i => i.category === 'policies'),
    functions: SECURITY_ISSUES.filter(i => i.category === 'functions'),
    auth: SECURITY_ISSUES.filter(i => i.category === 'auth'),
  };

  const categoryLabels = {
    rls: 'Row Level Security',
    policies: 'Politiques RLS',
    functions: 'Fonctions SQL',
    auth: 'Authentification',
  };

  return (
    <div className="space-y-4">
      {/* Score global */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center gap-4">
          {/* Cercle score */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#27272a" strokeWidth="12" />
              <circle
                cx="50" cy="50" r="38"
                fill="none"
                stroke={getScoreColor(displayScore)}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - displayScore / 100)}`}
                style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold" style={{ color: getScoreColor(displayScore) }}>
                {displayScore}
              </span>
              <span className="text-[10px] text-zinc-500">/100</span>
            </div>
          </div>

          <div className="flex-1">
            <h3 className="text-white font-semibold mb-2">Score de sécurité</h3>
            <div className="space-y-1">
              {criticalCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  <span className="text-xs text-zinc-400">{criticalCount} problème(s) critique(s)</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-xs text-zinc-400">{warningCount} avertissement(s)</span>
                </div>
              )}
              {fixedCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-zinc-400">{fixedCount} correction(s) marquée(s)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${displayScore}%`,
              background: `linear-gradient(to right, ${getScoreColor(displayScore)}, ${getScoreColor(displayScore)}aa)`,
            }}
          />
        </div>

        {/* Instruction principale */}
        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-300/80">
              <span className="font-medium text-blue-300">Solution rapide :</span> Exécutez{' '}
              <code className="bg-blue-500/20 px-1 rounded text-blue-200">SECURITY_FIX.sql</code>{' '}
              dans <strong>Supabase → SQL Editor</strong> pour corriger automatiquement 5 des 6 problèmes.
            </div>
          </div>
        </div>
      </div>

      {/* Issues par catégorie */}
      {(Object.keys(groupedIssues) as Array<keyof typeof groupedIssues>).map(cat => {
        const issues = groupedIssues[cat];
        const CatIcon = getCategoryIcon(cat);
        const catFixedCount = issues.filter(i => fixedIssues.has(i.id)).length;
        const catCritical = issues.filter(i => i.severity === 'critical' && !fixedIssues.has(i.id)).length;

        return (
          <div key={cat} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800/50 flex items-center gap-2">
              <CatIcon className="w-4 h-4 text-zinc-500" />
              <span className="text-sm font-medium text-zinc-300">{categoryLabels[cat]}</span>
              <div className="ml-auto flex gap-1.5">
                {catFixedCount > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 rounded-full">
                    {catFixedCount} corrigé
                  </span>
                )}
                {catCritical > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-red-500/15 text-red-400 rounded-full">
                    {catCritical} critique
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-zinc-800/30">
              {issues.map(issue => {
                const isFixed = fixedIssues.has(issue.id);
                const isExpanded = expandedIssue === issue.id;
                const cfg = getSeverityConfig(issue.severity);
                const SevIcon = cfg.icon;
                const isCopied = copiedId === issue.id;

                return (
                  <div key={issue.id} className={isFixed ? 'opacity-60' : ''}>
                    <button
                      className="w-full flex items-start gap-3 p-4 text-left hover:bg-zinc-800/30 transition-colors"
                      onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                    >
                      {isFixed ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <SevIcon className={`w-4 h-4 ${cfg.color} flex-shrink-0 mt-0.5`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-full ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          <span className={`text-sm ${isFixed ? 'text-zinc-500 line-through' : 'text-zinc-200'}`}>
                            {issue.title}
                          </span>
                        </div>
                        {issue.affectedTable && (
                          <p className="text-xs text-zinc-500 mt-0.5 font-mono">{issue.affectedTable}</p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 space-y-3">
                        <p className="text-sm text-zinc-400 leading-relaxed">{issue.description}</p>

                        <div className="rounded-xl overflow-hidden border border-zinc-700/50">
                          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
                            <span className="text-xs text-zinc-500 font-medium">
                              {issue.fixType === 'sql' ? '🔧 Correction SQL' : '⚙️ Configuration Dashboard'}
                            </span>
                            {issue.fixType === 'sql' && (
                              <button
                                onClick={() => copyToClipboard(issue.fix, issue.id)}
                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                {isCopied ? (
                                  <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copié</span></>
                                ) : (
                                  <><Copy className="w-3 h-3" />Copier</>
                                )}
                              </button>
                            )}
                          </div>
                          <pre className="p-3 text-xs text-zinc-300 overflow-x-auto bg-zinc-900/50 whitespace-pre-wrap font-mono leading-relaxed">
                            {issue.fix}
                          </pre>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => markAsFixed(issue.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              isFixed
                                ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                                : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/20'
                            }`}
                          >
                            <CheckCircle className="w-3 h-3" />
                            {isFixed ? 'Marquer comme non corrigé' : 'Marquer comme corrigé'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Guide SECURITY_FIX.sql */}
      <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/15 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ExternalLink className="w-4 h-4 text-blue-400" />
          <h4 className="text-white font-medium text-sm">Correction en une étape</h4>
        </div>
        <ol className="space-y-2">
          {[
            { num: '1', text: 'Ouvrir Supabase Dashboard → SQL Editor', color: 'text-blue-400' },
            { num: '2', text: 'Copier le contenu de SECURITY_FIX.sql depuis le projet', color: 'text-blue-400' },
            { num: '3', text: 'Coller et exécuter — toutes les corrections SQL s\'appliquent', color: 'text-blue-400' },
            { num: '4', text: 'Authentication → Settings → Activer "HaveIBeenPwned integration"', color: 'text-amber-400' },
            { num: '5', text: 'Marquer chaque correction comme corrigée ci-dessus pour suivre la progression', color: 'text-emerald-400' },
          ].map(step => (
            <li key={step.num} className="flex items-start gap-2 text-xs text-zinc-400">
              <span className={`font-bold ${step.color} flex-shrink-0`}>{step.num}.</span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
