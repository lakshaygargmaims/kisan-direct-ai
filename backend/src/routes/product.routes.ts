import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { uploadProductImages } from '../utils/upload';
import { getProductsQuerySchema, createProductSchema, updateProductSchema, productIdParamSchema } from '../validators';

const router = Router();

// Public routes
router.get('/', validate(getProductsQuerySchema, 'query'), (req, res) => productController.getProducts(req, res));
router.get('/:id', validate(productIdParamSchema, 'params'), (req, res) => productController.getProductById(req, res));

// Farmer/FPO routes
router.post('/', authenticate, authorize('FARMER', 'FPO'), validate(createProductSchema, 'body'), (req, res) => productController.createProduct(req, res));
router.put('/:id', authenticate, authorize('FARMER', 'FPO'), validate(productIdParamSchema, 'params'), validate(updateProductSchema, 'body'), (req, res) => productController.updateProduct(req, res));
router.delete('/:id', authenticate, authorize('FARMER', 'FPO'), validate(productIdParamSchema, 'params'), (req, res) => productController.deleteProduct(req, res));

// Image upload routes
router.post('/:id/images', authenticate, authorize('FARMER', 'FPO'), (req, res, next) => {
  uploadProductImages(req, res, (err) => {
    if (err) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    next();
  });
}, (req, res) => productController.uploadImages(req, res));

router.delete('/:id/images/:imageId', authenticate, authorize('FARMER', 'FPO'), (req, res) => productController.deleteImage(req, res));

export default router;
