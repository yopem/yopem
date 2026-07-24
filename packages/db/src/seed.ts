import { and, eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import { transliterate as tr } from "transliteration"

import * as schema from "db/schema"
import { apiKeyConfigSchema } from "utils/api-keys-schema"
import type { ApiKeyProvider } from "utils/api-keys-schema"
import { createCustomId } from "utils/custom-id"

const databaseUrl = process.env["DATABASE_URL"]

if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is not set")
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 5,
})

const db = drizzle(pool, { schema })

interface InputVariable {
  variableName: string
  description: string
  type: string
  options?: { label: string; value: string }[]
}

interface SeedCategory {
  name: string
  description: string
}

interface SeedTag {
  name: string
}

interface SeedProduct {
  name: string
  excerpt: string
  description: string
  systemRole: string
  userInstructionTemplate: string
  inputVariable: InputVariable[]
  outputFormat: "plain" | "json" | "image" | "video"
  costPerRun: string
  modelEngine: string
  provider: ApiKeyProvider
  categories: string[]
  tags: string[]
}

interface SeedModel {
  provider: ApiKeyProvider
  modelId: string
  displayName: string
  isEnabled: boolean
}

const categories: SeedCategory[] = [
  {
    name: "Writing",
    description: "AI products that help you write faster and better.",
  },
  {
    name: "Marketing",
    description: "Copy, ads, social posts, and SEO assistants.",
  },
  {
    name: "Development",
    description: "Code review, Git, SQL, and engineering tools.",
  },
  {
    name: "Productivity",
    description: "Email, notes, and daily workflow automation.",
  },
  {
    name: "Media & Design",
    description: "Image, video, and creative prompt tools.",
  },
  {
    name: "Data",
    description: "Query builders, summarizers, and data helpers.",
  },
]

const tags: SeedTag[] = [
  { name: "SEO" },
  { name: "Copywriting" },
  { name: "Code" },
  { name: "Git" },
  { name: "Email" },
  { name: "Social Media" },
  { name: "SQL" },
  { name: "YouTube" },
  { name: "Image Generation" },
  { name: "AI Writing" },
  { name: "E-commerce" },
  { name: "Proofreading" },
]

const aiModels: SeedModel[] = [
  {
    provider: "openai",
    modelId: "gpt-4o",
    displayName: "GPT-4o",
    isEnabled: true,
  },
  {
    provider: "openai",
    modelId: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
    isEnabled: true,
  },
  {
    provider: "openai",
    modelId: "gpt-4-turbo",
    displayName: "GPT-4 Turbo",
    isEnabled: true,
  },
  {
    provider: "openrouter",
    modelId: "openai/gpt-4o-mini",
    displayName: "OpenRouter GPT-4o Mini",
    isEnabled: true,
  },
  {
    provider: "openrouter",
    modelId: "anthropic/claude-3.5-sonnet",
    displayName: "Claude 3.5 Sonnet",
    isEnabled: true,
  },
  {
    provider: "openrouter",
    modelId: "google/gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    isEnabled: true,
  },
  {
    provider: "fal",
    modelId: "fal-ai/flux/schnell",
    displayName: "FLUX Schnell",
    isEnabled: true,
  },
  {
    provider: "fal",
    modelId: "fal-ai/flux/dev",
    displayName: "FLUX Dev",
    isEnabled: true,
  },
  {
    provider: "fal",
    modelId: "fal-ai/recraft-v3",
    displayName: "Recraft V3",
    isEnabled: true,
  },
]

const products: SeedProduct[] = [
  {
    name: "SEO Blog Writer",
    excerpt:
      "Generate SEO-friendly blog posts with the right tone, length, and keyword density.",
    description:
      "Turn a topic and a few keywords into a complete, well-structured blog post. Choose your tone and target length, and the assistant handles headings, keyword placement, and a strong conclusion.",
    systemRole:
      "You are an expert SEO content writer. You write original, engaging, well-structured blog posts in Markdown. You naturally weave keywords into headings and body copy, include an introduction, actionable sections, and a conclusion, and match the requested tone and length.",
    userInstructionTemplate:
      "Write a {{length}} SEO blog post about: {{topic}}.\n\nTarget keywords: {{keywords}}\n\nTone: {{tone}}\n\nFormat in Markdown with a compelling title, intro, H2 sections, and a conclusion. Naturally include the keywords without keyword stuffing.",
    inputVariable: [
      {
        variableName: "topic",
        description: "What the blog post is about",
        type: "long_text",
      },
      {
        variableName: "keywords",
        description: "Comma-separated target keywords",
        type: "text",
      },
      {
        variableName: "tone",
        description: "Writing tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Casual", value: "Casual" },
          { label: "Witty", value: "Witty" },
        ],
      },
      {
        variableName: "length",
        description: "Approximate target length",
        type: "select",
        options: [
          { label: "Short ~300 words", value: "short ~300 words" },
          { label: "Medium ~800 words", value: "medium ~800 words" },
          { label: "Long ~1500 words", value: "long ~1500 words" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Writing", "Marketing"],
    tags: ["SEO", "AI Writing", "Copywriting"],
  },
  {
    name: "Product Description Generator",
    excerpt:
      "Write benefit-driven e-commerce product descriptions that convert.",
    description:
      "Drop in a product name, features, audience, and tone. Get a headline plus polished paragraphs focused on benefits and buyer intent.",
    systemRole:
      "You are a conversion-focused e-commerce copywriter. You write concise, benefit-driven product descriptions that persuade shoppers and stay brand-consistent.",
    userInstructionTemplate:
      "Write a product description for {{productName}}.\n\nKey features: {{features}}\n\nTarget audience: {{audience}}\n\nTone: {{tone}}\n\nOutput a short headline and 2-3 benefit-focused paragraphs.",
    inputVariable: [
      {
        variableName: "productName",
        description: "Name of the product",
        type: "text",
      },
      {
        variableName: "features",
        description: "Product features or specs",
        type: "long_text",
      },
      {
        variableName: "audience",
        description: "Who the product is for",
        type: "text",
      },
      {
        variableName: "tone",
        description: "Brand tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Playful", value: "Playful" },
          { label: "Luxury", value: "Luxury" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing"],
    tags: ["Copywriting", "E-commerce"],
  },
  {
    name: "Code Review Assistant",
    excerpt:
      "Get a friendly but rigorous code review with bugs, fixes, and praise.",
    description:
      "Paste a code snippet and pick a language. The assistant finds bugs, security issues, performance problems, and style improvements, then explains each one and suggests fixes.",
    systemRole:
      "You are a senior software engineer doing a friendly but rigorous code review. Identify bugs, security issues, performance problems, and style improvements. Explain why each matters and suggest concrete fixes.",
    userInstructionTemplate:
      "Review the following {{language}} code:\n\n```{{language}}\n{{code}}\n```\n\nProvide a structured review with: 1) Critical issues, 2) Suggestions, 3) Positive notes. Use Markdown.",
    inputVariable: [
      {
        variableName: "language",
        description: "Programming language",
        type: "text",
      },
      {
        variableName: "code",
        description: "Code to review",
        type: "long_text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0400",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development"],
    tags: ["Code"],
  },
  {
    name: "Git Commit Message Generator",
    excerpt:
      "Turn a diff into a clear, conventional commit message in seconds.",
    description:
      "Paste your staged diff and an optional scope. The assistant writes a conventional commit message that describes the change accurately.",
    systemRole:
      "You are a Git expert. You write clear, conventional commit messages that describe changes accurately and are easy to scan in a changelog.",
    userInstructionTemplate:
      "Generate a conventional commit message for this diff:\n\n```\n{{diff}}\n```\n\nScope (optional): {{scope}}\n\nOutput only the commit message, no explanation.",
    inputVariable: [
      {
        variableName: "diff",
        description: "Git diff to summarize",
        type: "long_text",
      },
      {
        variableName: "scope",
        description: "Optional commit scope",
        type: "text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0100",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development", "Productivity"],
    tags: ["Git", "Code"],
  },
  {
    name: "Image Prompt Enhancer",
    excerpt:
      "Turn a simple idea into a detailed prompt for Midjourney, DALL-E, or FLUX.",
    description:
      "Describe your image idea, pick a style and aspect ratio, and get a vivid, ready-to-use prompt with lighting, composition, and camera details.",
    systemRole:
      "You are an expert prompt engineer for AI image generators. You take a simple idea and expand it into a vivid, detailed prompt with style, lighting, composition, and camera details. Output only the enhanced prompt.",
    userInstructionTemplate:
      "Enhance this image idea into a detailed prompt.\n\nIdea: {{idea}}\nStyle: {{style}}\nAspect ratio: {{aspectRatio}}\n\nOutput only the final prompt, no extra commentary.",
    inputVariable: [
      {
        variableName: "idea",
        description: "Short description of the image",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Visual style",
        type: "select",
        options: [
          { label: "Photorealistic", value: "photorealistic" },
          { label: "Anime", value: "anime" },
          { label: "3D Render", value: "3D render" },
          { label: "Oil Painting", value: "oil painting" },
        ],
      },
      {
        variableName: "aspectRatio",
        description: "Aspect ratio for the image",
        type: "select",
        options: [
          { label: "16:9", value: "16:9" },
          { label: "4:3", value: "4:3" },
          { label: "1:1", value: "1:1" },
          { label: "9:16", value: "9:16" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Media & Design"],
    tags: ["Image Generation"],
  },
  {
    name: "Email Reply Writer",
    excerpt: "Draft polite, context-aware email replies in the tone you need.",
    description:
      "Paste the email you received, describe your intent, and choose a tone. The assistant drafts a ready-to-send reply that matches the conversation.",
    systemRole:
      "You are a professional email assistant. You draft polite, clear, and context-aware replies that match the sender's tone and intent.",
    userInstructionTemplate:
      "Draft a reply to this email:\n\n{{incomingEmail}}\n\nIntent: {{intent}}\nTone: {{tone}}\n\nOutput only the email body, ready to send.",
    inputVariable: [
      {
        variableName: "incomingEmail",
        description: "Email you are replying to",
        type: "long_text",
      },
      {
        variableName: "intent",
        description: "What you want to communicate",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Tone of the reply",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Friendly", value: "Friendly" },
          { label: "Assertive", value: "Assertive" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Productivity"],
    tags: ["Email"],
  },
  {
    name: "Social Media Post Generator",
    excerpt:
      "Create native-feeling posts for Twitter, LinkedIn, and Instagram.",
    description:
      "Enter a topic, pick a platform and tone, and get a post with a hook, body, and hashtags where they fit.",
    systemRole:
      "You are a social media strategist. You write platform-native posts with hooks, hashtags, and the right tone for maximum engagement.",
    userInstructionTemplate:
      "Write a {{platform}} post about {{topic}}. Tone: {{tone}}. Include relevant hashtags where appropriate. Do not use emojis unless the tone calls for them.",
    inputVariable: [
      {
        variableName: "topic",
        description: "What the post is about",
        type: "long_text",
      },
      {
        variableName: "platform",
        description: "Social platform",
        type: "select",
        options: [
          { label: "Twitter / X", value: "Twitter / X" },
          { label: "LinkedIn", value: "LinkedIn" },
          { label: "Instagram", value: "Instagram" },
        ],
      },
      {
        variableName: "tone",
        description: "Tone of the post",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Casual", value: "Casual" },
          { label: "Playful", value: "Playful" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing"],
    tags: ["Social Media", "Copywriting"],
  },
  {
    name: "SQL Query Builder",
    excerpt:
      "Turn plain-English questions into correct, optimized SQL queries.",
    description:
      "Describe your schema and ask a question. The assistant returns a standard SQL query and a short explanation of the approach.",
    systemRole:
      "You are a SQL expert. You turn plain-English data questions into correct, optimized SQL queries. Use standard SQL unless a dialect is specified.",
    userInstructionTemplate:
      "Given this schema:\n\n{{schema}}\n\nWrite a {{dialect}} SQL query for: {{question}}\n\nOutput only the SQL, with a brief comment explaining the approach.",
    inputVariable: [
      {
        variableName: "schema",
        description: "Database schema or table descriptions",
        type: "long_text",
      },
      {
        variableName: "question",
        description: "What you want to know",
        type: "long_text",
      },
      {
        variableName: "dialect",
        description: "SQL dialect",
        type: "select",
        options: [
          { label: "PostgreSQL", value: "PostgreSQL" },
          { label: "MySQL", value: "MySQL" },
          { label: "SQLite", value: "SQLite" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development", "Data"],
    tags: ["SQL", "Code"],
  },
  {
    name: "YouTube Script Writer",
    excerpt:
      "Generate engaging YouTube scripts with hooks, talking points, and CTAs.",
    description:
      "Give a topic, target duration, and tone. The assistant writes a speaker-ready script with a strong opening, main sections, and an outro call to action.",
    systemRole:
      "You are a YouTube scriptwriter. You create engaging scripts with a strong hook, clear sections, and a call to action.",
    userInstructionTemplate:
      "Write a {{duration}} YouTube script about {{topic}}. Tone: {{tone}}. Include a hook in the first 15 seconds, main talking points, and an outro with a CTA. Format as a speaker-ready script.",
    inputVariable: [
      {
        variableName: "topic",
        description: "Video topic",
        type: "long_text",
      },
      {
        variableName: "duration",
        description: "Approximate video length",
        type: "select",
        options: [
          { label: "Short ~3 minutes", value: "short ~3 minutes" },
          { label: "Medium ~8 minutes", value: "medium ~8 minutes" },
          { label: "Long ~15 minutes", value: "long ~15 minutes" },
        ],
      },
      {
        variableName: "tone",
        description: "Tone of the video",
        type: "select",
        options: [
          { label: "Energetic", value: "Energetic" },
          { label: "Calm", value: "Calm" },
          { label: "Educational", value: "Educational" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0400",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Media & Design", "Marketing"],
    tags: ["YouTube", "AI Writing"],
  },
  {
    name: "Grammar & Style Refiner",
    excerpt:
      "Fix grammar, spelling, and awkward phrasing while keeping your voice.",
    description:
      "Paste any text and choose a style goal. The assistant returns a polished version that preserves your original meaning and tone.",
    systemRole:
      "You are an editor. Fix grammar, spelling, punctuation, and awkward phrasing while preserving the original meaning and voice.",
    userInstructionTemplate:
      "Improve the following text for {{style}}. Keep the original meaning and tone:\n\n{{text}}\n\nOutput only the improved text.",
    inputVariable: [
      {
        variableName: "text",
        description: "Text to improve",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Style goal",
        type: "select",
        options: [
          { label: "Clarity", value: "clarity" },
          { label: "Conciseness", value: "conciseness" },
          { label: "Professional tone", value: "professional tone" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0100",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Writing", "Productivity"],
    tags: ["Proofreading", "AI Writing"],
  },
  {
    name: "AI Image Generator",
    excerpt: "Generate images from a detailed idea using FLUX.",
    description:
      "Describe the image you want, pick a visual style and aspect ratio, and generate a ready-to-use image via FLUX.",
    systemRole:
      "You are an expert AI image prompt engineer. Expand the user's idea into a vivid, detailed prompt that produces high-quality images.",
    userInstructionTemplate:
      "Create a high-quality image of: {{idea}}. Style: {{style}}. Aspect ratio: {{aspectRatio}}. Make it visually striking and detailed.",
    inputVariable: [
      {
        variableName: "idea",
        description: "Short description of the image you want",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Visual style",
        type: "select",
        options: [
          { label: "Photorealistic", value: "photorealistic" },
          { label: "Anime", value: "anime" },
          { label: "3D Render", value: "3D render" },
          { label: "Oil Painting", value: "oil painting" },
        ],
      },
      {
        variableName: "aspectRatio",
        description: "Aspect ratio for the generated image",
        type: "select",
        options: [
          { label: "16:9", value: "16:9" },
          { label: "4:3", value: "4:3" },
          { label: "1:1", value: "1:1" },
          { label: "9:16", value: "9:16" },
        ],
      },
    ],
    outputFormat: "image",
    costPerRun: "0.1000",
    modelEngine: "fal-ai/flux/schnell",
    provider: "fal",
    categories: ["Media & Design"],
    tags: ["Image Generation"],
  },
]

function slugify(text: string): string {
  return tr(text)
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/-$/g, "")
}

async function ensureUniqueSlug(
  tableName: "categoriesTable" | "tagsTable" | "productsTable",
  text: string,
): Promise<string> {
  const table =
    tableName === "categoriesTable"
      ? schema.categoriesTable
      : tableName === "tagsTable"
        ? schema.tagsTable
        : schema.productsTable
  const baseSlug = slugify(text)
  let slug = baseSlug
  let suffix = 1

  while (true) {
    const existing = await db
      .select({ id: table.id })
      .from(table)
      .where(eq(table.slug, slug))
      .limit(1)

    if (existing.length === 0) {
      return slug
    }

    suffix++
    slug = `${baseSlug}-${suffix}`
  }
}

async function getActiveApiKeys(): Promise<
  { id: string; provider: ApiKeyProvider }[]
> {
  const [setting] = await db
    .select({ settingValue: schema.adminSettingsTable.settingValue })
    .from(schema.adminSettingsTable)
    .where(eq(schema.adminSettingsTable.settingKey, "api_keys"))

  if (!setting?.settingValue) {
    return []
  }

  const parsed = apiKeyConfigSchema
    .array()
    .safeParse(
      typeof setting.settingValue === "string"
        ? JSON.parse(setting.settingValue)
        : setting.settingValue,
    )

  if (!parsed.success) {
    console.error("Failed to parse api_keys setting:", parsed.error.message)
    return []
  }

  return parsed.data
    .filter((key) => key.status === "active")
    .map((key) => ({ id: key.id, provider: key.provider }))
}

async function seedCategories() {
  const ids = new Map<string, string>()

  for (const category of categories) {
    const [existing] = await db
      .select({ id: schema.categoriesTable.id })
      .from(schema.categoriesTable)
      .where(eq(schema.categoriesTable.name, category.name))
      .limit(1)

    if (existing) {
      ids.set(category.name, existing.id)
      continue
    }

    const id = createCustomId()
    const slug = await ensureUniqueSlug("categoriesTable", category.name)

    await db.insert(schema.categoriesTable).values({
      id,
      name: category.name,
      slug,
      description: category.description,
      sortOrder: 0,
    })

    ids.set(category.name, id)
  }

  return ids
}

async function seedTags() {
  const ids = new Map<string, string>()

  for (const tag of tags) {
    const [existing] = await db
      .select({ id: schema.tagsTable.id })
      .from(schema.tagsTable)
      .where(eq(schema.tagsTable.name, tag.name))
      .limit(1)

    if (existing) {
      ids.set(tag.name, existing.id)
      continue
    }

    const id = createCustomId()
    const slug = await ensureUniqueSlug("tagsTable", tag.name)

    await db.insert(schema.tagsTable).values({
      id,
      name: tag.name,
      slug,
    })

    ids.set(tag.name, id)
  }

  return ids
}

async function seedAIModels() {
  let created = 0
  let skipped = 0

  for (const model of aiModels) {
    const [existing] = await db
      .select({ id: schema.aiModelsTable.id })
      .from(schema.aiModelsTable)
      .where(
        and(
          eq(schema.aiModelsTable.provider, model.provider),
          eq(schema.aiModelsTable.modelId, model.modelId),
        ),
      )
      .limit(1)

    if (existing) {
      skipped++
      continue
    }

    const id = createCustomId()
    await db.insert(schema.aiModelsTable).values({
      id,
      provider: model.provider,
      modelId: model.modelId,
      displayName: model.displayName,
      isEnabled: model.isEnabled,
    })

    created++
    console.info(`Created AI model: ${model.displayName} (${model.provider})`)
  }

  return { created, skipped }
}

async function seedProducts(
  categoryIds: Map<string, string>,
  tagIds: Map<string, string>,
  apiKeys: { id: string; provider: ApiKeyProvider }[],
) {
  const keyByProvider = new Map<ApiKeyProvider, string>()
  for (const key of apiKeys) {
    if (!keyByProvider.has(key.provider)) {
      keyByProvider.set(key.provider, key.id)
    }
  }

  let created = 0
  let skipped = 0

  for (const product of products) {
    const apiKeyId = keyByProvider.get(product.provider)
    if (!apiKeyId) {
      console.warn(
        `Skipping ${product.name}: no active ${product.provider} API key`,
      )
      skipped++
      continue
    }

    const [existing] = await db
      .select({ id: schema.productsTable.id })
      .from(schema.productsTable)
      .where(eq(schema.productsTable.name, product.name))
      .limit(1)

    if (existing) {
      console.info(`Skipping ${product.name}: already exists`)
      skipped++
      continue
    }

    const id = createCustomId()
    const slug = await ensureUniqueSlug("productsTable", product.name)

    await db.insert(schema.productsTable).values({
      id,
      name: product.name,
      slug,
      excerpt: product.excerpt,
      description: product.description,
      status: "active",
      config: { modelEngine: product.modelEngine },
      systemRole: product.systemRole,
      userInstructionTemplate: product.userInstructionTemplate,
      inputVariable: product.inputVariable,
      outputFormat: product.outputFormat,
      costPerRun: product.costPerRun,
      markup: "0.2000",
      isPublic: true,
      apiKeyId,
    })

    const productCategoryIds = product.categories
      .map((name) => categoryIds.get(name))
      .filter((id): id is string => id !== undefined)

    if (productCategoryIds.length > 0) {
      await db.insert(schema.productCategoriesTable).values(
        productCategoryIds.map((categoryId) => ({
          productId: id,
          categoryId,
        })),
      )
    }

    const productTagIds = product.tags
      .map((name) => tagIds.get(name))
      .filter((id): id is string => id !== undefined)

    if (productTagIds.length > 0) {
      await db.insert(schema.productTagsTable).values(
        productTagIds.map((tagId) => ({
          productId: id,
          tagId,
        })),
      )
    }

    created++
    console.info(`Created product: ${product.name}`)
  }

  return { created, skipped }
}

async function main() {
  const modelResult = await seedAIModels()
  console.info(
    `Seeded ${modelResult.created} AI models, skipped ${modelResult.skipped}`,
  )

  const apiKeys = await getActiveApiKeys()
  const textKeys = apiKeys.filter(
    (key) => key.provider === "openai" || key.provider === "openrouter",
  )

  if (textKeys.length === 0) {
    console.error(
      "No active openai or openrouter API key found. Add one in admin settings before seeding products.",
    )
    process.exit(1)
  }

  const { created, skipped } = await (async () => {
    const categoryIds = await seedCategories()
    const tagIds = await seedTags()
    return await seedProducts(categoryIds, tagIds, apiKeys)
  })()

  console.info(`Seeded ${created} products, skipped ${skipped}`)
}

try {
  await main()
} catch (error) {
  console.error("Seed failed:", error)
  process.exitCode = 1
} finally {
  await pool.end()
}
