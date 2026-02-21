import { env } from "@repo/env"
import { logger } from "@repo/logger"
import { createCustomId } from "@repo/utils/custom-id"
import { eq } from "drizzle-orm"
import { drizzle } from "drizzle-orm/node-postgres"

import {
  categoriesTable,
  tagsTable,
  toolCategoriesTable,
  toolsTable,
  toolTagsTable,
} from "./schema"

const databaseUrl = env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const db = drizzle(databaseUrl)

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

async function clearExistingTools() {
  logger.info("🗑️  Clearing existing demo tools...")

  const demoToolSlugs = [
    "article-summarizer",
    "essay-analyzer",
    "budget-calculator",
    "meeting-agenda-generator",
    "writing-style-converter",
    "image-description-generator",
    "video-content-analyzer",
    "product-review-analyzer",
    "social-media-image-creator",
    "tutorial-video-generator",
    "comprehensive-content-generator",
  ]

  try {
    for (const slug of demoToolSlugs) {
      const tools = await db
        .select({ id: toolsTable.id })
        .from(toolsTable)
        .where(eq(toolsTable.slug, slug))

      for (const tool of tools) {
        await db
          .delete(toolCategoriesTable)
          .where(eq(toolCategoriesTable.toolId, tool.id))
        await db.delete(toolTagsTable).where(eq(toolTagsTable.toolId, tool.id))
      }

      await db.delete(toolsTable).where(eq(toolsTable.slug, slug))
    }
    logger.info("✅ Cleared existing demo tools")
  } catch (error) {
    logger.warn(
      `⚠️  No existing tools to clear or error occurred: ${String(error)}`,
    )
  }
}

async function seedCategories() {
  logger.info("🌱 Seeding categories...")

  const categories = [
    {
      name: "Content Creation",
      slug: "content-creation",
      description: "Tools for creating and generating content",
      icon: "FileText",
      sortOrder: 1,
    },
    {
      name: "Analysis",
      slug: "analysis",
      description: "Tools for analyzing and processing data",
      icon: "LineChart",
      sortOrder: 2,
    },
    {
      name: "Finance",
      slug: "finance",
      description: "Financial and budgeting tools",
      icon: "DollarSign",
      sortOrder: 3,
    },
    {
      name: "Productivity",
      slug: "productivity",
      description: "Tools to boost productivity",
      icon: "Zap",
      sortOrder: 4,
    },
    {
      name: "Media",
      slug: "media",
      description: "Image and video processing tools",
      icon: "Image",
      sortOrder: 5,
    },
  ]

  const createdCategories: Record<string, string> = {}

  for (const category of categories) {
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, category.slug))

    if (existing) {
      createdCategories[category.slug] = existing.id
      logger.info(`✓ Category exists: ${category.name}`)
    } else {
      const id = createCustomId()
      await db.insert(categoriesTable).values({ id, ...category })
      createdCategories[category.slug] = id
      logger.info(`✅ Seeded category: ${category.name}`)
    }
  }

  return createdCategories
}

async function seedTags() {
  logger.info("🌱 Seeding tags...")

  const tags = [
    { name: "Text Processing", slug: "text-processing" },
    { name: "AI", slug: "ai" },
    { name: "Automation", slug: "automation" },
    { name: "Business", slug: "business" },
    { name: "Creative", slug: "creative" },
    { name: "Education", slug: "education" },
    { name: "Social Media", slug: "social-media" },
    { name: "Video", slug: "video" },
    { name: "Image", slug: "image" },
    { name: "Analytics", slug: "analytics" },
  ]

  const createdTags: Record<string, string> = {}

  for (const tag of tags) {
    const [existing] = await db
      .select()
      .from(tagsTable)
      .where(eq(tagsTable.slug, tag.slug))

    if (existing) {
      createdTags[tag.slug] = existing.id
      logger.info(`✓ Tag exists: ${tag.name}`)
    } else {
      const id = createCustomId()
      await db.insert(tagsTable).values({ id, ...tag })
      createdTags[tag.slug] = id
      logger.info(`✅ Seeded tag: ${tag.name}`)
    }
  }

  return createdTags
}

async function seedTools() {
  logger.info("🌱 Seeding tools...")

  const categories = await seedCategories()
  const tags = await seedTags()

  const tools = [
    {
      id: createCustomId(),
      name: "Article Summarizer",
      slug: createSlug("Article Summarizer"),
      description:
        "Summarize any article or text into key points and main ideas.",
      status: "active" as const,
      systemRole:
        "You are an expert content summarizer. Your task is to analyze articles and extract the most important information concisely.",
      userInstructionTemplate:
        "Please summarize the following article in clear, concise bullet points:\n\n{{article_text}}",
      inputVariable: [
        {
          variableName: "article_text",
          type: "text",
          description: "Paste the article text here",
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0100",
      markup: "0.2000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["content-creation"]],
      tagIds: [tags["text-processing"], tags["ai"]],
    },

    {
      id: createCustomId(),
      name: "Essay Analyzer",
      slug: createSlug("Essay Analyzer"),
      description:
        "Analyze essays and documents to extract structure, key themes, and writing quality metrics.",
      status: "active" as const,
      systemRole:
        "You are a professional essay analyst. Analyze the provided essay and return structured JSON data with analysis results.",
      userInstructionTemplate:
        'Analyze this essay and return JSON with the following structure: {"word_count": number, "reading_time_minutes": number, "main_themes": string[], "tone": string, "readability_score": number, "key_strengths": string[], "suggestions": string[]}.\n\nEssay:\n{{essay_content}}',
      inputVariable: [
        {
          variableName: "essay_content",
          type: "long_text",
          description: "Paste the full essay content here",
        },
      ],
      outputFormat: "json" as const,
      costPerRun: "0.0150",
      markup: "0.2500",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.5,
        maxTokens: 2048,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["analysis"], categories["content-creation"]],
      tagIds: [tags["text-processing"], tags["ai"], tags["education"]],
    },

    {
      id: createCustomId(),
      name: "Budget Calculator",
      slug: createSlug("Budget Calculator"),
      description:
        "Calculate monthly budget breakdown and savings recommendations based on your income.",
      status: "active" as const,
      systemRole:
        "You are a financial advisor specializing in personal budgeting. Provide practical budget breakdowns using the 50/30/20 rule.",
      userInstructionTemplate:
        "Based on a monthly income of ${{monthly_income}}, provide a detailed budget breakdown following the 50/30/20 rule (50% needs, 30% wants, 20% savings). Include specific categories and amounts.",
      inputVariable: [
        {
          variableName: "monthly_income",
          type: "number",
          description: "Your monthly income in dollars",
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0080",
      markup: "0.2000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.3,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["finance"]],
      tagIds: [tags["business"], tags["automation"]],
    },

    {
      id: createCustomId(),
      name: "Meeting Agenda Generator",
      slug: createSlug("Meeting Agenda Generator"),
      description:
        "Generate meeting agendas with optional time allocations for each topic.",
      status: "active" as const,
      systemRole:
        "You are a professional meeting facilitator. Create well-structured meeting agendas.",
      userInstructionTemplate:
        "Create a meeting agenda for: {{meeting_topic}}.\n\n{{#if include_time_slots}}Include suggested time allocations for each agenda item.{{/if}}{{^if include_time_slots}}List agenda items without time allocations.{{/if}}",
      inputVariable: [
        {
          variableName: "meeting_topic",
          type: "text",
          description: "Main topic or purpose of the meeting",
        },
        {
          variableName: "include_time_slots",
          type: "boolean",
          description: "Include time allocations for each agenda item",
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0100",
      markup: "0.2000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["productivity"]],
      tagIds: [tags["business"], tags["automation"]],
    },

    {
      id: createCustomId(),
      name: "Writing Style Converter",
      slug: createSlug("Writing Style Converter"),
      description:
        "Convert your text to different writing styles: formal, casual, or technical.",
      status: "active" as const,
      systemRole:
        "You are a versatile writing assistant capable of adapting text to different styles while maintaining the core message.",
      userInstructionTemplate:
        "Convert the following text to a {{writing_style}} style:\n\n{{original_text}}",
      inputVariable: [
        {
          variableName: "original_text",
          type: "text",
          description: "The text you want to convert",
        },
        {
          variableName: "writing_style",
          type: "select",
          description: "Choose the target writing style",
          options: [
            { label: "Formal / Professional", value: "formal" },
            { label: "Casual / Friendly", value: "casual" },
            { label: "Technical / Academic", value: "technical" },
          ],
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0100",
      markup: "0.2000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["content-creation"]],
      tagIds: [tags["text-processing"], tags["creative"]],
    },

    {
      id: createCustomId(),
      name: "Image Description Generator",
      slug: createSlug("Image Description Generator"),
      description:
        "Generate detailed, accessible descriptions of images for visually impaired users or SEO.",
      status: "active" as const,
      systemRole:
        "You are an expert at describing visual content in detail. Provide comprehensive, accurate descriptions of images.",
      userInstructionTemplate:
        "Analyze this image and provide a detailed description including: objects, people, setting, colors, mood, and any text visible. Image: {{input_image}}",
      inputVariable: [
        {
          variableName: "input_image",
          type: "image",
          description: "Upload the image to analyze",
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0200",
      markup: "0.3000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["media"], categories["analysis"]],
      tagIds: [tags["image"], tags["ai"]],
    },

    {
      id: createCustomId(),
      name: "Video Content Analyzer",
      slug: createSlug("Video Content Analyzer"),
      description:
        "Analyze video content and generate summaries, key moments, and transcription highlights.",
      status: "active" as const,
      systemRole:
        "You are a video content analyst. Extract key information and create useful summaries from video content.",
      userInstructionTemplate:
        "Analyze this video and provide: 1) A brief summary, 2) Key moments or scenes, 3) Main topics discussed, 4) Suggested use cases. Video: {{input_video}}",
      inputVariable: [
        {
          variableName: "input_video",
          type: "video",
          description: "Upload the video to analyze",
        },
      ],
      outputFormat: "plain" as const,
      costPerRun: "0.0300",
      markup: "0.3000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 2048,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["media"], categories["analysis"]],
      tagIds: [tags["video"], tags["ai"], tags["analytics"]],
    },

    {
      id: createCustomId(),
      name: "Product Review Analyzer",
      slug: createSlug("Product Review Analyzer"),
      description:
        "Analyze product reviews and generate structured sentiment analysis with ratings.",
      status: "active" as const,
      systemRole:
        "You are a sentiment analysis expert. Analyze product reviews and provide structured JSON output.",
      userInstructionTemplate:
        'Analyze this product review and return JSON with: {"overall_sentiment": "positive|neutral|negative", "rating_estimate": number (1-5), "pros": string[], "cons": string[], "key_phrases": string[], "recommendation": string}.\n\nProduct: {{product_name}}\nReview: {{review_text}}',
      inputVariable: [
        {
          variableName: "product_name",
          type: "text",
          description: "Name of the product",
        },
        {
          variableName: "review_text",
          type: "long_text",
          description: "The product review text",
        },
      ],
      outputFormat: "json" as const,
      costPerRun: "0.0120",
      markup: "0.2500",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.5,
        maxTokens: 1536,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["analysis"]],
      tagIds: [tags["business"], tags["analytics"], tags["ai"]],
    },

    {
      id: createCustomId(),
      name: "Social Media Image Creator",
      slug: createSlug("Social Media Image Creator"),
      description:
        "Generate eye-catching social media post images based on your topic and style preferences.",
      status: "active" as const,
      systemRole:
        "You are a creative graphic designer specializing in social media content. Generate engaging visual content.",
      userInstructionTemplate:
        "Create a visually appealing social media image for: {{post_topic}}. Style: {{image_style}}. The image should be modern, engaging, and suitable for {{platform}}.",
      inputVariable: [
        {
          variableName: "post_topic",
          type: "text",
          description: "Topic or theme of the post",
        },
        {
          variableName: "image_style",
          type: "select",
          description: "Visual style for the image",
          options: [
            { label: "Minimalist", value: "minimalist" },
            { label: "Vibrant & Colorful", value: "vibrant" },
            { label: "Professional", value: "professional" },
            { label: "Artistic", value: "artistic" },
          ],
        },
        {
          variableName: "platform",
          type: "select",
          description: "Target social media platform",
          options: [
            { label: "Instagram", value: "instagram" },
            { label: "Twitter/X", value: "twitter" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "Facebook", value: "facebook" },
          ],
        },
      ],
      outputFormat: "image" as const,
      costPerRun: "0.0400",
      markup: "0.4000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.8,
        maxTokens: 1024,
      },
      isPublic: true,
      apiKeyId: null,
      createdBy: null,
      categoryIds: [categories["media"], categories["content-creation"]],
      tagIds: [tags["social-media"], tags["image"], tags["creative"]],
    },

    {
      id: createCustomId(),
      name: "Tutorial Video Generator",
      slug: createSlug("Tutorial Video Generator"),
      description:
        "Generate short tutorial videos explaining concepts or processes step-by-step.",
      status: "active" as const,
      systemRole:
        "You are an instructional designer who creates clear, educational video content.",
      userInstructionTemplate:
        "Create a short tutorial video explaining: {{tutorial_topic}}. Target audience: {{audience_level}}. Duration: {{video_length}} seconds. Include clear steps and visual demonstrations.",
      inputVariable: [
        {
          variableName: "tutorial_topic",
          type: "text",
          description: "What should the tutorial explain?",
        },
        {
          variableName: "audience_level",
          type: "select",
          description: "Technical level of audience",
          options: [
            { label: "Beginner", value: "beginner" },
            { label: "Intermediate", value: "intermediate" },
            { label: "Advanced", value: "advanced" },
          ],
        },
        {
          variableName: "video_length",
          type: "number",
          description: "Desired video length in seconds (30-180)",
        },
      ],
      outputFormat: "video" as const,
      costPerRun: "0.0600",
      markup: "0.5000",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 2048,
      },
      isPublic: true,
      categoryId: null,
      apiKeyId: null,
      createdBy: null,
    },

    {
      id: createCustomId(),
      name: "Comprehensive Content Generator",
      slug: createSlug("Comprehensive Content Generator"),
      description:
        "A comprehensive tool showcasing all input types: text, long_text, number, boolean, select, image, and video.",
      status: "active" as const,
      systemRole:
        "You are a versatile content generator capable of handling multiple input types and producing detailed outputs.",
      userInstructionTemplate:
        'Generate content based on:\n- Title: {{content_title}}\n- Description: {{detailed_description}}\n- Word Count Target: {{target_words}}\n- Include Examples: {{include_examples}}\n- Content Type: {{content_type}}\n- Reference Image: {{reference_image}}\n- Reference Video: {{reference_video}}\n\nProvide structured JSON with: {"generated_content": string, "metadata": {"word_count": number, "estimated_reading_time": number}, "suggestions": string[]}',
      inputVariable: [
        {
          variableName: "content_title",
          type: "text",
          description: "Title of the content",
        },
        {
          variableName: "detailed_description",
          type: "long_text",
          description: "Detailed description or outline",
        },
        {
          variableName: "target_words",
          type: "number",
          description: "Target word count",
        },
        {
          variableName: "include_examples",
          type: "boolean",
          description: "Include practical examples",
        },
        {
          variableName: "content_type",
          type: "select",
          description: "Type of content to generate",
          options: [
            { label: "Blog Post", value: "blog" },
            { label: "Technical Article", value: "technical" },
            { label: "Creative Writing", value: "creative" },
            { label: "Business Report", value: "business" },
          ],
        },
        {
          variableName: "reference_image",
          type: "image",
          description: "Optional reference image",
        },
        {
          variableName: "reference_video",
          type: "video",
          description: "Optional reference video",
        },
      ],
      outputFormat: "json" as const,
      costPerRun: "0.0500",
      markup: "0.3500",
      config: {
        modelEngine: "gpt-4-0613",
        temperature: 0.7,
        maxTokens: 3072,
      },
      isPublic: true,
      categoryId: null,
      apiKeyId: null,
      createdBy: null,
    },
  ]

  try {
    await clearExistingTools()

    for (const tool of tools) {
      await db.insert(toolsTable).values(tool)
      logger.info(`✅ Seeded: ${tool.name}`)
    }

    logger.info(`\n🎉 Successfully seeded ${tools.length} tools!`)
    logger.info("\nTools created:")
    tools.forEach((tool, index) => {
      logger.info(
        `${index + 1}. ${tool.name} (${tool.inputVariable.map((v) => v.type).join(", ")} → ${tool.outputFormat})`,
      )
    })
  } catch (error) {
    logger.error(`❌ Error seeding tools: ${String(error)}`)
    throw error
  }
}

seedTools()
  .then(() => {
    logger.info("\n✨ Seeding completed successfully!")
    process.exit(0)
  })
  .catch((error) => {
    logger.error(`\n💥 Seeding failed: ${error}`)
    process.exit(1)
  })
