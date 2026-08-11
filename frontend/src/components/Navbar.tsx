import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Clock } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user } = useAuth();
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="top-navbar">
      <div className="navbar-left">
        <span className="current-date">
          <Clock size={15} color="#94a3b8" />
          {currentDate}
        </span>
      </div>

      <div className="navbar-right">
        {user && (
          <div className="active-user-badge">
            <UserCheck size={16} color="#14b8a6" />
            <span>Logged in as <strong>{user.name}</strong></span>
            <span className="badge badge-role">{user.role}</span>
          </div>
        )}
      </div>

      <style>{`
        .top-navbar {
          height: 60px;
          background: rgba(30, 41, 59, 0.6);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
        }
        .current-date {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .active-user-badge {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: rgba(15, 23, 42, 0.5);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.85rem;
          color: #cbd5e1;
        }
      `}</style>
    </header>
  );
};
