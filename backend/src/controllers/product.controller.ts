import { Request, Response } from 'express';
import { productService } from '../services/product.service';
import { AuthRequest } from '../types';

export class ProductController {
  async getProducts(req: Request, res: Response) {
    try {
      const result = await productService.getProducts({
        search: req.query.search as string,
        category: req.query.category as string,
        minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
        organic: req.query.organic === 'true' ? true : undefined,
        city: req.query.city as string,
        lat: req.query.lat ? Number(req.query.lat) : undefined,
        lng: req.query.lng ? Number(req.query.lng) : undefined,
        radius: req.query.radius ? Number(req.query.radius) : undefined,
        sortBy: req.query.sortBy as string,
        farmerId: req.query.farmerId as string,
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  async createProduct(req: AuthRequest, res: Response) {
    try {
      const product = await productService.createProduct(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const product = await productService.updateProduct(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: product });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      await productService.deleteProduct(req.params.id, req.user!.userId);
      res.json({ success: true, message: 'Product deactivated' });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const productController = new ProductController();
