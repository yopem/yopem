import { eq } from "drizzle-orm"
import readline from "node:readline"
import { pathToFileURL } from "node:url"
import { encryptApiKey } from "server/utils/crypto"

import { db } from "db"
import {
  adminSettingsTable,
  aiModelsTable,
  categoriesTable,
  productCategoriesTable,
  productRunsTable,
  productTagsTable,
  productVersionsTable,
  productsTable,
  tagsTable,
} from "db/schema"
import {
  createAIModel,
  getSetting,
  listAIModels,
  upsertSetting,
} from "db/services/admin"
import { createCategory, listCategories } from "db/services/categories"
import { createProduct, listProducts } from "db/services/products"
import { createTag, listTags } from "db/services/tags"
import {
  type ApiKeyConfig,
  type ApiKeyProvider,
  apiKeyConfigSchema,
  apiKeyProviderSchema,
} from "utils/api-input"
import { createCustomId } from "utils/custom-id"

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

const API_KEY_SETTING_KEY = "api_keys"
const DEFAULT_TEXT_MODEL_ID = "nemotron-3-ultra-550b-a55b:free"

const API_KEY_ENV_VARS: Record<ApiKeyProvider, string> = {
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  fal: "FAL_KEY",
}

const DEFAULT_KEY_NAMES: Record<ApiKeyProvider, string> = {
  openai: "OpenAI default key",
  openrouter: "OpenRouter default key",
  fal: "FAL default key",
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

export const VALID_PROVIDERS = apiKeyProviderSchema.options
export const VALID_OUTPUT_FORMATS = ["plain", "json", "image", "video"] as const

export const categories: SeedCategory[] = [
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

export const tags: SeedTag[] = [
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

export const aiModels: SeedModel[] = [
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
  {
    provider: "openrouter",
    modelId: DEFAULT_TEXT_MODEL_ID,
    displayName: "Nemotron 3 Ultra 550B",
    isEnabled: true,
  },
]

export const products: SeedProduct[] = [
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

async function seedAIModels(): Promise<{ created: number; skipped: number }> {
  const existing = await listAIModels()
  const existingKeys = new Set(
    existing.map((model) => `${model.provider}:${model.modelId}`),
  )

  let created = 0
  let skipped = 0

  for (const model of aiModels) {
    if (existingKeys.has(`${model.provider}:${model.modelId}`)) {
      skipped++
      continue
    }

    await createAIModel(model)
    created++
    console.info(`Created AI model: ${model.displayName} (${model.provider})`)
  }

  return { created, skipped }
}

async function seedCategories(): Promise<{
  ids: Map<string, string>
  created: number
}> {
  const existing = await listCategories()
  const ids = new Map(existing.map((category) => [category.name, category.id]))
  const existingNames = new Set(ids.keys())
  let created = 0

  for (const category of categories) {
    if (existingNames.has(category.name)) continue

    const result = await createCategory(category)
    ids.set(category.name, result.id)
    created++
    console.info(`Created category: ${category.name}`)
  }

  return { ids, created }
}

async function seedTags(): Promise<{
  ids: Map<string, string>
  created: number
}> {
  const existing = await listTags()
  const ids = new Map(existing.map((tag) => [tag.name, tag.id]))
  const existingNames = new Set(ids.keys())
  let created = 0

  for (const tag of tags) {
    if (existingNames.has(tag.name)) continue

    const result = await createTag(tag)
    ids.set(tag.name, result.id)
    created++
    console.info(`Created tag: ${tag.name}`)
  }

  return { ids, created }
}

async function seedApiKeys(): Promise<Map<ApiKeyProvider, string>> {
  const setting = await getSetting(API_KEY_SETTING_KEY)
  const raw = setting?.settingValue
  const parsed = apiKeyConfigSchema.array().safeParse(raw)
  const hasExisting = Array.isArray(raw) && raw.length > 0

  if (hasExisting && !parsed.success) {
    console.warn(
      "Existing API keys setting is invalid; skipping default seeding",
    )
    return new Map<ApiKeyProvider, string>()
  }

  const keys = parsed.success ? [...parsed.data] : []
  const map = new Map<ApiKeyProvider, string>()

  for (const key of keys) {
    if (key.status === "active" && !map.has(key.provider)) {
      map.set(key.provider, key.id)
    }
  }

  let added = false
  for (const provider of apiKeyProviderSchema.options) {
    if (map.has(provider)) continue

    const envValue = process.env[API_KEY_ENV_VARS[provider]]
    if (!envValue) continue

    const encrypted = encryptApiKey(envValue)
    const config: ApiKeyConfig = {
      id: createCustomId(),
      provider,
      name: DEFAULT_KEY_NAMES[provider],
      apiKey: encrypted,
      status: "active",
      createdAt: today(),
      updatedAt: today(),
    }

    keys.push(config)
    map.set(provider, config.id)
    added = true
    console.info(`Created API key: ${provider}`)
  }

  if (added) {
    await upsertSetting(API_KEY_SETTING_KEY, keys)
  }

  return map
}

async function getDefaultTextModel(
  apiKeyByProvider: Map<ApiKeyProvider, string>,
): Promise<{
  provider: ApiKeyProvider
  modelId: string
} | null> {
  if (apiKeyByProvider.size === 0) {
    return null
  }

  const models = await listAIModels()

  const preferred = models.find(
    (model) =>
      model.modelId === DEFAULT_TEXT_MODEL_ID &&
      model.isEnabled &&
      apiKeyByProvider.has(model.provider as ApiKeyProvider),
  )

  if (preferred) {
    return { provider: "openrouter", modelId: preferred.modelId }
  }

  const fallback = models.find((model) => {
    if (!model.isEnabled) return false
    const parsed = apiKeyProviderSchema.safeParse(model.provider)
    return parsed.success && apiKeyByProvider.has(parsed.data)
  })

  if (!fallback) {
    return null
  }

  const parsed = apiKeyProviderSchema.safeParse(fallback.provider)
  if (!parsed.success) {
    return null
  }

  return { provider: parsed.data, modelId: fallback.modelId }
}

async function seedProducts(
  categoryIds: Map<string, string>,
  tagIds: Map<string, string>,
  apiKeyByProvider: Map<ApiKeyProvider, string>,
  defaultTextModel: { provider: ApiKeyProvider; modelId: string } | null,
): Promise<{ created: number; skipped: number }> {
  const { products: existing } = await listProducts({
    status: "all",
    limit: 1000,
  })
  const existingNames = new Set(existing.map((product) => product.name))

  let created = 0
  let skipped = 0

  for (const product of products) {
    if (existingNames.has(product.name)) {
      console.info(`Skipping ${product.name}: already exists`)
      skipped++
      continue
    }

    const isMediaProduct =
      product.outputFormat === "image" || product.outputFormat === "video"

    const provider = isMediaProduct
      ? product.provider
      : (defaultTextModel?.provider ?? product.provider)
    const modelEngine = isMediaProduct
      ? product.modelEngine
      : (defaultTextModel?.modelId ?? product.modelEngine)

    const apiKeyId = apiKeyByProvider.get(provider) ?? null
    if (!apiKeyId) {
      console.warn(
        `No active ${provider} API key for ${product.name}; skipping`,
      )
      skipped++
      continue
    }

    const productCategoryIds = product.categories
      .map((name) => categoryIds.get(name))
      .filter((id): id is string => id !== undefined)

    const productTagIds = product.tags
      .map((name) => tagIds.get(name))
      .filter((id): id is string => id !== undefined)

    await createProduct({
      name: product.name,
      excerpt: product.excerpt,
      description: product.description,
      status: "active",
      config: { modelEngine },
      systemRole: product.systemRole,
      userInstructionTemplate: product.userInstructionTemplate,
      inputVariable: product.inputVariable,
      outputFormat: product.outputFormat,
      costPerRun: product.costPerRun,
      isPublic: true,
      apiKeyId,
      categoryIds: productCategoryIds,
      tagIds: productTagIds,
    })

    created++
    console.info(`Created product: ${product.name}`)
  }

  return { created, skipped }
}

function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(`${message} (yes/no) `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === "yes")
    })
  })
}

async function clearSeedData(): Promise<void> {
  await db.delete(productRunsTable)
  await db.delete(productVersionsTable)
  await db.delete(productTagsTable)
  await db.delete(productCategoriesTable)
  await db.delete(productsTable)
  await db.delete(tagsTable)
  await db.delete(categoriesTable)
  await db.delete(aiModelsTable)
  await db
    .delete(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, API_KEY_SETTING_KEY))

  console.info("Cleared seed data")
}

async function main(): Promise<void> {
  const agreed = await confirm(
    "Seed will delete all existing seed data and recreate it. Continue?",
  )
  if (!agreed) {
    console.info("Seed cancelled")
    process.exit(0)
  }

  await clearSeedData()
  const result = await runSeed()
  console.info("Seed complete:", result)
}

export async function runSeed(): Promise<{
  aiModels: { created: number; skipped: number }
  categories: number
  tags: number
  products: { created: number; skipped: number }
}> {
  const modelResult = await seedAIModels()
  console.info(
    `Seeded ${modelResult.created} AI models, skipped ${modelResult.skipped}`,
  )

  const apiKeyByProvider = await seedApiKeys()

  const defaultTextModel = await getDefaultTextModel(apiKeyByProvider)
  if (!defaultTextModel) {
    console.warn("No AI models with active API keys found")
  }

  const categoryResult = await seedCategories()
  const tagResult = await seedTags()
  const productResult = await seedProducts(
    categoryResult.ids,
    tagResult.ids,
    apiKeyByProvider,
    defaultTextModel,
  )

  console.info(
    `Seeded ${categoryResult.created} categories, ${tagResult.created} tags, ${productResult.created} products, skipped ${productResult.skipped} products`,
  )

  return {
    aiModels: modelResult,
    categories: categoryResult.created,
    tags: tagResult.created,
    products: productResult,
  }
}

const isMainModule =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href

if (isMainModule) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Seed failed:", error)
      process.exit(1)
    })
}
