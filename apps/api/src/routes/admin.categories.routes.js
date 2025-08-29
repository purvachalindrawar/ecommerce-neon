const { Router } = require('express');
const { prisma } = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');
const { slugify } = require('../lib/slugify');
const {
  idSchema,
  categoryCreateSchema,
  categoryUpdateSchema
} = require('./admin.catalog.schemas');

const router = Router();

// CREATE
router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = categoryCreateSchema.parse(req.body);
    const slug = body.slug ? slugify(body.slug) : slugify(body.name);

    const exists = await prisma.category.findUnique({ where: { slug } });
    if (exists) return res.status(409).json({ error: 'Category slug already exists' });

    if (body.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: body.parentId } });
      if (!parent) return res.status(400).json({ error: 'parentId invalid' });
    }

    const created = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        parentId: body.parentId ?? null
      }
    });
    res.status(201).json({ category: created });
  } catch (e) { next(e); }
});

// LIST
router.get('/', requireAuth, requireAdmin, async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ createdAt: 'desc' }]
    });
    res.json({ categories });
  } catch (e) { next(e); }
});

// READ
router.get('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json({ category });
  } catch (e) { next(e); }
});

// UPDATE
router.put('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    const body = categoryUpdateSchema.parse(req.body);

    // slug uniqueness
    let slug = undefined;
    if (body.slug) {
      slug = slugify(body.slug);
      const clash = await prisma.category.findUnique({ where: { slug } });
      if (clash && clash.id !== id) {
        return res.status(409).json({ error: 'Category slug already exists' });
      }
    }

    if (body.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: body.parentId } });
      if (!parent) return res.status(400).json({ error: 'parentId invalid' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        slug,
        description: body.description ?? undefined,
        parentId: body.parentId ?? undefined
      }
    });
    res.json({ category: updated });
  } catch (e) { next(e); }
});

// DELETE
router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = idSchema.parse(req.params.id);
    await prisma.category.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

module.exports = router;
