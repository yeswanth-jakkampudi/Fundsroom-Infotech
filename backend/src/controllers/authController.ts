import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { supabase } from '../config/supabase';

/**
 * GET /auth/me
 * Returns the currently authenticated user's info extracted from Supabase token
 */
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    return res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /auth/login
 * Allows testing clients (like Postman or scripts) to login via API and get a token
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error || !data.session) {
      return res.status(401).json({ success: false, message: error?.message || 'Login failed' });
    }

    return res.status(200).json({
      success: true,
      token: data.session.access_token,
      user: {
        email: data.user.email,
        role: data.user.user_metadata?.role || 'Sales'
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
