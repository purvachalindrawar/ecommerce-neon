const { z } = require('zod');

const idSchema = z.string().min(1);

const categoryCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable()
});

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  parentId: z.string().optional().nullable()
});

const imageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  isPrimary: z.boolean().optional().default(false),
  position: z.number().int().nonnegative().optional().default(0)
});

const variantSchema = z.object({
  sku: z.string().min(1),
  title: z.string().optional(),
  price: z.union([z.number(), z.string()]), // allow "1999.00" or 1999
  compareAtPrice: z.union([z.number(), z.string()]).optional(),
  stock: z.number().int().nonnegative().default(0),
  attributes: z.any().optional()
});

const productCreateSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional().nullable(),
  images: z.array(imageSchema).optional().default([]),
  variants: z.array(variantSchema).min(1, 'At least one variant is required')
});

const productUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().optional().nullable()
});

const productReplaceImagesSchema = z.object({
  images: z.array(imageSchema).default([])
});

const productReplaceVariantsSchema = z.object({
  variants: z.array(variantSchema).default([])
});

module.exports = {
  idSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  productCreateSchema,
  productUpdateSchema,
  productReplaceImagesSchema,
  productReplaceVariantsSchema
};
