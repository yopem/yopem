import { eq, sql } from "drizzle-orm"
import readline from "node:readline"
import { pathToFileURL } from "node:url"
import { encryptApiKey } from "server/utils/crypto"

import { db } from "db"
import {
  adminSettingsTable,
  aiModelsTable,
  assetsTable,
  categoriesTable,
  productCategoriesTable,
  productRunsTable,
  productTagsTable,
  productVersionsTable,
  productsTable,
  tagsTable,
} from "db/schema"
import {
  type InputField,
  type ProductWorkflow,
} from "db/schema/product-workflow"
import {
  createAIModel,
  deleteAIModelById,
  findAIModelByProviderAndModelId,
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
  icon?: string
  sortOrder?: number
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
  fal: "FAL_API_KEY",
  openai: "OPENAI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
}

const API_KEY_FALLBACK: Partial<Record<ApiKeyProvider, string>> = {
  fal: "mock-fal-key-replace-me",
}

const DEFAULT_KEY_NAMES: Record<ApiKeyProvider, string> = {
  openai: "OpenAI default key",
  openrouter: "OpenRouter default key",
  fal: "FAL default key",
}

function today(): string {
  return new Date().toISOString().split("T")[0]
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

interface PlateNode {
  type?: string
  [key: string]: unknown
}

function buildRichDescription(
  summary: string,
  highlights: string[],
): { content: PlateNode[]; html: string } {
  const safeSummary = escapeHtml(summary)
  const safeHighlights = highlights.map((h) => escapeHtml(h))

  const content: PlateNode[] = [
    { type: "h2", children: [{ text: "What it does" }] },
    { type: "p", children: [{ text: safeSummary }] },
    { type: "h2", children: [{ text: "Highlights" }] },
    {
      type: "ul",
      listStyleType: "disc",
      children: safeHighlights.map((text) => ({
        type: "li",
        children: [{ type: "p", children: [{ text }] }],
      })),
    },
    {
      type: "blockquote",
      children: [
        {
          type: "p",
          children: [
            {
              text: "Fill in the inputs, run the workflow, and get a production-ready result you can copy or refine.",
            },
          ],
        },
      ],
    },
  ]

  const listItems = safeHighlights
    .map((text) => `    <li>${text}</li>`)
    .join("\n")

  const html = `<h2>What it does</h2>
<p>${safeSummary}</p>
<h2>Highlights</h2>
<ul>
${listItems}
</ul>
<blockquote>
  <p>Fill in the inputs, run the workflow, and get a production-ready result you can copy or refine.</p>
</blockquote>
`.trim()

  return { content, html }
}

function defaultHighlights(product: SeedProduct): string[] {
  const formatLabel =
    product.outputFormat === "image" || product.outputFormat === "video"
      ? "visual asset"
      : product.outputFormat === "json"
        ? "structured result"
        : "ready-to-use content"
  return [
    `Generates a polished ${formatLabel} from just a few inputs.`,
    `Designed for ${product.categories.slice(0, 2).join(" and ") || "production"} workflows.`,
    `Editable output you can copy, tweak, and reuse across your projects.`,
  ]
}

export const VALID_PROVIDERS = apiKeyProviderSchema.options
export const VALID_OUTPUT_FORMATS = ["plain", "json", "image", "video"] as const

export const categories: SeedCategory[] = [
  {
    name: "Writing",
    description: "AI products that help you write faster and better.",
    icon: "FileText",
    sortOrder: 10,
  },
  {
    name: "Marketing",
    description: "Copy, ads, social posts, and SEO assistants.",
    icon: "Megaphone",
    sortOrder: 20,
  },
  {
    name: "Development",
    description: "Code review, Git, SQL, and engineering tools.",
    icon: "Code2",
    sortOrder: 30,
  },
  {
    name: "Productivity",
    description: "Email, notes, and daily workflow automation.",
    icon: "Zap",
    sortOrder: 40,
  },
  {
    name: "Media & Design",
    description: "Image, video, and creative prompt tools.",
    icon: "Image",
    sortOrder: 50,
  },
  {
    name: "Data",
    description: "Query builders, summarizers, and data helpers.",
    icon: "BarChart3",
    sortOrder: 60,
  },
  {
    name: "Sales",
    description: "Outreach, prospecting, and sales enablement.",
    icon: "TrendingUp",
    sortOrder: 70,
  },
  {
    name: "Customer Support",
    description: "Replies, tickets, and help-desk writing tools.",
    icon: "Headphones",
    sortOrder: 80,
  },
  {
    name: "Business",
    description: "Hiring, strategy, and internal communication.",
    icon: "Briefcase",
    sortOrder: 90,
  },
  {
    name: "E-commerce",
    description: "Product pages, photos, and store content.",
    icon: "ShoppingBag",
    sortOrder: 100,
  },
  {
    name: "Creative",
    description: "Stories, prompts, and artistic experiments.",
    icon: "Sparkles",
    sortOrder: 110,
  },
]

export const tags: SeedTag[] = [
  { name: "Ads" },
  { name: "AI Writing" },
  { name: "API" },
  { name: "Avatar" },
  { name: "Banner" },
  { name: "Blog" },
  { name: "Branding" },
  { name: "Brainstorming" },
  { name: "Career" },
  { name: "Code" },
  { name: "Cold Email" },
  { name: "Copywriting" },
  { name: "Customer Support" },
  { name: "Design" },
  { name: "Documentation" },
  { name: "E-commerce" },
  { name: "Email" },
  { name: "Error" },
  { name: "Git" },
  { name: "Hiring" },
  { name: "Icon" },
  { name: "Illustration" },
  { name: "Image Generation" },
  { name: "Job Description" },
  { name: "Landing Page" },
  { name: "LinkedIn" },
  { name: "Logo" },
  { name: "Marketing" },
  { name: "Meeting" },
  { name: "Meme" },
  { name: "Newsletter" },
  { name: "Outreach" },
  { name: "Photography" },
  { name: "Product Photography" },
  { name: "Productivity" },
  { name: "Prompt Engineering" },
  { name: "Proofreading" },
  { name: "Research" },
  { name: "Resume" },
  { name: "Script" },
  { name: "SEO" },
  { name: "SQL" },
  { name: "Social Media" },
  { name: "Summarization" },
  { name: "Testing" },
  { name: "Translation" },
  { name: "Wallpaper" },
  { name: "YouTube" },
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
    tags: ["SEO", "AI Writing", "Copywriting", "Blog"],
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
    categories: ["E-commerce", "Marketing"],
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
    tags: ["YouTube", "AI Writing", "Script"],
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
    categories: ["Media & Design", "Creative"],
    tags: ["Image Generation", "Prompt Engineering"],
  },
  {
    name: "LinkedIn Post Generator",
    excerpt: "Write professional LinkedIn posts that start conversations.",
    description:
      "Pick a topic, define your audience, and choose a tone. Get a concise LinkedIn post with a hook, body, and engaging question or CTA.",
    systemRole:
      "You are a LinkedIn content strategist. You write professional, engaging posts with a strong hook, concise paragraphs, and a question or CTA that drives comments.",
    userInstructionTemplate:
      "Write a {{tone}} LinkedIn post about {{topic}}. Target audience: {{audience}}. Length: {{length}}. Include a hook, 2-3 short paragraphs, and a closing question or CTA.",
    inputVariable: [
      {
        variableName: "topic",
        description: "What the post is about",
        type: "long_text",
      },
      {
        variableName: "audience",
        description: "Who should read this",
        type: "text",
      },
      {
        variableName: "tone",
        description: "Tone of the post",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Conversational", value: "Conversational" },
          { label: "Thought leadership", value: "thought leadership" },
        ],
      },
      {
        variableName: "length",
        description: "Approximate length",
        type: "select",
        options: [
          { label: "Short ~150 words", value: "short ~150 words" },
          { label: "Medium ~250 words", value: "medium ~250 words" },
          { label: "Long ~400 words", value: "long ~400 words" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing", "Productivity"],
    tags: ["LinkedIn", "Social Media", "Copywriting"],
  },
  {
    name: "Google Ads Copy Generator",
    excerpt:
      "Write headline and description variants that fit Google Ads limits.",
    description:
      "Enter your product, key benefit, and desired tone. Get multiple Google Search ad variants with headlines and descriptions ready to paste into a campaign.",
    systemRole:
      "You are a performance marketer who writes Google Search ads. You create multiple headline and description options that stay within Google’s character limits and emphasize benefits.",
    userInstructionTemplate:
      "Write {{count}} Google Search ad variants for {{product}}.\n\nKey benefit: {{benefit}}\n\nTone: {{tone}}\n\nOutput headlines (max 30 characters each) and descriptions (max 90 characters each) in a clean list format.",
    inputVariable: [
      {
        variableName: "product",
        description: "Product or service name",
        type: "text",
      },
      {
        variableName: "benefit",
        description: "Main value proposition",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Ad tone",
        type: "select",
        options: [
          { label: "Direct", value: "Direct" },
          { label: "Urgent", value: "Urgent" },
          { label: "Friendly", value: "Friendly" },
        ],
      },
      {
        variableName: "count",
        description: "Number of variants",
        type: "select",
        options: [
          { label: "3", value: "3" },
          { label: "5", value: "5" },
          { label: "10", value: "10" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing"],
    tags: ["Ads", "Copywriting"],
  },
  {
    name: "Landing Page Hero Copy",
    excerpt: "Generate headline, subheadline, and CTA for any landing page.",
    description:
      "Describe your product, audience, and value proposition. The assistant writes a hero section with a headline, subheadline, and CTA button text.",
    systemRole:
      "You are a conversion copywriter. You write landing-page hero copy with a clear headline, benefit-driven subheadline, and a strong call-to-action button.",
    userInstructionTemplate:
      "Write landing page hero copy for {{product}}.\n\nTarget audience: {{audience}}\n\nMain value proposition: {{valueProp}}\n\nTone: {{tone}}\n\nOutput a headline, subheadline, and CTA button text.",
    inputVariable: [
      {
        variableName: "product",
        description: "Product or service",
        type: "text",
      },
      {
        variableName: "audience",
        description: "Who it is for",
        type: "text",
      },
      {
        variableName: "valueProp",
        description: "Main value proposition",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Tone",
        type: "select",
        options: [
          { label: "Bold", value: "Bold" },
          { label: "Friendly", value: "Friendly" },
          { label: "Professional", value: "Professional" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing", "Writing"],
    tags: ["Landing Page", "Copywriting"],
  },
  {
    name: "Newsletter Writer",
    excerpt: "Draft a full newsletter issue with subject line, body, and CTA.",
    description:
      "Enter your topic, audience, and tone. The assistant writes a newsletter with a subject line, intro, key points, and a closing CTA.",
    systemRole:
      "You are a newsletter writer. You create engaging email newsletters with a strong subject line, friendly intro, valuable body content, and a clear CTA.",
    userInstructionTemplate:
      "Write a {{tone}} newsletter issue about {{topic}}.\n\nAudience: {{audience}}\n\nLength: {{length}}\n\nInclude a subject line, intro, 3 key points, and a closing CTA. Use Markdown.",
    inputVariable: [
      {
        variableName: "topic",
        description: "Newsletter topic",
        type: "long_text",
      },
      {
        variableName: "audience",
        description: "Target readers",
        type: "text",
      },
      {
        variableName: "tone",
        description: "Newsletter tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Casual", value: "Casual" },
          { label: "Inspirational", value: "Inspirational" },
        ],
      },
      {
        variableName: "length",
        description: "Issue length",
        type: "select",
        options: [
          { label: "Short", value: "short" },
          { label: "Medium", value: "medium" },
          { label: "Long", value: "long" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Marketing", "Writing"],
    tags: ["Newsletter", "AI Writing"],
  },
  {
    name: "Cold Email Outreach",
    excerpt: "Write concise, personalized cold emails that don't feel spammy.",
    description:
      "Enter the recipient role, company, your goal, and any context. Get a short, value-focused cold email with a clear ask.",
    systemRole:
      "You are a sales outreach writer. You write concise, personalized cold emails that focus on value, avoid fluff, and include one clear call to action.",
    userInstructionTemplate:
      "Write a cold email to {{recipientRole}} at {{company}}.\n\nGoal: {{goal}}\n\nContext or hook: {{context}}\n\nTone: {{tone}}\n\nKeep it under 150 words, personalized, and include one clear CTA.",
    inputVariable: [
      {
        variableName: "recipientRole",
        description: "Recipient's job title",
        type: "text",
      },
      {
        variableName: "company",
        description: "Recipient's company",
        type: "text",
      },
      {
        variableName: "goal",
        description: "What you want from the email",
        type: "long_text",
      },
      {
        variableName: "context",
        description: "Personalization or hook",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Email tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Friendly", value: "Friendly" },
          { label: "Direct", value: "Direct" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Sales", "Productivity"],
    tags: ["Cold Email", "Outreach", "Copywriting"],
  },
  {
    name: "Job Description Generator",
    excerpt:
      "Turn a role and requirements into a ready-to-post job description.",
    description:
      "Enter the role, company, responsibilities, and requirements. The assistant writes a clear, inclusive job description with a compelling intro.",
    systemRole:
      "You are an HR copywriter. You write clear, inclusive job descriptions that attract qualified candidates and reflect the company culture.",
    userInstructionTemplate:
      "Write a job description for {{role}} at {{company}}.\n\nResponsibilities: {{responsibilities}}\n\nRequirements: {{requirements}}\n\nTone: {{tone}}\n\nOutput a short intro, responsibilities list, requirements list, and a closing call to apply.",
    inputVariable: [
      {
        variableName: "role",
        description: "Job title",
        type: "text",
      },
      {
        variableName: "company",
        description: "Company name",
        type: "text",
      },
      {
        variableName: "responsibilities",
        description: "Key responsibilities",
        type: "long_text",
      },
      {
        variableName: "requirements",
        description: "Required skills or experience",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Casual", value: "Casual" },
          { label: "Enthusiastic", value: "Enthusiastic" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Business"],
    tags: ["Hiring", "Job Description", "Copywriting"],
  },
  {
    name: "Resume Bullet Optimizer",
    excerpt:
      "Rewrite resume bullets with strong verbs and measurable outcomes.",
    description:
      "Paste your resume bullets and target role. The assistant rewrites them with action verbs, metrics, and a professional tone.",
    systemRole:
      "You are a career coach and resume writer. You rewrite experience bullets to lead with strong action verbs, include measurable outcomes, and match the target role.",
    userInstructionTemplate:
      "Rewrite these resume bullets for a {{role}} role.\n\nOriginal bullets:\n{{bullets}}\n\nTone: {{tone}}\n\nOutput improved bullets only, one per line, with measurable impact where possible.",
    inputVariable: [
      {
        variableName: "role",
        description: "Target job title",
        type: "text",
      },
      {
        variableName: "bullets",
        description: "Current resume bullets",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Tone",
        type: "select",
        options: [
          { label: "Professional", value: "Professional" },
          { label: "Concise", value: "Concise" },
          { label: "Impact-focused", value: "Impact-focused" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Business", "Productivity"],
    tags: ["Resume", "Career"],
  },
  {
    name: "Meeting Minutes Summarizer",
    excerpt: "Turn raw meeting notes into decisions, action items, and owners.",
    description:
      "Paste meeting notes or a transcript. The assistant summarizes decisions, action items, and owners in a clean Markdown format.",
    systemRole:
      "You are an executive assistant. You turn meeting notes into concise summaries with decisions, action items, and owners.",
    userInstructionTemplate:
      "Summarize these meeting notes:\n\n{{notes}}\n\nOutput: Decisions made, Action items with owners, and Open questions. Use Markdown headings.",
    inputVariable: [
      {
        variableName: "notes",
        description: "Meeting notes or transcript",
        type: "long_text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Productivity", "Business"],
    tags: ["Meeting", "Summarization"],
  },
  {
    name: "Technical Documentation Writer",
    excerpt: "Generate clear docs, usage examples, and API references.",
    description:
      "Describe a feature, API, or tool. The assistant writes technical documentation with an overview, usage example, and parameter reference.",
    systemRole:
      "You are a technical writer. You create clear developer documentation with an overview, usage examples, and a parameter or options reference.",
    userInstructionTemplate:
      "Write technical documentation for {{topic}}.\n\nAudience: {{audience}}\n\nDetails to cover: {{details}}\n\nInclude an overview, a code/usage example, and a parameter or options section. Use Markdown.",
    inputVariable: [
      {
        variableName: "topic",
        description: "What to document",
        type: "text",
      },
      {
        variableName: "audience",
        description: "Target reader",
        type: "select",
        options: [
          { label: "Beginner", value: "Beginner" },
          { label: "Intermediate", value: "Intermediate" },
          { label: "Expert", value: "Expert" },
        ],
      },
      {
        variableName: "details",
        description: "Specifics to include",
        type: "long_text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development", "Productivity"],
    tags: ["Documentation", "Code"],
  },
  {
    name: "Unit Test Generator",
    excerpt: "Generate focused unit tests with edge cases and mocks.",
    description:
      "Paste a function or component and pick a framework. The assistant writes unit tests covering happy paths, edge cases, and mocks.",
    systemRole:
      "You are a software testing engineer. You write concise, focused unit tests that cover typical cases, edge cases, and necessary mocks using the requested framework.",
    userInstructionTemplate:
      "Write unit tests for this {{language}} code using {{framework}}.\n\n```{{language}}\n{{code}}\n```\n\nInclude happy path, edge cases, and any needed mocks. Output only the test code.",
    inputVariable: [
      {
        variableName: "language",
        description: "Programming language",
        type: "text",
      },
      {
        variableName: "framework",
        description: "Test framework",
        type: "select",
        options: [
          { label: "Vitest", value: "Vitest" },
          { label: "Jest", value: "Jest" },
          { label: "pytest", value: "pytest" },
          { label: "PHPUnit", value: "PHPUnit" },
        ],
      },
      {
        variableName: "code",
        description: "Code to test",
        type: "long_text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0300",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development"],
    tags: ["Code", "Testing"],
  },
  {
    name: "API Error Explainer",
    excerpt: "Decode API errors and get actionable fixes.",
    description:
      "Paste an error message and optional context. The assistant explains the likely cause and gives step-by-step fixes.",
    systemRole:
      "You are a backend engineer. You explain API errors clearly, identify the likely root cause, and suggest concrete fixes or debugging steps.",
    userInstructionTemplate:
      "Explain this API error and suggest fixes.\n\nError: {{error}}\n\nContext: {{context}}\n\nOutput: Likely cause, Fix steps, and Prevention tip. Use Markdown.",
    inputVariable: [
      {
        variableName: "error",
        description: "Error message or stack trace",
        type: "long_text",
      },
      {
        variableName: "context",
        description: "When it happened or request details",
        type: "long_text",
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Development"],
    tags: ["API", "Error", "Code"],
  },
  {
    name: "Customer Support Reply",
    excerpt: "Draft friendly, on-brand replies to customer questions.",
    description:
      "Describe the customer issue and desired resolution. The assistant writes a reply in your chosen tone that solves the problem and invites follow-up.",
    systemRole:
      "You are a customer support specialist. You write friendly, clear, and on-brand replies that solve the issue and invite further questions.",
    userInstructionTemplate:
      "Draft a {{tone}} reply to this customer message.\n\nIssue: {{issue}}\n\nResolution or answer: {{resolution}}\n\nKeep it concise, empathetic, and include a closing invitation.",
    inputVariable: [
      {
        variableName: "issue",
        description: "Customer message or issue",
        type: "long_text",
      },
      {
        variableName: "resolution",
        description: "How to resolve or answer",
        type: "long_text",
      },
      {
        variableName: "tone",
        description: "Reply tone",
        type: "select",
        options: [
          { label: "Empathetic", value: "Empathetic" },
          { label: "Professional", value: "Professional" },
          { label: "Casual", value: "Casual" },
        ],
      },
    ],
    outputFormat: "plain",
    costPerRun: "0.0200",
    modelEngine: "gpt-4o-mini",
    provider: "openai",
    categories: ["Customer Support", "Productivity"],
    tags: ["Customer Support", "Email"],
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
  {
    name: "Logo Design Generator",
    excerpt: "Generate clean logo concepts and prompts from a brand brief.",
    description:
      "Enter your brand name, industry, and style preferences. The assistant builds a detailed prompt for a logo image and describes the concept.",
    systemRole:
      "You are a brand designer and prompt engineer. You craft clean, professional logo design prompts suitable for vector-style image generators.",
    userInstructionTemplate:
      "Design a logo for {{brandName}}. Industry: {{industry}}. Style: {{style}}. Color palette: {{colors}}. Icon idea: {{idea}}. Output only the final image prompt.",
    inputVariable: [
      {
        variableName: "brandName",
        description: "Brand or company name",
        type: "text",
      },
      {
        variableName: "industry",
        description: "Industry or niche",
        type: "text",
      },
      {
        variableName: "style",
        description: "Logo style",
        type: "select",
        options: [
          { label: "Minimalist", value: "minimalist" },
          { label: "Modern", value: "modern" },
          { label: "Vintage", value: "vintage" },
          { label: "Playful", value: "playful" },
        ],
      },
      {
        variableName: "colors",
        description: "Preferred colors",
        type: "text",
      },
      {
        variableName: "idea",
        description: "Symbol or concept",
        type: "long_text",
      },
    ],
    outputFormat: "image",
    costPerRun: "0.0800",
    modelEngine: "fal-ai/recraft-v3",
    provider: "fal",
    categories: ["Media & Design", "Business"],
    tags: ["Logo", "Branding", "Image Generation"],
  },
  {
    name: "Product Photo Generator",
    excerpt: "Create clean e-commerce product photos on any background.",
    description:
      "Describe your product, background, and lighting. The assistant generates a polished product photo suitable for listings.",
    systemRole:
      "You are an e-commerce photographer and prompt engineer. You create product photography prompts with clean backgrounds, flattering lighting, and realistic detail.",
    userInstructionTemplate:
      "Generate a product photo of {{product}} on a {{background}} background. Lighting: {{lighting}}. Style: {{style}}. Make it sharp, commercial, and e-commerce ready.",
    inputVariable: [
      {
        variableName: "product",
        description: "Product to photograph",
        type: "text",
      },
      {
        variableName: "background",
        description: "Background style",
        type: "select",
        options: [
          { label: "White seamless", value: "white seamless" },
          { label: "Gradient", value: "gradient" },
          { label: "Lifestyle scene", value: "lifestyle scene" },
        ],
      },
      {
        variableName: "lighting",
        description: "Lighting style",
        type: "select",
        options: [
          { label: "Soft studio", value: "soft studio" },
          { label: "Natural daylight", value: "natural daylight" },
          { label: "Dramatic", value: "dramatic" },
        ],
      },
      {
        variableName: "style",
        description: "Photo style",
        type: "select",
        options: [
          { label: "Photorealistic", value: "photorealistic" },
          { label: "Clean render", value: "clean render" },
        ],
      },
    ],
    outputFormat: "image",
    costPerRun: "0.1000",
    modelEngine: "fal-ai/flux/dev",
    provider: "fal",
    categories: ["Media & Design", "E-commerce"],
    tags: ["Image Generation", "Product Photography", "E-commerce"],
  },
  {
    name: "App Icon Generator",
    excerpt: "Generate crisp app icons for iOS, Android, and web apps.",
    description:
      "Enter app name, concept, style, and background. The assistant creates a square app icon prompt.",
    systemRole:
      "You are an app icon designer. You create crisp, recognizable app icon prompts with clear shapes, balanced colors, and platform-safe detail.",
    userInstructionTemplate:
      "Create a 1:1 app icon for {{appName}}. Concept: {{concept}}. Style: {{style}}. Background: {{background}}. Make it simple, scalable, and visually distinct.",
    inputVariable: [
      {
        variableName: "appName",
        description: "App name",
        type: "text",
      },
      {
        variableName: "concept",
        description: "What the icon should show",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Icon style",
        type: "select",
        options: [
          { label: "Flat", value: "flat" },
          { label: "Skeuomorphic", value: "skeuomorphic" },
          { label: "Neumorphic", value: "neumorphic" },
          { label: "Glassmorphism", value: "glassmorphism" },
        ],
      },
      {
        variableName: "background",
        description: "Background color or style",
        type: "text",
      },
    ],
    outputFormat: "image",
    costPerRun: "0.0600",
    modelEngine: "fal-ai/flux/schnell",
    provider: "fal",
    categories: ["Media & Design", "Development"],
    tags: ["Icon", "Design", "Image Generation"],
  },
  {
    name: "Social Media Banner Maker",
    excerpt:
      "Create cover and banner images for social profiles and campaigns.",
    description:
      "Enter brand, platform, theme, and any text overlay. The assistant generates a banner prompt sized for the platform.",
    systemRole:
      "You are a social media designer. You create banner/cover image prompts that match platform aspect ratios, leave space for text, and fit the brand.",
    userInstructionTemplate:
      "Create a {{platform}} banner for {{brand}}. Theme: {{theme}}. Text area reserved for: {{text}}. Make it eye-catching and on-brand.",
    inputVariable: [
      {
        variableName: "brand",
        description: "Brand or page name",
        type: "text",
      },
      {
        variableName: "platform",
        description: "Platform",
        type: "select",
        options: [
          { label: "LinkedIn", value: "LinkedIn" },
          { label: "Twitter / X", value: "Twitter / X" },
          { label: "YouTube", value: "YouTube" },
          { label: "Facebook", value: "Facebook" },
        ],
      },
      {
        variableName: "theme",
        description: "Visual theme or mood",
        type: "long_text",
      },
      {
        variableName: "text",
        description: "Text that will be overlaid",
        type: "text",
      },
    ],
    outputFormat: "image",
    costPerRun: "0.0800",
    modelEngine: "fal-ai/flux/dev",
    provider: "fal",
    categories: ["Media & Design", "Marketing"],
    tags: ["Image Generation", "Social Media", "Banner"],
  },
  {
    name: "Illustration Generator",
    excerpt: "Generate unique illustrations for articles, apps, and decks.",
    description:
      "Describe the subject, art style, mood, and aspect ratio. The assistant creates a detailed illustration prompt.",
    systemRole:
      "You are an illustrator and prompt engineer. You craft detailed illustration prompts with consistent style, mood, lighting, and composition.",
    userInstructionTemplate:
      "Create an illustration of {{subject}} in a {{style}} style. Mood: {{mood}}. Aspect ratio: {{aspectRatio}}. Make it cohesive and visually striking.",
    inputVariable: [
      {
        variableName: "subject",
        description: "What to illustrate",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Art style",
        type: "select",
        options: [
          { label: "Flat vector", value: "flat vector" },
          { label: "Watercolor", value: "watercolor" },
          { label: "Line art", value: "line art" },
          { label: "3D isometric", value: "3D isometric" },
        ],
      },
      {
        variableName: "mood",
        description: "Mood or atmosphere",
        type: "select",
        options: [
          { label: "Cheerful", value: "cheerful" },
          { label: "Dramatic", value: "dramatic" },
          { label: "Calm", value: "calm" },
        ],
      },
      {
        variableName: "aspectRatio",
        description: "Aspect ratio",
        type: "select",
        options: [
          { label: "16:9", value: "16:9" },
          { label: "4:3", value: "4:3" },
          { label: "1:1", value: "1:1" },
        ],
      },
    ],
    outputFormat: "image",
    costPerRun: "0.0800",
    modelEngine: "fal-ai/flux/schnell",
    provider: "fal",
    categories: ["Media & Design", "Creative"],
    tags: ["Illustration", "Image Generation", "Design"],
  },
  {
    name: "Wallpaper Generator",
    excerpt: "Create custom desktop and phone wallpapers.",
    description:
      "Describe a subject, style, and color palette. The assistant generates a wallpaper prompt in your chosen aspect ratio.",
    systemRole:
      "You are a digital artist. You create wallpaper prompts with balanced composition, rich detail, and colors that work as backgrounds.",
    userInstructionTemplate:
      "Generate a {{style}} wallpaper featuring {{subject}}. Color palette: {{colors}}. Aspect ratio: {{aspectRatio}}. Keep it clean enough for icons and widgets.",
    inputVariable: [
      {
        variableName: "subject",
        description: "Main subject or theme",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Wallpaper style",
        type: "select",
        options: [
          { label: "Minimal", value: "minimal" },
          { label: "Abstract", value: "abstract" },
          { label: "Landscape", value: "landscape" },
          { label: "Futuristic", value: "futuristic" },
        ],
      },
      {
        variableName: "colors",
        description: "Preferred colors",
        type: "text",
      },
      {
        variableName: "aspectRatio",
        description: "Aspect ratio",
        type: "select",
        options: [
          { label: "16:9 desktop", value: "16:9" },
          { label: "9:16 phone", value: "9:16" },
          { label: "1:1", value: "1:1" },
        ],
      },
    ],
    outputFormat: "image",
    costPerRun: "0.1000",
    modelEngine: "fal-ai/flux/dev",
    provider: "fal",
    categories: ["Media & Design", "Creative"],
    tags: ["Wallpaper", "Image Generation"],
  },
  {
    name: "Avatar Portrait Generator",
    excerpt: "Generate stylized avatar portraits for profiles and teams.",
    description:
      "Describe the person or character, pick a style and background, and generate a 1:1 avatar portrait.",
    systemRole:
      "You are a portrait prompt engineer. You create avatar prompts that capture likeness, style, and a clean 1:1 composition.",
    userInstructionTemplate:
      "Generate a {{style}} avatar portrait of {{description}}. Background: {{background}}. Aspect ratio: 1:1. Make it suitable for a profile picture.",
    inputVariable: [
      {
        variableName: "description",
        description: "Person or character description",
        type: "long_text",
      },
      {
        variableName: "style",
        description: "Portrait style",
        type: "select",
        options: [
          { label: "Photorealistic", value: "photorealistic" },
          { label: "Anime", value: "anime" },
          { label: "Pixel art", value: "pixel art" },
          { label: "Painted", value: "painted" },
        ],
      },
      {
        variableName: "background",
        description: "Background description",
        type: "text",
      },
    ],
    outputFormat: "image",
    costPerRun: "0.0800",
    modelEngine: "fal-ai/flux/schnell",
    provider: "fal",
    categories: ["Media & Design", "Creative"],
    tags: ["Avatar", "Image Generation", "Photography"],
  },
]

export function planModelSeed(
  existing: { provider: string; modelId: string }[],
  allowedProviders: Set<ApiKeyProvider>,
): {
  created: SeedModel[]
  skipped: number
  removed: { provider: string; modelId: string; displayName: string }[]
} {
  const existingKeys = new Set(
    existing.map((model) => `${model.provider}:${model.modelId}`),
  )
  const created: SeedModel[] = []
  let skipped = 0
  const removed: { provider: string; modelId: string; displayName: string }[] =
    []

  for (const model of aiModels) {
    if (!allowedProviders.has(model.provider)) {
      if (existingKeys.has(`${model.provider}:${model.modelId}`)) {
        removed.push({
          provider: model.provider,
          modelId: model.modelId,
          displayName: model.displayName,
        })
      }
      continue
    }

    if (existingKeys.has(`${model.provider}:${model.modelId}`)) {
      skipped++
      continue
    }

    created.push(model)
  }

  return { created, skipped, removed }
}

export async function seedAIModels(
  apiKeyByProvider: Map<ApiKeyProvider, string>,
): Promise<{ created: number; skipped: number; removed: number }> {
  const existing = await listAIModels()
  const allowedProviders = new Set(apiKeyByProvider.keys())
  const { created, skipped, removed } = planModelSeed(
    existing,
    allowedProviders,
  )

  for (const model of removed) {
    await deleteAIModelByProviderAndModelId(model.provider, model.modelId)
    console.info(
      `Removed AI model: ${model.displayName} (${model.provider}) — no API key`,
    )
  }

  for (const model of created) {
    await createAIModel(model)
    console.info(`Created AI model: ${model.displayName} (${model.provider})`)
  }

  return { created: created.length, skipped, removed: removed.length }
}

async function deleteAIModelByProviderAndModelId(
  provider: string,
  modelId: string,
): Promise<void> {
  const model = await findAIModelByProviderAndModelId(provider, modelId)
  if (model) {
    await deleteAIModelById(model.id)
  }
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

    const envValue = API_KEY_ENV_VARS[provider]
      ? process.env[API_KEY_ENV_VARS[provider]]
      : undefined
    const fallbackValue = API_KEY_FALLBACK[provider]
    const value = envValue ?? fallbackValue
    if (!value) continue

    const encrypted = encryptApiKey(value)
    const config: ApiKeyConfig = {
      id: createCustomId(),
      provider,
      name: envValue
        ? DEFAULT_KEY_NAMES[provider]
        : `${DEFAULT_KEY_NAMES[provider]} (mock)`,
      apiKey: encrypted,
      status: "active",
      createdAt: today(),
      updatedAt: today(),
    }

    keys.push(config)
    map.set(provider, config.id)
    added = true
    console.info(`Created API key: ${provider}${envValue ? "" : " (mock)"}`)
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

    const workflow = buildWorkflowFromSeed(
      product.name,
      product.systemRole,
      product.userInstructionTemplate,
      product.inputVariable,
      product.outputFormat,
    )

    const { content, html } = buildRichDescription(
      product.description,
      defaultHighlights(product),
    )

    await createProduct({
      name: product.name,
      excerpt: product.excerpt,
      description: html,
      descriptionContent: content,
      status: "active",
      config: { modelEngine },
      workflow,
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

function buildWorkflowFromSeed(
  name: string,
  systemRole: string,
  userInstructionTemplate: string,
  inputVariable: InputVariable[],
  outputFormat: "plain" | "json" | "image" | "video",
): ProductWorkflow {
  const inputNodeId = "input_1"
  const nodes: ProductWorkflow["nodes"] = [
    {
      id: inputNodeId,
      type: "input",
      position: { x: 100, y: 100 },
      data: {
        label: `${name} Inputs`,
        fields: inputVariable.map((v) => ({
          variableName: v.variableName,
          description: v.description,
          type: v.type as InputField["type"],
          ...(v.options && { options: v.options }),
        })),
      },
    },
  ]
  const edges: ProductWorkflow["edges"] = []

  const countVar = inputVariable.find((v) => v.variableName === "count")
  const branchVar =
    inputVariable.find(
      (v) =>
        v.variableName === "platform" && v.options && v.options.length >= 2,
    ) ??
    inputVariable.find(
      (v) => v.variableName === "style" && v.options && v.options.length >= 2,
    ) ??
    inputVariable.find(
      (v) => v.variableName === "tone" && v.options && v.options.length >= 2,
    )

  if (countVar) {
    const loopId = "loop_1"
    nodes.push({
      id: loopId,
      type: "loop",
      position: { x: 400, y: 100 },
      data: {
        label: "Generate variants",
        itemsExpression: `Array.from({length: Number('{{${countVar.variableName}}}')}).map((_, i) => i + 1)`,
        itemName: "iteration",
        maxIterations: 10,
      },
    })
    edges.push({
      id: "e_input_loop",
      source: inputNodeId,
      target: loopId,
    })

    const aiLoopId = "ai_variant"
    const loopTemplate = `${userInstructionTemplate
      .replaceAll(`{{${countVar.variableName}}}`, "1")
      .trim()}\n\nOnly generate option number {{iteration}}. Do not include any other options.`

    nodes.push({
      id: aiLoopId,
      type: "ai",
      position: { x: 700, y: 100 },
      data: {
        label: "Generate variant",
        systemRole,
        userInstructionTemplate: loopTemplate,
        outputName: "variantResult",
        outputFormat,
      },
    })
    edges.push({
      id: "e_loop_ai",
      source: loopId,
      target: aiLoopId,
    })

    const outputNodeId = "output_1"
    nodes.push({
      id: outputNodeId,
      type: "output",
      position: { x: 1000, y: 100 },
      data: {
        label: "Final Output",
        template: `{{${loopId}_result}}`,
        outputName: "finalOutput",
      },
    })
    edges.push({
      id: "e_loop_output",
      source: loopId,
      target: outputNodeId,
    })

    return { nodes, edges }
  }

  if (branchVar?.options && branchVar.options.length >= 2) {
    const conditionId = "condition_1"
    const firstOption = branchVar.options[0].value
    nodes.push({
      id: conditionId,
      type: "condition",
      position: { x: 400, y: 100 },
      data: {
        label: `Branch on ${branchVar.variableName}`,
        expression: `'{{${branchVar.variableName}}}' === '${firstOption}'`,
      },
    })
    edges.push({
      id: "e_input_condition",
      source: inputNodeId,
      target: conditionId,
    })

    const aiTrueId = "ai_branch_true"
    const aiFalseId = "ai_branch_false"
    const trueSystemRole = `${systemRole}\n\nOptimize the output specifically for the "${firstOption}" ${branchVar.variableName}.`
    const falseSystemRole = `${systemRole}\n\nKeep the output flexible for any ${branchVar.variableName}.`

    nodes.push({
      id: aiTrueId,
      type: "ai",
      position: { x: 700, y: 50 },
      data: {
        label: `For ${firstOption}`,
        systemRole: trueSystemRole,
        userInstructionTemplate,
        outputName: "result",
        outputFormat,
      },
    })
    nodes.push({
      id: aiFalseId,
      type: "ai",
      position: { x: 700, y: 200 },
      data: {
        label: `For other ${branchVar.variableName}`,
        systemRole: falseSystemRole,
        userInstructionTemplate,
        outputName: "result",
        outputFormat,
      },
    })

    edges.push({
      id: "e_cond_true",
      source: conditionId,
      target: aiTrueId,
      sourceHandle: `{{${conditionId}_result}}`,
    })
    edges.push({
      id: "e_cond_false",
      source: conditionId,
      target: aiFalseId,
      sourceHandle: `!{{${conditionId}_result}}`,
    })

    const outputNodeId = "output_1"
    nodes.push({
      id: outputNodeId,
      type: "output",
      position: { x: 1000, y: 100 },
      data: {
        label: "Final Output",
        template: "{{result}}",
        outputName: "finalOutput",
      },
    })
    edges.push({
      id: "e_true_out",
      source: aiTrueId,
      target: outputNodeId,
    })
    edges.push({
      id: "e_false_out",
      source: aiFalseId,
      target: outputNodeId,
    })

    return { nodes, edges }
  }

  const aiNodeId = "ai_1"
  const outputNodeId = "output_1"
  nodes.push({
    id: aiNodeId,
    type: "ai",
    position: { x: 400, y: 100 },
    data: {
      label: "Generate",
      systemRole,
      userInstructionTemplate,
      outputName: "result",
      outputFormat,
    },
  })
  nodes.push({
    id: outputNodeId,
    type: "output",
    position: { x: 700, y: 100 },
    data: {
      label: "Final Output",
      template: "{{result}}",
      outputName: "finalOutput",
    },
  })
  edges.push({
    id: "e1",
    source: inputNodeId,
    target: aiNodeId,
  })
  edges.push({
    id: "e2",
    source: aiNodeId,
    target: outputNodeId,
  })

  return { nodes, edges }
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
  await db.execute(sql`
    TRUNCATE TABLE
      ${productRunsTable},
      ${productVersionsTable},
      ${productTagsTable},
      ${productCategoriesTable},
      ${productsTable},
      ${tagsTable},
      ${categoriesTable},
      ${aiModelsTable},
      ${assetsTable}
    CASCADE
  `)
  await db
    .delete(adminSettingsTable)
    .where(eq(adminSettingsTable.settingKey, API_KEY_SETTING_KEY))

  console.info("Cleared seed data")
}

async function main(): Promise<void> {
  const agreed = await confirm(
    "Seed will delete all existing products, categories, tags, models, and API key settings, then recreate them. Continue?",
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
  aiModels: { created: number; skipped: number; removed: number }
  categories: number
  tags: number
  products: { created: number; skipped: number }
}> {
  const apiKeyByProvider = await seedApiKeys()

  const modelResult = await seedAIModels(apiKeyByProvider)
  console.info(
    `Seeded ${modelResult.created} AI models, skipped ${modelResult.skipped}, removed ${modelResult.removed}`,
  )

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
