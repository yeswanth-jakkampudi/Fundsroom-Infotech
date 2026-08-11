import { Router } from 'express';
import {
  createChallan,
  getChallans,
  getChallanById,
  updateChallanStatus
} from '../controllers/challanController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('Admin', 'Sales', 'Warehouse'), createChallan);
router.get('/', getChallans);
router.get('/:id', getChallanById);
router.put('/:id/status', authorizeRoles('Admin', 'Sales', 'Warehouse', 'Accounts'), updateChallanStatus);

export default router;
