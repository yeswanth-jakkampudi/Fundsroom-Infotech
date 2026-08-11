import { Router } from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  getStockMovements
} from '../controllers/productController';
import { authenticateToken, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.post('/', authorizeRoles('Admin', 'Warehouse'), createProduct);
router.get('/', getProducts);
router.get('/movements', getStockMovements);
router.get('/:id', getProductById);
router.put('/:id', authorizeRoles('Admin', 'Warehouse'), updateProduct);

export default router;
