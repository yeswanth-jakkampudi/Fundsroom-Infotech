import { Router } from 'express';
import { getMe, login } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// Login for API testing
router.post('/login', login);

// Login/Register is handled by Supabase Auth on the frontend
// This endpoint just returns the authenticated user's info
router.get('/me', authenticateToken, getMe);

export default router;
