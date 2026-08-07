import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  useLoaderData,
  notFound,
  useRouteContext,
  Link,
} from "@tanstack/react-router"
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  CoinsIcon,
  FolderIcon,
  Loader2Icon,
  LogInIcon,
  PlayIcon,
  SparklesIcon,
  TagIcon,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { siteTitle, siteUrl } from "env"
import { queryApi } from "rpc/query"
import { Badge } from "ui/badge"
import { Button } from "ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardPanel,
  CardTitle,
} from "ui/card"
import { Label } from "ui/label"
import { ProductInputField } from "ui/product-input-field"

import { SiteLayout } from "@/components/site-layout"
import { ProductCard } from "@/features/storefront/product-card"
import { RichTextView } from "@/features/storefront/rich-text-view"
import { loginFn } from "@/lib/auth"

export const Route = createFileRoute("/products/$productSlug")({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient
      .fetchQuery(
        queryApi.products.bySlug.queryOptions({
          input: { slug: params.productSlug },
        }),
      )
      .catch(() => null)

    if (product?.status !== "active") {
      throw notFound()
    }

    const [related, popular] = await Promise.all([
      queryClient
        .fetchQuery(
          queryApi.products.related.queryOptions({
            input: { slug: params.productSlug, limit: 4 },
          }),
        )
        .catch(() => []),
      queryClient
        .fetchQuery(queryApi.products.popular.queryOptions())
        .catch(() => []),
    ])

    return { product, related, popular }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) return {}

    const { product } = loaderData
    const productUrl = `${siteUrl ?? "http://localhost:3000"}/products/${product.slug}`
    const description =
      product.excerpt ??
      product.description ??
      `Run ${product.name} AI tool on Yopem.`

    const links: { rel: string; href: string; as?: string; type?: string }[] = [
      { rel: "canonical", href: productUrl },
    ]
    if (product.thumbnail?.url) {
      links.push({
        rel: "preload",
        href: product.thumbnail.url,
        as: "image",
        type: "image/webp",
      })
    }

    return {
      meta: [
        { title: `${product.name} - ${siteTitle ?? "Yopem"}` },
        { name: "description", content: description },
        { property: "og:title", content: product.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: productUrl },
        ...(product.thumbnail?.url
          ? [{ property: "og:image", content: product.thumbnail.url }]
          : []),
      ],
      links,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: product.name,
            description: description,
            applicationCategory:
              product.categories?.[0]?.name ?? "UtilitiesApplication",
            operatingSystem: "All",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
            url: productUrl,
          }),
        },
      ],
    }
  },
  component: ProductDetailComponent,
})

function useContentExceedsViewport(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.5,
) {
  const [exceeds, setExceeds] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => {
      setExceeds(el.scrollHeight > window.innerHeight * threshold)
    }

    update()
    window.addEventListener("resize", update)
    return () => window.removeEventListener("resize", update)
  }, [ref, threshold])

  return exceeds
}

function ProductDetailComponent() {
  const {
    product,
    related: initialRelated,
    popular: initialPopular,
  } = useLoaderData({ from: "/products/$productSlug" })
  const { session } = useRouteContext({ from: "__root__" })

  const fileReaderRef = useRef<FileReader | null>(null)
  const [executionResult, setExecutionResult] = useState<unknown>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

  const descriptionRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const descriptionIsLong = useContentExceedsViewport(descriptionRef, 0.5)

  // Related products query with fallback to popular
  const relatedQuery = useQuery(
    queryApi.products.related.queryOptions({
      input: { slug: product.slug, limit: 4 },
    }),
  )
  const popularQuery = useQuery(queryApi.products.popular.queryOptions())

  const relatedProducts =
    relatedQuery.data && relatedQuery.data.length > 0
      ? relatedQuery.data
      : initialRelated && initialRelated.length > 0
        ? initialRelated
        : (popularQuery.data ?? initialPopular)
            .filter((p) => p.id !== product.id)
            .slice(0, 4)

  // Execute mutation
  const executeMutation = useMutation(
    queryApi.products.execute.mutationOptions({
      onSuccess: (data) => {
        setExecutionResult(data.output)
        setExecutionError(null)
      },
      onError: (err) => {
        setExecutionError(err.message || "Failed to execute tool")
      },
    }),
  )

  // Extract workflow input fields
  const workflowNodes =
    (
      product.workflow as {
        nodes?: { type: string; data?: { fields?: unknown[] } }[]
      }
    )?.nodes ?? []
  const inputNodes = workflowNodes.filter((n) => n.type === "input")
  const inputFields: {
    variableName: string
    description: string
    type: string
    isOptional?: boolean
    options?: { label: string; value: string }[]
  }[] = inputNodes.flatMap(
    (n) =>
      (n.data?.fields as {
        variableName: string
        description: string
        type: string
        isOptional?: boolean
        options?: { label: string; value: string }[]
      }[]) ?? [],
  )

  const defaultValues: Record<string, string> = {}
  for (const f of inputFields) {
    defaultValues[f.variableName] = ""
  }

  const form = useForm({
    defaultValues,
    onSubmit: ({ value }) => {
      setExecutionError(null)
      executeMutation.mutate({
        id: product.id,
        inputs: value,
      })
    },
  })

  const handleRunLoginRedirect = async () => {
    const currentPath = `/products/${product.slug}`
    const res = await loginFn({ data: { returnTo: currentPath } })
    if (res.redirectTo) {
      window.location.href = res.redirectTo
    }
  }

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {/* Header / Product Title Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.categories?.map((cat) => (
              <Link
                key={cat.id}
                to="/c/$categorySlug"
                params={{ categorySlug: cat.slug }}
              >
                <Badge variant="outline" className="gap-1 text-xs">
                  <FolderIcon className="size-3" />
                  {cat.name}
                </Badge>
              </Link>
            ))}
            {product.tags?.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                <TagIcon className="mr-1 size-3" />
                {tag.name}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {product.name}
            </h1>

            {product.excerpt && (
              <p className="text-muted-foreground max-w-3xl text-base leading-relaxed">
                {product.excerpt}
              </p>
            )}
          </div>

          <div className="text-muted-foreground flex flex-wrap items-center gap-3 pt-1 text-xs font-medium">
            <div className="border-border bg-muted/20 flex items-center gap-1.5 rounded-md border px-2.5 py-1">
              <CoinsIcon className="text-muted-foreground size-3.5" />
              <span>
                {product.creditsPerRun
                  ? `${product.creditsPerRun} credits per run`
                  : "Free execution"}
              </span>
            </div>
            <div className="border-border bg-muted/20 flex items-center gap-1.5 rounded-md border px-2.5 py-1">
              <SparklesIcon className="text-muted-foreground size-3.5" />
              <span>Format: {product.outputFormat ?? "plain"}</span>
            </div>
          </div>
        </div>

        {/* LCP thumbnail */}
        {product.thumbnail?.url && (
          <div className="border-border relative aspect-video w-full overflow-hidden rounded-xl border">
            <img
              src={product.thumbnail.url}
              alt={product.name}
              width={1200}
              height={675}
              fetchPriority="high"
              className="size-full object-cover"
            />
          </div>
        )}

        {/* Main Work Area */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left column: description + form */}
          <div ref={descriptionRef} className="space-y-6">
            {/* Product Full Description */}
            <Card className="border-border bg-card">
              <CardHeader className="border-border border-b pb-3">
                <CardTitle className="font-heading text-base font-semibold">
                  About {product.name}
                </CardTitle>
              </CardHeader>
              <CardPanel className="p-5">
                <RichTextView
                  content={product.descriptionContent}
                  fallbackDescription={product.description}
                />
              </CardPanel>
            </Card>

            {/* Persistent jump-to-form CTA for long descriptions */}
            {descriptionIsLong && (
              <Card className="border-border bg-card">
                <CardPanel className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="font-heading text-sm font-semibold">
                      Ready to run {product.name}?
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Provide inputs and execute the workflow.
                    </CardDescription>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={scrollToForm}>
                    <PlayIcon className="size-3.5 fill-current" />
                    <span>Jump to Run Tool</span>
                  </Button>
                </CardPanel>
              </Card>
            )}

            {/* Tool Form */}
            <div ref={formRef}>
              <Card className="border-border bg-card">
                <CardHeader className="border-border border-b pb-3">
                  <CardTitle className="font-heading flex items-center gap-2 text-lg font-bold">
                    <PlayIcon className="text-foreground size-4" />
                    <span>Run Tool</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Provide inputs to execute this workflow.
                  </CardDescription>
                </CardHeader>
                <CardPanel className="p-5">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void form.handleSubmit()
                    }}
                    className="space-y-4"
                  >
                    {inputFields.length > 0 ? (
                      inputFields.map((field) => (
                        <form.Field
                          key={field.variableName}
                          name={field.variableName}
                          validators={{
                            onBlur: ({ value }) => {
                              if (
                                !field.isOptional &&
                                (!value ||
                                  (typeof value === "string" && !value.trim()))
                              ) {
                                return "This field is required"
                              }
                              return undefined
                            },
                            onSubmit: ({ value }) => {
                              if (
                                !field.isOptional &&
                                (!value ||
                                  (typeof value === "string" && !value.trim()))
                              ) {
                                return "This field is required"
                              }
                              return undefined
                            },
                          }}
                        >
                          {(fieldApi) => (
                            <div className="space-y-1.5">
                              <Label className="text-foreground flex items-center justify-between text-xs font-semibold">
                                <span>
                                  {field.description || field.variableName}
                                </span>
                                {!field.isOptional && (
                                  <span className="text-destructive text-[10px] font-normal">
                                    *Required
                                  </span>
                                )}
                              </Label>
                              <ProductInputField
                                field={field}
                                value={fieldApi.state.value}
                                error={fieldApi.state.meta.errors[0]}
                                fileReaderRef={fileReaderRef}
                                onChange={(_name, val) =>
                                  fieldApi.handleChange(val)
                                }
                                onClearError={() => fieldApi.validate("blur")}
                              />
                              {fieldApi.state.meta.errors.length > 0 && (
                                <p className="text-destructive text-xs font-medium">
                                  {fieldApi.state.meta.errors[0]}
                                </p>
                              )}
                            </div>
                          )}
                        </form.Field>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-xs italic">
                        No parameters required for this tool. Click run to
                        execute.
                      </p>
                    )}

                    {executionError && (
                      <div className="border-destructive/20 bg-destructive/10 text-destructive flex items-start gap-2 rounded-md border p-3 text-xs">
                        <AlertCircleIcon className="mt-0.5 size-4 shrink-0" />
                        <span>{executionError}</span>
                      </div>
                    )}

                    {session ? (
                      <Button
                        type="submit"
                        size="default"
                        className="w-full gap-2 font-medium"
                        disabled={executeMutation.isPending}
                      >
                        {executeMutation.isPending ? (
                          <>
                            <Loader2Icon className="size-4 animate-spin" />
                            <span>Generating Output...</span>
                          </>
                        ) : (
                          <>
                            <PlayIcon className="size-4 fill-current" />
                            <span>Execute Tool</span>
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="default"
                        className="w-full gap-2 font-medium"
                        onClick={handleRunLoginRedirect}
                      >
                        <LogInIcon className="size-4" />
                        <span>Sign in to Run Tool</span>
                      </Button>
                    )}
                  </form>
                </CardPanel>
              </Card>
            </div>
          </div>

          {/* Right column: sticky output */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <Card className="border-border bg-card flex min-h-[400px] flex-col justify-between">
              <CardHeader className="border-border border-b pb-3">
                <CardTitle className="font-heading flex items-center justify-between text-base font-semibold">
                  <span>Output Result</span>
                  {executionResult !== null && (
                    <Badge
                      variant="outline"
                      className="border-success/30 bg-success/10 text-success gap-1 text-xs font-normal"
                    >
                      <CheckCircle2Icon className="size-3" />
                      <span>Completed</span>
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardPanel className="flex flex-1 flex-col justify-center p-5">
                {executeMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
                    <Loader2Icon className="text-foreground size-8 animate-spin" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold">
                        Processing Workflow...
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Running AI inference steps in the cloud.
                      </p>
                    </div>
                  </div>
                ) : executionResult !== null ? (
                  <OutputRenderer
                    format={product.outputFormat ?? "plain"}
                    data={executionResult}
                  />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center justify-center space-y-2 py-16 text-center">
                    <SparklesIcon className="text-muted-foreground/30 size-8" />
                    <p className="text-xs">
                      Output will appear here after tool execution.
                    </p>
                  </div>
                )}
              </CardPanel>
            </Card>
          </div>
        </div>

        {/* Related / Recommended Tools Section */}
        {relatedProducts.length > 0 && (
          <section className="border-border space-y-4 border-t pt-8">
            <div>
              <h2 className="font-heading text-xl font-bold tracking-tight">
                Recommended Tools
              </h2>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Tools related to this category & workflow
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteLayout>
  )
}

function OutputRenderer({ format, data }: { format: string; data: unknown }) {
  if (format === "image" && typeof data === "string") {
    return (
      <div className="flex flex-col items-center space-y-3">
        <img
          src={data}
          alt="Generated Output"
          className="border-border max-h-[450px] w-auto rounded-lg border object-contain"
        />
        <a
          href={data}
          download="output.webp"
          target="_blank"
          rel="noreferrer"
          className="text-foreground text-xs font-medium underline underline-offset-4"
        >
          Open Original Image
        </a>
      </div>
    )
  }

  if (format === "video" && typeof data === "string") {
    return (
      <div className="flex flex-col items-center space-y-3">
        <video
          src={data}
          controls
          className="border-border max-h-[450px] w-full rounded-lg border"
        />
      </div>
    )
  }

  if (format === "json" || typeof data === "object") {
    return (
      <pre className="bg-muted/40 border-border text-foreground max-h-[450px] overflow-x-auto rounded-lg border p-4 font-mono text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  return (
    <div className="bg-muted/20 border-border text-foreground max-h-[450px] overflow-y-auto rounded-lg border p-4 text-xs leading-relaxed whitespace-pre-wrap">
      {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
    </div>
  )
}
