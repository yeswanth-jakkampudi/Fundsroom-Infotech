import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';

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
