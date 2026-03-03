import React, { useEffect, useState, useMemo } from 'react';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Chargement de vos donn\u00e9es...' }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 900);
    const t3 = setTimeout(() => setPhase(3), 1500);
    const t4 = setTimeout(() => setShowDetails(true), 600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => prev >= 92 ? prev : prev + Math.random() * 12);
    }, 280);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (phase < 3) return;
    const interval = setInterval(() => {
      setSpeed(prev => prev >= 240 ? 240 : prev + Math.floor(Math.random() * 6 + 3));
    }, 70);
    return () => clearInterval(interval);
  }, [phase]);

  const stars = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 50,
      size: Math.random() * 1.5 + 0.5, delay: Math.random() * 3,
      duration: 2 + Math.random(),
    })), []);

  const headlightOn = phase >= 2;
  const launched = phase >= 3;

  return (
    <div className="fixed inset-0 bg-[#05050a] flex flex-col items-center justify-center z-50 overflow-hidden select-none">

      {/* Stars */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map(s => (
          <div key={s.id} className="absolute rounded-full bg-white" style={{
            left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            animation: `star-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: headlightOn ? 0.1 : 0.35, transition: 'opacity 1.5s ease',
          }} />
        ))}
      </div>

      {/* ═══ SCENE CONTAINER — everything is in this SVG ═══ */}
      <svg
        viewBox="0 0 600 220"
        className="w-full max-w-[480px] px-4 transition-all duration-700"
        style={{
          opacity: phase >= 1 ? 1 : 0,
          transform: phase >= 1 ? 'translateY(0)' : 'translateY(15px)',
        }}
      >
        <defs>
          <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2e2e44" />
            <stop offset="100%" stopColor="#18182a" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(6,182,212,0.15)" />
            <stop offset="100%" stopColor="rgba(6,182,212,0.05)" />
          </linearGradient>
          <radialGradient id="wheelGrad" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#0a0a0a" />
          </radialGradient>
          <linearGradient id="headlightBeam" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="rgba(255,240,190,0.35)" />
            <stop offset="40%" stopColor="rgba(255,240,190,0.08)" />
            <stop offset="100%" stopColor="rgba(255,240,190,0)" />
          </linearGradient>
          <linearGradient id="taillightTrail" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.6)" />
            <stop offset="40%" stopColor="rgba(239,68,68,0.1)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </linearGradient>
          <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0c0c16" />
            <stop offset="100%" stopColor="#10101e" />
          </linearGradient>
        </defs>

        {/* ── Road ── */}
        <rect x="0" y="168" width="600" height="52" fill="url(#roadGrad)" opacity={phase >= 1 ? 1 : 0} style={{ transition: 'opacity 0.8s ease' }} />
        {/* Road line */}
        <line x1="0" y1="168" x2="600" y2="168" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
        {/* Center dashes */}
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={20 + i * 60} y="190" width="30" height="2" rx="1"
            fill="rgba(250,204,21,0.25)" opacity={headlightOn ? 1 : 0}
            style={{ transition: 'opacity 0.6s ease' }}>
            {launched && (
              <animate attributeName="x" from={20 + i * 60} to={20 + i * 60 - 600}
                dur="1.2s" repeatCount="indefinite" />
            )}
          </rect>
        ))}

        {/* ════════════════════════════════════ */}
        {/* ══  HEADLIGHT BEAMS (horizontal) ══ */}
        {/* ════════════════════════════════════ */}
        <polygon
          points="470,130 600,100 600,155"
          fill="url(#headlightBeam)"
          opacity={headlightOn ? 1 : 0}
          style={{ transition: 'opacity 0.8s ease' }}
        />
        <polygon
          points="470,138 600,118 600,165"
          fill="url(#headlightBeam)"
          opacity={headlightOn ? 0.5 : 0}
          style={{ transition: 'opacity 0.8s ease' }}
        />

        {/* ════════════════════════════ */}
        {/* ══  TAILLIGHT TRAILS      ══ */}
        {/* ════════════════════════════ */}
        {launched && (
          <>
            <rect x="40" y="134" width="100" height="3" rx="1.5" fill="url(#taillightTrail)" className="animate-tail-pulse" />
            <rect x="30" y="140" width="80" height="2" rx="1" fill="url(#taillightTrail)" opacity="0.5" className="animate-tail-pulse" />
          </>
        )}

        {/* ═══════════════════════════════════ */}
        {/* ══  THE CAR — simple coupe side  ══ */}
        {/* ═══════════════════════════════════ */}
        <g className={phase >= 1 && !launched ? 'animate-engine-idle' : ''}>
          {/* Shadow under car */}
          <ellipse cx="300" cy="172" rx="140" ry="6" fill="rgba(0,0,0,0.5)" />

          {/* ── Lower body / sill ── */}
          <path
            d="M130,155 L130,165 L470,165 L470,155 Z"
            fill="#111120"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />

          {/* ── Main body ── */}
          <path
            d="M135,155 
               L140,130 L155,120 L175,115 
               L440,115 
               L455,118 L465,125 L470,135 L470,155 
               Z"
            fill="url(#bodyGrad)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.7"
          />

          {/* ── Roof & cabin ── */}
          <path
            d="M220,115 
               L232,82 L248,72 L270,68 
               L350,68 
               L370,72 L385,82 L395,100 L400,115
               Z"
            fill="url(#bodyGrad)"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.7"
          />

          {/* ── Windshield ── */}
          <path
            d="M370,113 L382,85 L367,74 L355,70 L348,113 Z"
            fill="url(#glassGrad)"
            stroke="rgba(6,182,212,0.2)"
            strokeWidth="0.6"
          />

          {/* ── Rear window ── */}
          <path
            d="M226,113 L236,84 L252,74 L268,70 L272,113 Z"
            fill="url(#glassGrad)"
            stroke="rgba(6,182,212,0.2)"
            strokeWidth="0.6"
          />

          {/* ── Side windows ── */}
          <path
            d="M278,113 L276,72 L342,70 L344,113 Z"
            fill="url(#glassGrad)"
            stroke="rgba(6,182,212,0.15)"
            strokeWidth="0.5"
          />

          {/* B-pillar */}
          <rect x="272" y="70" width="5" height="43" fill="#151525" />
          {/* C-pillar accent */}
          <rect x="345" y="70" width="4" height="43" fill="#151525" />

          {/* ── Character line ── */}
          <line x1="145" y1="138" x2="465" y2="138" stroke="rgba(255,255,255,0.05)" strokeWidth="0.6" />

          {/* ── Door line ── */}
          <line x1="310" y1="113" x2="308" y2="155" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
          {/* Door handle */}
          <rect x="320" y="130" width="12" height="2.5" rx="1.25" fill="rgba(255,255,255,0.07)" />

          {/* ── Side mirror ── */}
          <path d="M398,100 L408,97 L410,104 L400,106 Z" fill="#1e1e30" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />

          {/* ══ HEADLIGHT ══ */}
          <path
            d="M455,120 L468,122 L470,140 L465,145 L455,142 Z"
            fill={headlightOn ? 'rgba(255,240,190,0.9)' : 'rgba(60,60,80,0.3)'}
            stroke={headlightOn ? 'rgba(255,240,190,0.5)' : 'rgba(255,255,255,0.06)'}
            strokeWidth="0.6"
            style={{ transition: 'fill 0.6s ease, stroke 0.6s ease' }}
          />
          {headlightOn && (
            <path d="M454,118 L470,120 L472,142 L464,147 L453,144 Z"
              fill="none" stroke="rgba(255,240,190,0.15)" strokeWidth="1.5" />
          )}

          {/* ══ TAILLIGHT ══ */}
          <path
            d="M135,125 L140,122 L140,145 L135,148 Z"
            fill={headlightOn ? 'rgba(239,68,68,0.9)' : 'rgba(80,30,30,0.3)'}
            stroke={headlightOn ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.04)'}
            strokeWidth="0.5"
            style={{ transition: 'fill 0.5s ease, stroke 0.5s ease' }}
          />
          {headlightOn && (
            <path d="M133,123 L141,120 L141,147 L133,150 Z"
              fill="none" stroke="rgba(239,68,68,0.1)" strokeWidth="1.5" />
          )}

          {/* ── Front bumper ── */}
          <path d="M455,145 L470,142 L472,155 L468,158 L455,158 Z"
            fill="#111120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" />
          {/* Grille */}
          <rect x="456" y="148" width="14" height="8" rx="1" fill="#080810" stroke="rgba(255,255,255,0.03)" strokeWidth="0.3" />

          {/* ── Rear bumper ── */}
          <path d="M130,145 L140,145 L140,158 L132,158 Z"
            fill="#111120" stroke="rgba(255,255,255,0.04)" strokeWidth="0.4" />

          {/* ── Exhaust ── */}
          <ellipse cx="138" cy="160" rx="4" ry="2.5" fill="#0a0a10" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />

          {/* ══ FENDER ARCHES ══ */}
          <path d="M170,165 C170,148 190,135 215,135 C240,135 260,148 260,165"
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
          <path d="M360,165 C360,148 380,135 405,135 C430,135 450,148 450,165"
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />

          {/* ══ WHEELS ══ */}
          {[215, 405].map((cx, wi) => (
            <g key={wi}>
              {/* Tire */}
              <circle cx={cx} cy={168} r={22} fill="#060608" stroke="#1a1a22" strokeWidth="3" />
              <circle cx={cx} cy={168} r={20} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5" />
              {/* Rim */}
              <circle cx={cx} cy={168} r={13} fill="url(#wheelGrad)" stroke="#333" strokeWidth="0.8" />
              {/* Spokes */}
              {[0,1,2,3,4].map(i => {
                const a = (i * 72 - 90) * Math.PI / 180;
                return <line key={i}
                  x1={cx + Math.cos(a) * 4} y1={168 + Math.sin(a) * 4}
                  x2={cx + Math.cos(a) * 12} y2={168 + Math.sin(a) * 12}
                  stroke="#4a4a4a" strokeWidth="2.5" strokeLinecap="round" />;
              })}
              {/* Hub */}
              <circle cx={cx} cy={168} r={4} fill="#333" stroke="#444" strokeWidth="0.5" />
              <circle cx={cx} cy={168} r={1.5} fill="#555" />
              {/* Spin effect */}
              {launched && (
                <circle cx={cx} cy={168} r={15} fill="none" stroke="rgba(255,255,255,0.04)"
                  strokeWidth="0.5" className="animate-wheel-spin" />
              )}
            </g>
          ))}

          {/* Roof highlight */}
          <path d="M255,70 L340,68" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.4" />
        </g>

        {/* ═══ SPEED LINES ═══ */}
        {launched && Array.from({ length: 6 }).map((_, i) => (
          <line key={i}
            x1="0" y1={100 + i * 14}
            x2={80 + i * 15} y2={100 + i * 14}
            stroke="rgba(6,182,212,0.12)" strokeWidth="1"
            strokeLinecap="round"
            style={{
              animation: `speed-line 0.5s ease-out ${i * 0.15}s infinite`,
            }}
          />
        ))}

        {/* ═══ EXHAUST SPARKS ═══ */}
        {launched && Array.from({ length: 4 }).map((_, i) => (
          <circle key={i} r="1.5"
            fill={i % 2 === 0 ? '#f59e0b' : '#ef4444'}>
            <animate attributeName="cx" from="135" to={80 - i * 20} dur="0.6s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
            <animate attributeName="cy" from="160" to={155 - i * 5 + (i % 3) * 4} dur="0.6s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
            <animate attributeName="opacity" from="1" to="0" dur="0.6s" repeatCount="indefinite" begin={`${i * 0.2}s`} />
          </circle>
        ))}
      </svg>

      {/* ═══ HUD ═══ */}
      <div className="relative z-10 flex flex-col items-center px-6 w-full max-w-[320px] mt-4">

        {/* Speed */}
        <div className="flex items-end gap-2 mb-4 transition-all duration-700" style={{
          opacity: launched ? 1 : 0, transform: launched ? 'translateY(0)' : 'translateY(15px)',
        }}>
          <div className="text-right">
            <div className="text-[9px] tracking-[0.3em] uppercase text-slate-600 mb-0.5">km/h</div>
            <div className="text-3xl sm:text-4xl tabular-nums tracking-tight" style={{
              fontVariantNumeric: 'tabular-nums',
              color: speed > 180 ? '#f59e0b' : speed > 80 ? '#06b6d4' : '#64748b',
              transition: 'color 0.3s ease',
              textShadow: speed > 180 ? '0 0 25px rgba(245,158,11,0.3)' : speed > 80 ? '0 0 15px rgba(6,182,212,0.15)' : 'none',
            }}>
              {speed}
            </div>
          </div>
          <div className="text-xs px-1.5 py-0.5 rounded border mb-1" style={{
            color: '#8b5cf6', borderColor: 'rgba(139,92,246,0.2)', background: 'rgba(139,92,246,0.05)',
          }}>
            {speed < 50 ? '2' : speed < 100 ? '3' : speed < 170 ? '4' : '5'}
          </div>
        </div>

        {/* Brand */}
        <div className={`text-center transition-all duration-700 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h2 className="text-2xl sm:text-3xl mb-1 tracking-tight">
            <span style={{
              background: 'linear-gradient(135deg, #06b6d4, #818cf8, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Valcar</span>
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm mb-5">{message}</p>
        </div>

        {/* Progress */}
        <div className={`w-full transition-all duration-700 delay-200 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative h-[3px] rounded-full overflow-hidden" style={{ background: '#111118' }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{
              width: `${Math.min(progress, 95)}%`,
              background: progress > 70 ? 'linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)' : 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
              boxShadow: progress > 70 ? '0 0 10px rgba(245,158,11,0.25)' : '0 0 6px rgba(6,182,212,0.15)',
            }} />
            <div className="absolute inset-0 overflow-hidden rounded-full">
              <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-progress-shimmer" />
            </div>
          </div>
        </div>

        <div className="mt-5 text-[9px] tracking-[0.2em] uppercase transition-all duration-700 delay-500"
          style={{ color: '#1e1e2e', opacity: showDetails ? 1 : 0 }}>
          Connexion s{'\u00e9'}curis{'\u00e9'}e {'\u2022'} Donn{'\u00e9'}es crypt{'\u00e9'}es
        </div>
      </div>

      <style>{`
        @keyframes star-twinkle {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.45; }
        }
        @keyframes wheel-spin {
          to { transform: rotate(360deg); }
        }
        .animate-wheel-spin {
          animation: wheel-spin 0.25s linear infinite;
          transform-origin: center;
        }
        @keyframes engine-idle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-0.4px); }
        }
        .animate-engine-idle {
          animation: engine-idle 0.08s linear infinite;
        }
        @keyframes tail-pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.3; }
        }
        .animate-tail-pulse {
          animation: tail-pulse 0.4s ease-in-out infinite;
        }
        @keyframes speed-line {
          0% { transform: translateX(600px); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateX(-100px); opacity: 0; }
        }
        .animate-speed-line {
          animation: speed-line 0.5s ease-out infinite;
        }
        @keyframes progress-shimmer {
          0% { transform: translateX(-200%); }
          100% { transform: translateX(500%); }
        }
        .animate-progress-shimmer {
          animation: progress-shimmer 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}