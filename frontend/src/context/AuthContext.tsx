import React, { createContext, useContext, useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string, role: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Listen to Supabase auth state changes
  useEffect(() => {
    // Get current session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Map Supabase user object → our User type
   */
  const mapSupabaseUser = (supabaseUser: any): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.name || supabaseUser.email || '',
    role: (supabaseUser.user_metadata?.role || 'Sales') as UserRole,
  });

  /**
   * Login with email + password via Supabase Auth
   * Validates that selected role matches the user's registered role
   */
  const login = async (email: string, password: string, role: string): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }

    if (!data.user) {
      throw new Error('Login failed. No user returned.');
    }

    const userRole = data.user.user_metadata?.role;

    // Validate role matches
    if (role && userRole && userRole !== role) {
      await supabase.auth.signOut();
      throw new Error(`Access denied. This account is registered as "${userRole}", not "${role}".`);
    }

    const mappedUser = mapSupabaseUser(data.user);
    setUser(mappedUser);
    setSession(data.session);

    // Store token for backend API calls
    if (data.session?.access_token) {
      localStorage.setItem('erp_token', data.session.access_token);
    }

    return mappedUser;
  };

  /**
   * Register a new user with Supabase Auth
   * Stores name and role in user_metadata
   */
  const register = async (name: string, email: string, password: string, role: string): Promise<void> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        }
      }
    });

    if (error) {
      throw new Error(error.message || 'Registration failed.');
    }

    if (!data.user) {
      throw new Error('Registration failed. Please try again.');
    }

    // Store token if auto-confirmed (no email verification needed)
    if (data.session?.access_token) {
      localStorage.setItem('erp_token', data.session.access_token);
    }
  };

  /**
   * Logout - clears Supabase session and local storage
   */
  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('erp_token');
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
