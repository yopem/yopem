import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm"

import { db } from "db"
import {
  assetsTable,
  categoriesTable,
  tagsTable,
  productCategoriesTable,
  productRunsTable,
  productTagsTable,
  productVersionsTable,
  productsTable,
} from "db/schema"
import type { InsertProductVersion } from "db/schema/product-versions"
import type { InsertProduct, SelectProduct } from "db/schema/products"
import { createCustomId } from "utils/custom-id"

import { generateUniqueProductSlug } from "./slug"

export const listProducts = async (input?: {
  limit?: number
  cursor?: string
  search?: string
  categoryIds?: string[]
  status?: "draft" | "active" | "archived" | "all"
  priceFilter?: "all" | "free" | "paid"
  tagIds?: string[]
}): Promise<{
  products: {
    id: string
    slug: string
    name: string
    excerpt: string | null
    description: string | null
    status: "draft" | "active" | "archived"
    costPerRun: string | null
    createdAt: Date | null
    thumbnailId: string | null
    categories: { id: string; name: string; slug: string }[]
    thumbnail: { id: string; url: string } | null
  }[]
  nextCursor?: string
}> => {
  const limit = input?.limit ?? 20
  const conditions = []

  if (input?.status && input.status !== "all") {
    conditions.push(eq(productsTable.status, input.status))
  } else if (!input?.status) {
    conditions.push(eq(productsTable.status, "active"))
  }

  if (input?.categoryIds && input.categoryIds.length > 0) {
    const productsWithAllCategories = await db
      .select({ productId: productCategoriesTable.productId })
      .from(productCategoriesTable)
      .where(inArray(productCategoriesTable.categoryId, input.categoryIds))
      .groupBy(productCategoriesTable.productId)
      .having(
        sql`COUNT(DISTINCT ${productCategoriesTable.categoryId}) = ${input.categoryIds.length}`,
      )

    const productIdsWithAllCategories = productsWithAllCategories.map(
      (t) => t.productId,
    )

    if (productIdsWithAllCategories.length > 0) {
      conditions.push(inArray(productsTable.id, productIdsWithAllCategories))
    } else {
      conditions.push(sql`1 = 0`)
    }
  }

  if (input?.search) {
    conditions.push(
      sql`(${ilike(productsTable.name, `%${input.search}%`).getSQL()} OR ${ilike(productsTable.description, `%${input.search}%`).getSQL()})`,
    )
  }

  if (input?.priceFilter === "free") {
    conditions.push(eq(productsTable.costPerRun, "0"))
  } else if (input?.priceFilter === "paid") {
    conditions.push(sql`${productsTable.costPerRun} > 0`)
  }

  if (input?.tagIds && input.tagIds.length > 0) {
    const productsWithAllTags = await db
      .select({ productId: productTagsTable.productId })
      .from(productTagsTable)
      .where(inArray(productTagsTable.tagId, input.tagIds))
      .groupBy(productTagsTable.productId)
      .having(
        sql`COUNT(DISTINCT ${productTagsTable.tagId}) = ${input.tagIds.length}`,
      )

    const productIdsWithAllTags = productsWithAllTags.map((t) => t.productId)

    if (productIdsWithAllTags.length > 0) {
      conditions.push(inArray(productsTable.id, productIdsWithAllTags))
    } else {
      conditions.push(sql`1 = 0`)
    }
  }

  const products = await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      excerpt: productsTable.excerpt,
      description: productsTable.description,
      status: productsTable.status,
      costPerRun: productsTable.costPerRun,
      createdAt: productsTable.createdAt,
      thumbnailId: productsTable.thumbnailId,
      thumbnailUrl: assetsTable.url,
      thumbnailAssetId: assetsTable.id,
    })
    .from(productsTable)
    .leftJoin(assetsTable, eq(productsTable.thumbnailId, assetsTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(productsTable.createdAt))
    .limit(limit + 1)

  const productIds = products.map((t) => t.id)

  const categoriesMap = new Map<
    string,
    { id: string; name: string; slug: string }[]
  >()
  if (productIds.length > 0) {
    const productCategories = await db
      .select({
        productId: productCategoriesTable.productId,
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(productCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(productCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(inArray(productCategoriesTable.productId, productIds))

    for (const row of productCategories) {
      if (!categoriesMap.has(row.productId)) {
        categoriesMap.set(row.productId, [])
      }
      categoriesMap
        .get(row.productId)!
        .push({ id: row.id, name: row.name, slug: row.slug })
    }
  }

  const productsWithCategories = products.map((product) => {
    const thumbnail =
      product.thumbnailAssetId && product.thumbnailUrl
        ? { id: product.thumbnailAssetId, url: product.thumbnailUrl }
        : null

    const { thumbnailUrl: _, thumbnailAssetId: __, ...productData } = product

    return {
      ...productData,
      categories: categoriesMap.get(product.id) ?? [],
      thumbnail,
    }
  })

  let nextCursor: string | undefined = undefined
  if (productsWithCategories.length > limit) {
    const nextItem = productsWithCategories.pop()
    nextCursor = nextItem?.id
  }

  return { products: productsWithCategories, nextCursor }
}

export const getProductById = async (
  id: string,
): Promise<SelectProduct | null> => {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id))

  if (!product) {
    return null
  }

  const [categoriesResult, tagsResult, thumbnailResult] = await Promise.all([
    db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(productCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(productCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(eq(productCategoriesTable.productId, id)),
    db
      .select({ id: tagsTable.id, name: tagsTable.name, slug: tagsTable.slug })
      .from(productTagsTable)
      .innerJoin(tagsTable, eq(productTagsTable.tagId, tagsTable.id))
      .where(eq(productTagsTable.productId, id)),
    product.thumbnailId
      ? db
          .select({
            id: assetsTable.id,
            url: assetsTable.url,
            originalName: assetsTable.originalName,
          })
          .from(assetsTable)
          .where(eq(assetsTable.id, product.thumbnailId))
      : Promise.resolve([]),
  ])

  return {
    ...product,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
  }
}

export const getProductBySlug = async (
  slug: string,
): Promise<SelectProduct | null> => {
  const product = await db.query.productsTable.findFirst({
    where: eq(productsTable.slug, slug),
  })

  if (!product) {
    return null
  }

  const [categoriesResult, tagsResult, thumbnailResult] = await Promise.all([
    db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(productCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(productCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(eq(productCategoriesTable.productId, product.id)),
    db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        slug: tagsTable.slug,
      })
      .from(productTagsTable)
      .innerJoin(tagsTable, eq(productTagsTable.tagId, tagsTable.id))
      .where(eq(productTagsTable.productId, product.id)),
    product.thumbnailId
      ? db
          .select({
            id: assetsTable.id,
            url: assetsTable.url,
            originalName: assetsTable.originalName,
          })
          .from(assetsTable)
          .where(eq(assetsTable.id, product.thumbnailId))
      : Promise.resolve([]),
  ])

  return {
    ...product,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
  }
}

export type PublicProduct = Omit<
  typeof productsTable.$inferSelect,
  | "apiKeyId"
  | "config"
  | "systemRole"
  | "userInstructionTemplate"
  | "thumbnailId"
  | "createdBy"
> & {
  categories: { id: string; name: string; slug: string }[]
  tags: { id: string; name: string; slug: string }[]
  thumbnail: { id: string; url: string } | null
}

const buildPublicProduct = async (
  product: typeof productsTable.$inferSelect,
): Promise<PublicProduct> => {
  const [categoriesResult, tagsResult, thumbnailResult] = await Promise.all([
    db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
      })
      .from(productCategoriesTable)
      .innerJoin(
        categoriesTable,
        eq(productCategoriesTable.categoryId, categoriesTable.id),
      )
      .where(eq(productCategoriesTable.productId, product.id)),
    db
      .select({
        id: tagsTable.id,
        name: tagsTable.name,
        slug: tagsTable.slug,
      })
      .from(productTagsTable)
      .innerJoin(tagsTable, eq(productTagsTable.tagId, tagsTable.id))
      .where(eq(productTagsTable.productId, product.id)),
    product.thumbnailId
      ? db
          .select({
            id: assetsTable.id,
            url: assetsTable.url,
          })
          .from(assetsTable)
          .where(eq(assetsTable.id, product.thumbnailId))
      : Promise.resolve([]),
  ])

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    descriptionContent: product.descriptionContent,
    excerpt: product.excerpt,
    isPublic: product.isPublic,
    costPerRun: product.costPerRun,
    markup: product.markup,
    status: product.status,
    categories: categoriesResult,
    tags: tagsResult,
    thumbnail: thumbnailResult[0] ?? null,
    outputFormat: product.outputFormat,
    inputVariable: product.inputVariable,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export const getPublicProductById = async (
  id: string,
): Promise<PublicProduct | null> => {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.id, id), eq(productsTable.status, "active")))

  if (!product) {
    return null
  }

  return buildPublicProduct(product)
}

export const getPublicProductBySlug = async (
  slug: string,
): Promise<PublicProduct | null> => {
  const product = await db.query.productsTable.findFirst({
    where: and(
      eq(productsTable.slug, slug),
      eq(productsTable.status, "active"),
    ),
  })

  if (!product) {
    return null
  }

  return buildPublicProduct(product)
}

export const createProduct = async (
  data: Omit<InsertProduct, "id" | "slug"> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
): Promise<{ id: string; slug: string } | null> => {
  const { categoryIds, tagIds, ...productData } = data
  const id = createCustomId()
  const slug = await generateUniqueProductSlug(productData.name)

  const [result] = await db
    .insert(productsTable)
    .values({ ...productData, id, slug })
    .returning()

  if (!result) {
    return null
  }

  if (categoryIds && categoryIds.length > 0) {
    await db
      .insert(productCategoriesTable)
      .values(categoryIds.map((categoryId) => ({ productId: id, categoryId })))
  }

  if (tagIds && tagIds.length > 0) {
    await db
      .insert(productTagsTable)
      .values(tagIds.map((tagId) => ({ productId: id, tagId })))
  }

  return { id, slug }
}

export const updateProduct = async (
  id: string,
  data: Partial<InsertProduct> & {
    categoryIds?: string[]
    tagIds?: string[]
  },
): Promise<{ success: boolean } | null> => {
  const { categoryIds, tagIds, ...productData } = data

  let slug: string | undefined
  if (productData.name) {
    const [existingProduct] = await db
      .select({ name: productsTable.name })
      .from(productsTable)
      .where(eq(productsTable.id, id))

    if (!existingProduct) {
      return null
    }

    if (existingProduct.name !== productData.name) {
      slug = await generateUniqueProductSlug(productData.name)
    }
  }

  const [result] = await db
    .update(productsTable)
    .set({
      ...productData,
      ...(slug ? { slug } : {}),
      ...(productData.thumbnailId !== undefined
        ? { thumbnailId: productData.thumbnailId }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(productsTable.id, id))
    .returning()

  if (!result) {
    return null
  }

  if (categoryIds !== undefined) {
    await db
      .delete(productCategoriesTable)
      .where(eq(productCategoriesTable.productId, id))

    if (categoryIds.length > 0) {
      await db
        .insert(productCategoriesTable)
        .values(
          categoryIds.map((categoryId) => ({ productId: id, categoryId })),
        )
    }
  }

  if (tagIds !== undefined) {
    await db.delete(productTagsTable).where(eq(productTagsTable.productId, id))

    if (tagIds.length > 0) {
      await db
        .insert(productTagsTable)
        .values(tagIds.map((tagId) => ({ productId: id, tagId })))
    }
  }

  return { success: true }
}

export const deleteProduct = async (id: string): Promise<boolean> => {
  const [result] = await db
    .delete(productsTable)
    .where(eq(productsTable.id, id))
    .returning()

  return !!result
}

export const duplicateProduct = async (
  sourceId: string,
  createdBy: string,
): Promise<{ id: string } | null> => {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, sourceId))

  if (!product) {
    return null
  }

  const newId = createCustomId()
  const duplicateName = `${product.name} (Copy)`
  const slug = await generateUniqueProductSlug(duplicateName)

  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    slug: _slug,
    ...productData
  } = product

  const [result] = await db
    .insert(productsTable)
    .values({
      ...productData,
      id: newId,
      name: duplicateName,
      slug,
      createdBy,
      status: "draft",
    })
    .returning()

  if (!result) {
    return null
  }

  return { id: newId }
}

export const updateProductStatus = async (
  ids: string[],
  status: "draft" | "active" | "archived",
): Promise<{ success: boolean; count: number } | null> => {
  const result = await db
    .update(productsTable)
    .set({ status, updatedAt: new Date() })
    .where(inArray(productsTable.id, ids))
    .returning()

  if (!result || result.length === 0) {
    return null
  }

  return { success: true, count: result.length }
}

export const getProductVersions = (
  productId: string,
): Promise<(typeof productVersionsTable.$inferSelect)[]> => {
  return db
    .select()
    .from(productVersionsTable)
    .where(eq(productVersionsTable.productId, productId))
    .orderBy(desc(productVersionsTable.version))
}

export const createProductVersion = async (
  productId: string,
  data: Omit<InsertProductVersion, "id" | "productId">,
): Promise<typeof productVersionsTable.$inferSelect | null> => {
  const [versions] = await db
    .select({
      maxVersion: sql<number>`COALESCE(MAX(${productVersionsTable.version}), 0)`,
    })
    .from(productVersionsTable)
    .where(eq(productVersionsTable.productId, productId))

  const nextVersion = Number(versions?.maxVersion ?? 0) + 1

  const [version] = await db
    .insert(productVersionsTable)
    .values({ ...data, productId, version: nextVersion })
    .returning()

  return version ?? null
}

export const getPopularProducts = async (
  limit = 10,
): Promise<
  {
    id: string
    slug: string
    name: string
    description: string | null
    costPerRun: string | null
    thumbnailId: string | null
    thumbnail: { id: string; url: string } | null
  }[]
> => {
  const products = await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      description: productsTable.description,
      costPerRun: productsTable.costPerRun,
      thumbnailId: productsTable.thumbnailId,
      thumbnailUrl: assetsTable.url,
      thumbnailAssetId: assetsTable.id,
    })
    .from(productsTable)
    .leftJoin(assetsTable, eq(productsTable.thumbnailId, assetsTable.id))
    .where(eq(productsTable.status, "active"))
    .limit(limit)

  return products.map((product) => {
    const thumbnail =
      product.thumbnailAssetId && product.thumbnailUrl
        ? { id: product.thumbnailAssetId, url: product.thumbnailUrl }
        : null

    const { thumbnailUrl: _, thumbnailAssetId: __, ...productData } = product

    return { ...productData, thumbnail }
  })
}

export const getProductBySlugId = async (
  slug: string,
): Promise<{ id: string } | null> => {
  const [product] = await db
    .select({ id: productsTable.id })
    .from(productsTable)
    .where(eq(productsTable.slug, slug))

  return product ?? null
}

export const insertProductRun = async (data: {
  id: string
  productId: string
  userId: string
  inputs: Record<string, unknown>
  outputs: Record<string, unknown>
  status: "running" | "completed" | "failed"
  cost: string
  completedAt: Date
}): Promise<typeof productRunsTable.$inferSelect | null> => {
  const [run] = await db.insert(productRunsTable).values(data).returning()
  return run ?? null
}

export const updateProductRun = async (
  id: string,
  data: {
    outputs: Record<string, unknown>
    status: "running" | "completed" | "failed"
    completedAt: Date
  },
): Promise<typeof productRunsTable.$inferSelect | null> => {
  const [run] = await db
    .update(productRunsTable)
    .set(data)
    .where(eq(productRunsTable.id, id))
    .returning()
  return run ?? null
}

export const searchProducts = async (
  query: string,
  limit = 20,
): Promise<
  {
    id: string
    slug: string
    name: string
    excerpt: string | null
    costPerRun: string | null
    thumbnail: { id: string; url: string } | null
  }[]
> => {
  const products = await db
    .select({
      id: productsTable.id,
      slug: productsTable.slug,
      name: productsTable.name,
      excerpt: productsTable.excerpt,
      costPerRun: productsTable.costPerRun,
      thumbnailUrl: assetsTable.url,
      thumbnailAssetId: assetsTable.id,
    })
    .from(productsTable)
    .leftJoin(assetsTable, eq(productsTable.thumbnailId, assetsTable.id))
    .where(
      and(
        eq(productsTable.status, "active"),
        sql`(${ilike(productsTable.name, `%${query}%`).getSQL()} OR ${ilike(productsTable.description, `%${query}%`).getSQL()})`,
      ),
    )
    .orderBy(desc(productsTable.createdAt))
    .limit(limit)

  return products.map((product) => {
    const thumbnail =
      product.thumbnailAssetId && product.thumbnailUrl
        ? { id: product.thumbnailAssetId, url: product.thumbnailUrl }
        : null

    const { thumbnailUrl: _, thumbnailAssetId: __, ...productData } = product

    return { ...productData, thumbnail }
  })
}
