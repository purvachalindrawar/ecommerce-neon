const { Router } = require('express');
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { slugify } = require('../lib/slugify');
const {
  idSchema,
  productCreateSchema,
  productUpdateSchema,
  productReplaceImagesSchema,
  productReplaceVariantsSchema
} = require('./admin.catalog.schemas');

const router = Router();

// CREATE product with images & variants (transaction)
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = productCreateSchema.parse(req.body);
    const slug = body.slug ? slugify(body.slug) : slugify(body.title);

    const clash = await prisma.product.findUnique({ where: { slug } });
    if (clash) return res.status(409).json({ error: 'Product slug already exists' });

    if (body.categoryId) {
      const c = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!c) return res.status(400).json({ error: 'categoryId invalid' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          title: body.title,
          slug,
          description: body.description ?? null,
          brand: body.brand ?? null,
          status: body.status ?? 'DRAFT',
          categoryId: body.categoryId ?? null
        }
      });

      if (body.images?.length) {
        await tx.productImage.createMany({
          data: body.images.map(img => ({
            productId: product.id,
            url: img.url,
            alt: img.alt ?? null,
            isPrimary: !!img.isPrimary,
            position: img.position ?? 0
          }))
        });
      }

      await tx.variant.createMany({
        data: body.variants.map(v => ({
          productId: product.id,
          sku: v.sku,
          title: v.title ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stock: v.stock ?? 0,
          attributes: v.attributes ?? undefined
        }))
      });

      const full = await tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, variants: true, category: true }
      });
      return full;
    });

    res.status(201).json({ product: result });
  } catch (e) { next(e); }
});

// LIST (basic pagination)
router.get('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '10', 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: { images: true, variants: true, category: true }
      }),
      prisma.product.count()
    ]);

    res.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
  } catch (e) { next(e); }
});

// READ
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const product = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true, category: true }
    });
    if (!product) return res.status(404).json({ error: 'Not found' });
    res.json({ product });
  } catch (e) { next(e); }
});

// UPDATE (core fields only)
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const body = productUpdateSchema.parse(req.body);

    // slug uniqueness
    let slug = undefined;
    if (body.slug) {
      slug = slugify(body.slug);
      const clash = await prisma.product.findUnique({ where: { slug } });
      if (clash && clash.id !== id) return res.status(409).json({ error: 'Product slug already exists' });
    }

    if (body.categoryId) {
      const c = await prisma.category.findUnique({ where: { id: body.categoryId } });
      if (!c) return res.status(400).json({ error: 'categoryId invalid' });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        slug,
        description: body.description ?? undefined,
        brand: body.brand ?? undefined,
        status: body.status ?? undefined,
        categoryId: body.categoryId ?? undefined
      },
      include: { images: true, variants: true, category: true }
    });

    res.json({ product: updated });
  } catch (e) { next(e); }
});

// REPLACE IMAGES (delete all then create)
router.post('/:id/images', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const { images } = require('./admin.catalog.schemas').productReplaceImagesSchema.parse(req.body);

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Product not found' });

    await prisma.$transaction([
      prisma.productImage.deleteMany({ where: { productId: id } }),
      prisma.productImage.createMany({
        data: images.map(img => ({
          productId: id,
          url: img.url,
          alt: img.alt ?? null,
          isPrimary: !!img.isPrimary,
          position: img.position ?? 0
        }))
      })
    ]);

    const full = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true }
    });
    res.json({ product: full });
  } catch (e) { next(e); }
});

// REPLACE VARIANTS (delete all then create)
router.post('/:id/variants', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const { variants } = require('./admin.catalog.schemas').productReplaceVariantsSchema.parse(req.body);

    const exists = await prisma.product.findUnique({ where: { id } });
    if (!exists) return res.status(404).json({ error: 'Product not found' });

    await prisma.$transaction([
      prisma.variant.deleteMany({ where: { productId: id } }),
      prisma.variant.createMany({
        data: variants.map(v => ({
          productId: id,
          sku: v.sku,
          title: v.title ?? null,
          price: v.price,
          compareAtPrice: v.compareAtPrice ?? null,
          stock: v.stock ?? 0,
          attributes: v.attributes ?? undefined
        }))
      })
    ]);

    const full = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true }
    });
    res.json({ product: full });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    await prisma.product.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
