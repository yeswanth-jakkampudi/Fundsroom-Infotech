import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import { query } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string | number;
    email: string;
    role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
    name: string;
  };
}

/**
 * Verifies Supabase access token from Authorization header
 * and attaches user info (including role from user_metadata) to req.user
 */
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required. Please log in.' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(403).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    const email = user.email || '';
    const role = (user.user_metadata?.role || 'Sales') as 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
    const name = user.user_metadata?.name || email;

    let localId: string | number = user.id;

    try {
      const dbUser = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (dbUser.rows.length > 0) {
        localId = dbUser.rows[0].id;
      } else {
        const insertRes = await query(
          'INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id',
          [email, 'SUPABASE_SYNCED', role, name]
        );
        localId = insertRes.rows[0].id;
      }
    } catch (dbErr) {
      console.error('Error syncing local user:', dbErr);
    }

    req.user = {
      id: localId,
      email,
      role,
      name
    };

    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Token verification failed.' });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. User authentication required.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' does not have permission to access this resource.`
      });
    }

    next();
  };
};
