import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addFollowUp
} from '../controllers/customerController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('Admin', 'Sales'), createCustomer);
router.get('/', getCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', authorizeRoles('Admin', 'Sales'), updateCustomer);
router.post('/:id/followups', authorizeRoles('Admin', 'Sales'), addFollowUp);

export default router;
