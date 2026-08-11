import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, LogIn, Key, Mail, AlertCircle,
  ChevronDown, UserCog, UserPlus, User
} from 'lucide-react';
import { UserRole } from '../types';

type Tab = 'login' | 'register';
type RoleOption = { value: UserRole; label: string; emoji: string; email: string; color: string };

const ROLES: RoleOption[] = [
  { value: 'Admin',     label: 'Admin',           emoji: '👑', email: 'admin@test.com',     color: '#6366f1' },
  { value: 'Sales',     label: 'Sales Executive', emoji: '💼', email: 'sales@test.com',     color: '#14b8a6' },
  { value: 'Warehouse', label: 'Warehouse',        emoji: '📦', email: 'warehouse@test.com', color: '#f59e0b' },
  { value: 'Accounts',  label: 'Accounts',         emoji: '💳', email: 'accounts@test.com',  color: '#a855f7' },
];

const ROLE_DASHBOARD: Record<UserRole, string> = {
  Admin:     '/admin/dashboard',
  Sales:     '/sales/dashboard',
  Warehouse: '/warehouse/dashboard',
  Accounts:  '/accounts/dashboard',
};

export const Login: React.FC = () => {
  const [tab, setTab]           = useState<Tab>('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [role, setRole]         = useState<UserRole | ''>('');
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setName('');
    setRole('');
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    resetForm();
  };

  // ---- LOGIN ----
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!role) { setError('Please select your role.'); return; }
    setIsSubmitting(true);
    try {
      const loggedUser = await login(email, password, role);
      navigate(ROLE_DASHBOARD[loggedUser.role as UserRole] || '/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---- REGISTER ----
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!role) { setError('Please select your role.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setIsSubmitting(true);
    try {
      await register(name, email, password, role);
      setSuccess('✅ Account created! You can now sign in with your credentials.');
      setTimeout(() => switchTab('login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickLogin = (r: RoleOption) => {
    setEmail(r.email);
    setPassword('Password@123');
    setRole(r.value);
    setError(null);
  };

  const selectedRole = ROLES.find((r) => r.value === role);

  return (
    <div className="login-wrapper">
      <div className="login-card glass-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <ShieldCheck size={36} color="#6366f1" />
          </div>
          <h2>Nexus ERP &amp; CRM</h2>
          <p>Enterprise Management Platform</p>
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            id="tab-login"
            className={`login-tab ${tab === 'login' ? 'active' : ''}`}
            onClick={() => switchTab('login')}
          >
            <LogIn size={15} /> Sign In
          </button>
          <button
            id="tab-register"
            className={`login-tab ${tab === 'register' ? 'active' : ''}`}
            onClick={() => switchTab('register')}
          >
            <UserPlus size={15} /> Register
          </button>
        </div>

        {/* Alert */}
        {error && (
          <div className="alert alert-danger" role="alert">
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            <span>{success}</span>
          </div>
        )}

        {/* ===== LOGIN FORM ===== */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} id="login-form">
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={17} />
                <input id="login-email" type="email" className="form-control with-icon"
                  placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <div className="input-icon-wrapper">
                <Key className="input-icon" size={17} />
                <input id="login-password" type="password" className="form-control with-icon"
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-role">Select Role</label>
              <div className="input-icon-wrapper">
                <UserCog className="input-icon" size={17} />
                <select id="login-role" className="form-control with-icon select-control"
                  value={role} onChange={(e) => { setRole(e.target.value as UserRole); setError(null); }} required>
                  <option value="">— Select your role —</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={15} />
              </div>
              {selectedRole && (
                <div className="role-badge-row">
                  <span className="role-badge" style={{ borderColor: selectedRole.color, color: selectedRole.color }}>
                    {selectedRole.emoji} Will open {selectedRole.value} Dashboard
                  </span>
                </div>
              )}
            </div>

            <button type="submit" id="login-submit" className="btn btn-primary login-btn" disabled={isSubmitting}>
              <LogIn size={17} />
              <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>
        )}

        {/* ===== REGISTER FORM ===== */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} id="register-form">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div className="input-icon-wrapper">
                <User className="input-icon" size={17} />
                <input id="reg-name" type="text" className="form-control with-icon"
                  placeholder="John Doe" value={name}
                  onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail className="input-icon" size={17} />
                <input id="reg-email" type="email" className="form-control with-icon"
                  placeholder="your@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="input-icon-wrapper">
                <Key className="input-icon" size={17} />
                <input id="reg-password" type="password" className="form-control with-icon"
                  placeholder="Min. 6 characters" value={password}
                  onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-role">Your Role</label>
              <div className="input-icon-wrapper">
                <UserCog className="input-icon" size={17} />
                <select id="reg-role" className="form-control with-icon select-control"
                  value={role} onChange={(e) => { setRole(e.target.value as UserRole); setError(null); }} required>
                  <option value="">— Select your role —</option>
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                  ))}
                </select>
                <ChevronDown className="select-arrow" size={15} />
              </div>
            </div>

            <button type="submit" id="register-submit" className="btn btn-primary login-btn" disabled={isSubmitting}
              style={{ background: 'linear-gradient(135deg, #14b8a6, #0891b2)' }}>
              <UserPlus size={17} />
              <span>{isSubmitting ? 'Creating Account...' : 'Create Account'}</span>
            </button>

            <p className="register-note">
              Your account will be stored securely in Supabase. Once registered, sign in with your credentials.
            </p>
          </form>
        )}

        {/* Quick Demo Logins (Login tab only) */}
        {tab === 'login' && (
          <div className="quick-demo-section">
            <span className="demo-title">⚡ Quick Demo Logins</span>
            <div className="demo-grid">
              {ROLES.map((r) => (
                <button key={r.value} type="button" id={`demo-${r.value.toLowerCase()}`}
                  className="demo-chip" style={{ '--role-color': r.color } as React.CSSProperties}
                  onClick={() => fillQuickLogin(r)}>
                  <span>{r.emoji}</span><span>{r.value}</span>
                </button>
              ))}
            </div>
            <p className="demo-hint">Demo password: <code>Password@123</code></p>
          </div>
        )}
      </div>

      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 20% 30%, rgba(99,102,241,0.15) 0%, transparent 55%),
                      radial-gradient(ellipse at 80% 70%, rgba(168,85,247,0.1) 0%, transparent 55%), #0f172a;
          padding: 1.5rem;
        }
        .login-card {
          width: 100%; max-width: 460px; padding: 2.2rem;
          animation: slideUp 0.4s cubic-bezier(.22,.68,0,1.2);
        }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .login-header { text-align: center; margin-bottom: 1.5rem; }
        .login-logo {
          width: 58px; height: 58px; border-radius: 16px;
          background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.85rem; box-shadow: 0 0 20px rgba(99,102,241,0.15);
        }
        .login-header h2 { font-size: 1.55rem; font-weight: 800; color: #fff; }
        .login-header p { color: #64748b; font-size: 0.85rem; margin-top: 0.2rem; }

        /* Tabs */
        .login-tabs {
          display: flex; background: rgba(15,23,42,0.6); border-radius: 10px;
          padding: 4px; margin-bottom: 1.5rem; gap: 4px;
          border: 1px solid rgba(255,255,255,0.06);
        }
        .login-tab {
          flex: 1; padding: 0.55rem; border-radius: 7px;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          font-size: 0.85rem; font-weight: 600; color: #64748b;
          background: transparent; transition: all 0.2s ease;
        }
        .login-tab:hover { color: #94a3b8; }
        .login-tab.active {
          background: rgba(99,102,241,0.2); color: #a5b4fc;
          border: 1px solid rgba(99,102,241,0.3);
        }

        /* Alerts */
        .alert-success {
          display: flex; gap: 0.5rem; align-items: center;
          padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem;
          background: rgba(20,184,166,0.1); border: 1px solid rgba(20,184,166,0.3);
          color: #5eead4; font-size: 0.875rem;
        }

        /* Input */
        .input-icon-wrapper { position: relative; }
        .input-icon { position: absolute; left: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; z-index:1; }
        .form-control.with-icon { padding-left: 2.5rem; }
        .select-control { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 2.5rem; }
        .select-arrow { position: absolute; right: 0.85rem; top: 50%; transform: translateY(-50%); color: #64748b; pointer-events: none; }

        /* Role badge */
        .role-badge-row { margin-top: 0.45rem; }
        .role-badge { font-size: 0.72rem; font-weight: 600; padding: 0.18rem 0.65rem; border-radius: 20px; border: 1px solid; background: transparent; }

        /* Button */
        .login-btn { width: 100%; justify-content: center; margin-top: 0.75rem; padding: 0.82rem; font-size: 0.95rem; font-weight: 700; }

        /* Register note */
        .register-note { margin-top: 0.85rem; font-size: 0.75rem; color: #64748b; text-align: center; line-height: 1.5; }

        /* Quick demo */
        .quick-demo-section { margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
        .demo-title { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; display: block; margin-bottom: 0.65rem; }
        .demo-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 0.45rem; margin-bottom: 0.65rem; }
        .demo-chip {
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          padding: 0.5rem 0.7rem; background: rgba(30,41,59,0.8);
          border: 1px solid rgba(255,255,255,0.07); border-radius: 8px;
          color: #94a3b8; font-size: 0.8rem; font-weight: 600;
          transition: all 0.2s ease; cursor: pointer;
        }
        .demo-chip:hover { border-color: var(--role-color); color: #fff; transform: translateY(-1px); }
        .demo-hint { font-size: 0.73rem; color: #64748b; margin: 0; }
        .demo-hint code { background: rgba(99,102,241,0.15); color: #a5b4fc; padding: 0.1rem 0.4rem; border-radius: 4px; font-family: monospace; }
      `}</style>
    </div>
  );
};
