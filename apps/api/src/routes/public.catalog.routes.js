const { Router } = require('express');
const { prisma } = require('../lib/prisma');

const router = Router();

// Simple public list with pagination and optional search (title/brand)
router.get('/products', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize || '12', 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where = q
      ? {
          AND: [
            { status: 'PUBLISHED' },
            { OR: [{ title: { contains: q, mode: 'insensitive' } }, { brand: { contains: q, mode: 'insensitive' } }] }
          ]
        }
      : { status: 'PUBLISHED' };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: pageSize,
        include: { images: true, variants: true, category: true }
      }),
      prisma.product.count({ where })
    ]);

    res.json({ items, page, pageSize, total, pages: Math.ceil(total / pageSize) });
  } catch (e) { next(e); }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { images: true, variants: true, category: true }
    });
    if (!product || product.status !== 'PUBLISHED') {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json({ product });
  } catch (e) { next(e); }
});

router.get('/categories', async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: [{ name: 'asc' }] });
    res.json({ categories });
  } catch (e) { next(e); }
});

module.exports = router;
