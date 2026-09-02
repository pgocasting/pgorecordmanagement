import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Lock, Eye, EyeOff, FileText, Shield, Users, ArrowRight, Sparkles } from 'lucide-react';

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

  .login-root {
    min-height: 100vh;
    display: flex;
    font-family: 'Inter', sans-serif;
    background: #060b18;
    overflow: hidden;
    position: relative;
  }

  .orb {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    pointer-events: none;
    z-index: 0;
  }
  .orb-1 {
    width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(37,99,235,0.45) 0%, transparent 70%);
    top: -200px; left: -150px;
    animation: orbFloat1 8s ease-in-out infinite;
  }
  .orb-2 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%);
    bottom: -150px; left: 30%;
    animation: orbFloat2 10s ease-in-out infinite;
  }
  .orb-3 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(14,165,233,0.25) 0%, transparent 70%);
    top: 20%; right: -100px;
    animation: orbFloat3 12s ease-in-out infinite;
  }

  @keyframes orbFloat1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(40px, 60px) scale(1.08); }
  }
  @keyframes orbFloat2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(-50px, -40px) scale(1.05); }
  }
  @keyframes orbFloat3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%      { transform: translate(30px, 50px) scale(1.06); }
  }

  .grid-overlay {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
    background-size: 60px 60px;
  }

  .lp-left {
    display: none;
    position: relative;
    z-index: 1;
    flex-direction: column;
    justify-content: space-between;
    padding: 56px 64px;
    overflow: hidden;
  }
  @media (min-width: 1024px) { .lp-left { display: flex; width: 52%; } }

  .lp-left-bg {
    position: absolute; inset: 0;
    background-image: url('/images/Bunker.png');
    background-size: cover; background-position: center;
    opacity: 0.12;
  }
  .lp-left-gradient {
    position: absolute; inset: 0;
    background: linear-gradient(135deg,
      rgba(6,11,24,0.92) 0%,
      rgba(15,23,60,0.75) 50%,
      rgba(6,11,24,0.88) 100%);
  }

  .lp-logo-row {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 16px;
    opacity: 0; transform: translateY(-20px);
    transition: opacity 0.8s ease, transform 0.8s ease;
  }
  .lp-logo-row.lp-visible { opacity: 1; transform: translateY(0); }

  .lp-logo-badge {
    width: 56px; height: 56px; border-radius: 16px;
    background: rgba(255,255,255,0.08);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.15);
    display: flex; align-items: center; justify-content: center;
  }
  .lp-logo-badge img { width: 40px; height: 40px; object-fit: contain; }
  .lp-logo-name { margin: 0; font-size: 1.25rem; font-weight: 700; color: #fff; }
  .lp-logo-sub  { margin: 0; font-size: 0.75rem; color: rgba(147,197,253,0.8); }

  .lp-hero {
    position: relative; z-index: 2;
    opacity: 0; transform: translateX(-30px);
    transition: opacity 0.9s ease 0.2s, transform 0.9s ease 0.2s;
  }
  .lp-hero.lp-visible { opacity: 1; transform: translateX(0); }

  .lp-pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(59,130,246,0.15);
    border: 1px solid rgba(59,130,246,0.35);
    border-radius: 999px; padding: 6px 14px;
    font-size: 0.75rem; font-weight: 500; color: #93c5fd;
    margin-bottom: 24px;
  }
  .lp-pill svg { width: 12px; height: 12px; }

  .lp-title {
    font-size: clamp(2rem, 3vw, 2.75rem);
    font-weight: 800; line-height: 1.15;
    color: #fff; margin: 0 0 16px;
    letter-spacing: -0.03em;
  }
  .lp-title-accent {
    background: linear-gradient(90deg, #60a5fa, #818cf8);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .lp-sub {
    font-size: 1rem; color: rgba(147,197,253,0.75);
    margin: 0 0 48px; line-height: 1.6;
  }

  .lp-features { display: flex; flex-direction: column; gap: 20px; }
  .lp-feature {
    display: flex; align-items: flex-start; gap: 16px;
    opacity: 0; transform: translateX(-20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  .lp-feature.lp-visible { opacity: 1; transform: translateX(0); }
  .lp-feature:nth-child(1) { transition-delay: 0.4s; }
  .lp-feature:nth-child(2) { transition-delay: 0.55s; }
  .lp-feature:nth-child(3) { transition-delay: 0.7s; }

  .lp-feat-icon {
    width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
  }
  .lp-feat-icon svg { width: 20px; height: 20px; }
  .lp-feat-title { font-size: 0.9rem; font-weight: 600; color: #e2e8f0; margin-bottom: 4px; }
  .lp-feat-desc  { font-size: 0.8rem; color: rgba(147,197,253,0.65); line-height: 1.5; }

  .lp-footer-text {
    position: relative; z-index: 2;
    font-size: 0.75rem; color: rgba(100,116,139,0.8);
    opacity: 0; transition: opacity 0.8s ease 0.9s;
  }
  .lp-footer-text.lp-visible { opacity: 1; }

  .lp-right {
    flex: 1; position: relative; z-index: 1;
    display: flex; align-items: center; justify-content: center;
    padding: 32px 24px;
  }

  .lp-form-wrap {
    width: 100%; max-width: 420px;
    opacity: 0; transform: translateY(30px);
    transition: opacity 0.9s ease 0.3s, transform 0.9s ease 0.3s;
  }
  .lp-form-wrap.lp-visible { opacity: 1; transform: translateY(0); }

  .lp-mobile-logo {
    display: flex; flex-direction: column; align-items: center;
    margin-bottom: 32px;
  }
  @media (min-width: 1024px) { .lp-mobile-logo { display: none; } }

  .lp-mobile-badge {
    width: 72px; height: 72px; border-radius: 20px;
    background: linear-gradient(135deg, #1d4ed8, #4f46e5);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 12px;
    box-shadow: 0 20px 40px rgba(37,99,235,0.4);
  }
  .lp-mobile-badge img { width: 52px; height: 52px; object-fit: contain; }
  .lp-mobile-name { margin: 0; font-size: 1.4rem; font-weight: 700; color: #fff; }
  .lp-mobile-sub  { margin: 4px 0 0; font-size: 0.8rem; color: #94a3b8; }

  .lp-card {
    background: rgba(15,23,42,0.65);
    backdrop-filter: blur(32px);
    -webkit-backdrop-filter: blur(32px);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 24px;
    padding: 40px 36px;
    box-shadow:
      0 0 0 1px rgba(255,255,255,0.05),
      0 32px 64px rgba(0,0,0,0.5),
      inset 0 1px 0 rgba(255,255,255,0.1);
  }

  .lp-card-tag {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(59,130,246,0.12);
    border: 1px solid rgba(59,130,246,0.25);
    border-radius: 999px; padding: 4px 12px;
    font-size: 0.7rem; font-weight: 600;
    color: #60a5fa; text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 16px;
  }
  .lp-card-tag svg { width: 10px; height: 10px; }
  .lp-card-title {
    font-size: 1.9rem; font-weight: 800;
    color: #f8fafc; margin: 0 0 8px;
    letter-spacing: -0.03em;
  }
  .lp-card-sub { font-size: 0.875rem; color: #64748b; margin: 0 0 28px; line-height: 1.5; }

  .lp-error {
    display: flex; align-items: flex-start; gap: 10px;
    background: rgba(220,38,38,0.1);
    border: 1px solid rgba(220,38,38,0.25);
    border-radius: 12px; padding: 12px 14px;
    margin-bottom: 20px;
    animation: lpShake 0.4s ease;
  }
  .lp-error svg { width: 16px; height: 16px; color: #f87171; flex-shrink: 0; margin-top: 1px; }
  .lp-error span { font-size: 0.825rem; color: #fca5a5; line-height: 1.4; }

  @keyframes lpShake {
    0%  { transform: translateX(-10px); opacity: 0; }
    40% { transform: translateX(6px); }
    70% { transform: translateX(-4px); }
    100%{ transform: translateX(0); opacity: 1; }
  }

  .lp-field { margin-bottom: 20px; }
  .lp-label {
    display: block; font-size: 0.78rem; font-weight: 600;
    color: #94a3b8; margin-bottom: 8px;
    text-transform: uppercase; letter-spacing: 0.04em;
  }
  .lp-field-wrap { position: relative; }

  .lp-input {
    width: 100%; height: 50px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px;
    color: #f1f5f9;
    font-size: 0.9rem; font-family: 'Inter', sans-serif;
    padding: 0 44px;
    outline: none;
    transition: border-color 0.25s, background 0.25s, box-shadow 0.25s;
  }
  .lp-input::placeholder { color: rgba(100,116,139,0.7); }
  .lp-input:focus {
    border-color: rgba(59,130,246,0.6);
    background: rgba(59,130,246,0.06);
    box-shadow: 0 0 0 3px rgba(59,130,246,0.12), 0 0 20px rgba(59,130,246,0.08);
  }
  .lp-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .lp-field-il {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    pointer-events: none; color: #475569;
    display: flex; align-items: center;
    transition: color 0.25s;
  }
  .lp-field-il svg { width: 18px; height: 18px; }
  .lp-field-wrap:focus-within .lp-field-il { color: #60a5fa; }

  .lp-field-ir {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    cursor: pointer; color: #475569;
    display: flex; align-items: center;
    transition: color 0.2s; background: none; border: none; padding: 0;
  }
  .lp-field-ir:hover { color: #94a3b8; }
  .lp-field-ir svg { width: 18px; height: 18px; }

  .lp-remember {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 24px;
  }
  .lp-checkbox {
    width: 18px; height: 18px; border-radius: 5px;
    border: 1.5px solid rgba(255,255,255,0.15);
    background: rgba(255,255,255,0.04);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: border-color 0.2s, background 0.2s;
    flex-shrink: 0; user-select: none;
  }
  .lp-checkbox.lp-checked { background: #2563eb; border-color: #2563eb; }
  .lp-checkbox svg { width: 11px; height: 11px; color: #fff; }
  .lp-remember-lbl {
    font-size: 0.85rem; color: #64748b; cursor: pointer; user-select: none;
  }

  .lp-btn {
    width: 100%; height: 52px;
    background: linear-gradient(135deg, #1d4ed8 0%, #4338ca 100%);
    border: none; border-radius: 14px;
    color: #fff; font-size: 0.95rem; font-weight: 700;
    font-family: 'Inter', sans-serif;
    cursor: pointer; position: relative; overflow: hidden;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
    box-shadow: 0 8px 32px rgba(37,99,235,0.4);
    letter-spacing: 0.02em;
  }
  .lp-btn::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    border-radius: 14px;
  }
  .lp-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 40px rgba(37,99,235,0.55);
  }
  .lp-btn:active:not(:disabled) { transform: translateY(0); }
  .lp-btn:disabled { opacity: 0.7; cursor: not-allowed; }
  .lp-btn svg { width: 18px; height: 18px; position: relative; z-index: 1; }
  .lp-btn span { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }

  .lp-spinner {
    width: 20px; height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: lpSpin 0.7s linear infinite;
  }
  @keyframes lpSpin { to { transform: rotate(360deg); } }

  .lp-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent);
    margin: 28px 0;
  }
  .lp-help { text-align: center; font-size: 0.8rem; color: #475569; }
  .lp-help a { color: #60a5fa; text-decoration: none; font-weight: 500; }
  .lp-help a:hover { color: #93c5fd; text-decoration: underline; }

  .lp-particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
  .lp-particle {
    position: absolute;
    border-radius: 50%;
    background: rgba(96,165,250,0.5);
    animation: lpDrift linear infinite;
  }
  @keyframes lpDrift {
    0%   { transform: translateY(0) translateX(0); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 0.4; }
    100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
  }
`;

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.5 + 3) % 100}%`,
  dur: `${8 + (i * 0.7) % 12}s`,
  delay: `${(i * 0.6) % 10}s`,
  size: `${1 + (i % 3)}px`,
}));

const FEATURES = [
  { Icon: FileText, title: 'Digital Record Keeping', desc: 'Manage all your documents in one centralized platform', color: '#60a5fa' },
  { Icon: Shield,   title: 'Secure & Compliant',     desc: 'Enterprise-grade security for sensitive government records', color: '#34d399' },
  { Icon: Users,    title: 'Collaborative Workflow',  desc: 'Seamless collaboration across departments', color: '#a78bfa' },
];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { setMounted(true); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) { setError('Please enter your username'); return; }
    if (!password) { setError('Please enter your password'); return; }
    setIsLoading(true);
    try {
      await login(username, password, rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      setIsLoading(false);
    }
  };

  const vis = mounted ? 'lp-visible' : '';

  return (
    <>
      <style>{loginStyles}</style>
      <div className="login-root">
        {/* Orbs */}
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />

        {/* Particles */}
        <div className="lp-particles">
          {PARTICLES.map(p => (
            <div key={p.id} className="lp-particle" style={{ left: p.left, width: p.size, height: p.size, animationDuration: p.dur, animationDelay: p.delay }} />
          ))}
        </div>

        {/* ── Left panel ── */}
        <div className="lp-left">
          <div className="lp-left-bg" />
          <div className="lp-left-gradient" />

          <div className={`lp-logo-row ${vis}`}>
            <div className="lp-logo-badge">
              <img src="/images/bataan-logo.png" alt="Bataan Logo" />
            </div>
            <div>
              <p className="lp-logo-name">PGO Records</p>
              <p className="lp-logo-sub">Management System</p>
            </div>
          </div>

          <div className={`lp-hero ${vis}`}>
            <div className="lp-pill">
              <Sparkles />
              Government Digital Platform
            </div>
            <h2 className="lp-title">
              Welcome to the<br />
              Provincial{' '}
              <span className="lp-title-accent">Governor's</span>
              <br />
              Office Records
            </h2>
            <p className="lp-sub">
              Streamline your document management with secure,<br />
              efficient tracking across all departments.
            </p>
            <div className="lp-features">
              {FEATURES.map(({ Icon, title, desc, color }, i) => (
                <div key={i} className={`lp-feature ${vis}`}>
                  <div className="lp-feat-icon" style={{ borderColor: `${color}25` }}>
                    <Icon style={{ color }} />
                  </div>
                  <div>
                    <div className="lp-feat-title">{title}</div>
                    <div className="lp-feat-desc">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`lp-footer-text ${vis}`}>
            © 2025 PGO Record Management System. All rights reserved.
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="lp-right">
          <div className={`lp-form-wrap ${vis}`}>
            {/* Mobile logo */}
            <div className="lp-mobile-logo">
              <div className="lp-mobile-badge">
                <img src="/images/bataan-logo.png" alt="Bataan Logo" />
              </div>
              <p className="lp-mobile-name">PGO Records</p>
              <p className="lp-mobile-sub">Management System</p>
            </div>

            {/* Card */}
            <div className="lp-card">
              <div className="lp-card-tag"><Shield />Secure Access</div>
              <h1 className="lp-card-title">Sign In</h1>
              <p className="lp-card-sub">Enter your credentials to access your account</p>

              {error && (
                <div className="lp-error">
                  <AlertCircle />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="username">Username</label>
                  <div className="lp-field-wrap">
                    <input
                      id="username"
                      type="text"
                      className="lp-input"
                      placeholder="Enter your username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      disabled={isLoading}
                      autoComplete="username"
                    />
                    <span className="lp-field-il">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="8" r="4"/>
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                    </span>
                  </div>
                </div>

                <div className="lp-field">
                  <label className="lp-label" htmlFor="password">Password</label>
                  <div className="lp-field-wrap">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="lp-input"
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <span className="lp-field-il"><Lock /></span>
                    <button
                      type="button"
                      className="lp-field-ir"
                      onClick={() => !isLoading && setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <div className="lp-remember">
                  <div
                    className={`lp-checkbox ${rememberMe ? 'lp-checked' : ''}`}
                    onClick={() => !isLoading && setRememberMe(!rememberMe)}
                    role="checkbox"
                    aria-checked={rememberMe}
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && !isLoading && setRememberMe(!rememberMe)}
                  >
                    {rememberMe && (
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="1.5 6 4.5 9 10.5 3" />
                      </svg>
                    )}
                  </div>
                  <span
                    className="lp-remember-lbl"
                    onClick={() => !isLoading && setRememberMe(!rememberMe)}
                  >
                    Keep me signed in
                  </span>
                </div>

                <button type="submit" className="lp-btn" disabled={isLoading} id="login-submit-btn">
                  {isLoading ? (
                    <span><div className="lp-spinner" /> Signing in…</span>
                  ) : (
                    <span>Sign In <ArrowRight /></span>
                  )}
                </button>
              </form>

              <div className="lp-divider" />
              <p className="lp-help">
                Having trouble?{' '}
                <a href="mailto:admin@pgo.gov.ph">Contact your administrator</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
