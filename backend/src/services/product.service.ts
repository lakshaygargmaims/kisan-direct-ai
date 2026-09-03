import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma';

export class ProductService {
  async getProducts(params: {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    organic?: boolean;
    city?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    sortBy?: string;
    farmerId?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      search, category, minPrice, maxPrice, organic, city,
      lat, lng, radius = 50, sortBy = 'nearest', farmerId, page = 1, limit = 20
    } = params;

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      availableQuantity: { gt: 0 },
    };

    if (farmerId) {
      where.farmerId = farmerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { category: { name: { contains: search } } },
        { farmer: { name: { contains: search } } },
      ];
    }

    if (category) {
      where.category = { name: { contains: category } };
    }

    if (minPrice || maxPrice) {
      where.pricePerKg = {};
      if (minPrice) where.pricePerKg.gte = minPrice;
      if (maxPrice) where.pricePerKg.lte = maxPrice;
    }

    if (organic !== undefined) {
      where.organicCertified = organic;
    }

    const offset = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          farmer: {
            select: { name: true, id: true, email: true },
          },
          images: true,
          deliveryRule: true,
        },
        skip: offset,
        take: limit,
        orderBy: sortBy === 'cheapest' ? { pricePerKg: 'asc' }
          : sortBy === 'best_rated' ? { avgRating: 'desc' }
          : sortBy === 'newest' ? { createdAt: 'desc' }
          : { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate distances if location provided (distance computed in frontend for demo)
    let productsWithDistance = products.map((p: any) => {
      return { ...p, distance: null };
    });

    // Sort by distance if requested
    if (sortBy === 'nearest' && lat && lng) {
      productsWithDistance.sort((a: any, b: any) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return {
      products: productsWithDistance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        farmer: {
          select: { name: true, id: true, email: true },
        },
        images: true,
        deliveryRule: true,
        reviews: {
          include: { reviewer: { select: { name: true, id: true } } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) throw new Error('Product not found');
    return product;
  }

  async createProduct(farmerId: string, data: any) {
    // Resolve categoryId — frontend may send a category name like "Vegetables" instead of a cuid
    let categoryId = data.categoryId;
    if (categoryId && !categoryId.startsWith('cl')) {
      // Looks like a category name, not a cuid — look it up
      const cat = await prisma.productCategory.findFirst({ where: { name: categoryId } });
      if (cat) categoryId = cat.id;
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        pricePerKg: data.pricePerKg,
        unit: data.unit || 'kg',
        availableQuantity: data.availableQuantity,
        minOrderQuantity: data.minOrderQuantity || 1,
        qualityGrade: data.qualityGrade || 'A',
        organicCertified: data.organicCertified || false,
        harvestDate: data.harvestDate ? new Date(data.harvestDate) : undefined,
        shelfLife: data.shelfLife,
        storageRequirement: data.storageRequirement,
        coldChainRequired: data.coldChainRequired || false,
        farmerId,
        categoryId: categoryId || undefined,
        isActive: true,
        avgRating: 0,
        totalSold: 0,
      },
    });

    // Create delivery rule if provided
    if (data.deliveryRule) {
      await prisma.productDeliveryRule.create({
        data: {
          productId: product.id,
          deliveryMode: data.deliveryRule.deliveryMode || 'PLATFORM',
          maxDeliveryRadiusKm: data.deliveryRule.maxDeliveryRadiusKm || 50,
          interstateAllowed: data.deliveryRule.interstateAllowed || false,
          coldChainRequired: data.deliveryRule.coldChainRequired || false,
          maximumTransitHours: data.deliveryRule.maximumTransitHours || 24,
          sameDayRequired: data.deliveryRule.sameDayRequired || false,
        },
      });
    }

    return product;
  }

  async updateProduct(id: string, farmerId: string, data: any) {
    const existing = await prisma.product.findFirst({ where: { id, farmerId } });
    if (!existing) throw new Error('Product not found or unauthorized');

    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async deleteProduct(id: string, farmerId: string) {
    const existing = await prisma.product.findFirst({ where: { id, farmerId } });
    if (!existing) throw new Error('Product not found or unauthorized');

    return prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async uploadImages(productId: string, farmerId: string, files: Express.Multer.File[]) {
    const existing = await prisma.product.findFirst({ where: { id: productId, farmerId } });
    if (!existing) throw new Error('Product not found or unauthorized');

    // Get current image count to determine if first image should be primary
    const currentImageCount = await prisma.productImage.count({ where: { productId } });

    const images = await Promise.all(
      files.map((file, index) =>
        prisma.productImage.create({
          data: {
            productId,
            url: `/uploads/products/${file.filename}`,
            isPrimary: currentImageCount === 0 && index === 0,
          },
        })
      )
    );

    return images;
  }

  async deleteImage(imageId: string, farmerId: string) {
    const image = await prisma.productImage.findUnique({
      where: { id: imageId },
      include: { product: true },
    });

    if (!image || image.product.farmerId !== farmerId) {
      throw new Error('Image not found or unauthorized');
    }

    await prisma.productImage.delete({ where: { id: imageId } });

    // If deleted image was primary, make the next image primary
    if (image.isPrimary) {
      const nextImage = await prisma.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { id: 'asc' },
      });
      if (nextImage) {
        await prisma.productImage.update({
          where: { id: nextImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return { success: true };
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}

export const productService = new ProductService();
