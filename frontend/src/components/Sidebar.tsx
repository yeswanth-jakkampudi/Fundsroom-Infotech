import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  FilePlus2,
  FileText,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

type NavItem = { label: string; path: string; icon: React.ElementType; roles: UserRole[] | 'all' };

const ALL_NAV: NavItem[] = [
  { label: 'Dashboard',       path: '/',              icon: LayoutDashboard, roles: 'all' },
  { label: 'Customers CRM',   path: '/customers',     icon: Users,           roles: ['Admin', 'Sales'] },
  { label: 'Products & Stock',path: '/products',      icon: Package,         roles: ['Admin', 'Warehouse'] },
  { label: 'Create Challan',  path: '/challans/new',  icon: FilePlus2,       roles: ['Admin', 'Sales'] },
  { label: 'Sales Challans',  path: '/challans',      icon: FileText,        roles: ['Admin', 'Sales', 'Accounts'] },
];

const ROLE_DASHBOARD: Record<UserRole, string> = {
  Admin:     '/admin/dashboard',
  Sales:     '/sales/dashboard',
  Warehouse: '/warehouse/dashboard',
  Accounts:  '/accounts/dashboard',
};

const ROLE_COLORS: Record<UserRole, string> = {
  Admin:     '#6366f1',
  Sales:     '#14b8a6',
  Warehouse: '#f59e0b',
  Accounts:  '#a855f7',
};

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const role = user?.role as UserRole | undefined;

  const dashPath = role ? ROLE_DASHBOARD[role] : '/';
  const roleColor = role ? ROLE_COLORS[role] : '#6366f1';

  const visibleNav = ALL_NAV.map((item) => {
    if (item.path === '/' && role) {
      return { ...item, path: dashPath };
    }
    return item;
  }).filter((item) => {
    if (!role) return true;
    if (item.roles === 'all') return true;
    return (item.roles as UserRole[]).includes(role);
  });

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">
          <ShieldCheck size={26} color={roleColor} />
        </div>
        <div>
          <h1 className="brand-title">Nexus ERP</h1>
          <span className="brand-subtitle">Enterprise CRM & Sales</span>
        </div>
      </div>

      {/* Role Badge */}
      {role && (
        <div className="role-indicator" style={{ borderColor: `${roleColor}40`, background: `${roleColor}12` }}>
          <span style={{ color: roleColor, fontWeight: 700, fontSize: '0.8rem' }}>{role} Portal</span>
        </div>
      )}

      <nav className="sidebar-nav">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === dashPath}
              style={({ isActive }) => isActive ? { '--active-color': roleColor } as React.CSSProperties : {}}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {user && (
        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar" style={{ background: `linear-gradient(135deg, ${roleColor}, ${roleColor}99)` }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="badge badge-role" style={{ borderColor: `${roleColor}50`, color: roleColor }}>{user.role}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      )}

      <style>{`
        .sidebar {
          width: 260px;
          background: #1e293b;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          flex-shrink: 0;
        }
        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
          margin-bottom: 0.75rem;
        }
        .brand-logo {
          width: 40px; height: 40px;
          border-radius: 10px;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .brand-title { font-size: 1.15rem; font-weight: 800; line-height: 1.1; color: #fff; }
        .brand-subtitle { font-size: 0.68rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
        .role-indicator {
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: 1px solid;
          margin-bottom: 1rem;
          text-align: center;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          font-size: 0.72rem;
        }
        .sidebar-nav { display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
        .nav-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.7rem 0.9rem; border-radius: 8px;
          color: #94a3b8; font-size: 0.875rem; font-weight: 500;
          transition: all 0.18s ease;
          text-decoration: none;
        }
        .nav-link:hover { color: #f8fafc; background: rgba(255,255,255,0.04); }
        .nav-link.active {
          color: #fff;
          background: linear-gradient(135deg, rgba(var(--active-rgb, 99,102,241), 0.22) 0%, rgba(var(--active-rgb, 99,102,241), 0.1) 100%);
          border: 1px solid rgba(var(--active-rgb, 99,102,241), 0.35);
          background: color-mix(in srgb, var(--active-color, #6366f1) 20%, transparent);
          border-color: color-mix(in srgb, var(--active-color, #6366f1) 40%, transparent);
          font-weight: 600;
        }
        .sidebar-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.07);
          margin-top: 0.5rem;
        }
        .user-profile { display: flex; align-items: center; gap: 0.6rem; overflow: hidden; }
        .user-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          color: #fff; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.88rem; flex-shrink: 0;
        }
        .user-info { display: flex; flex-direction: column; min-width: 0; }
        .user-name { font-size: 0.83rem; font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .logout-btn {
          background: transparent; color: #64748b; padding: 0.4rem; border-radius: 6px;
          transition: color 0.2s, background 0.2s;
        }
        .logout-btn:hover { color: #f43f5e; background: rgba(244,63,94,0.1); }
        .badge-role {
          font-size: 0.65rem; font-weight: 700;
          padding: 0.15rem 0.5rem; border-radius: 6px;
          border: 1px solid; background: transparent;
          text-transform: uppercase; letter-spacing: 0.04em;
        }
      `}</style>
    </aside>
  );
};
