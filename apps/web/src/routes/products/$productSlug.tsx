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
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CoinsIcon,
  FolderIcon,
  Loader2Icon,
  LogInIcon,
  PlayIcon,
  TagIcon,
  ZapIcon,
} from "lucide-react"
import { useRef, useState } from "react"

import { siteTitle } from "env"
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
import { Separator } from "ui/separator"
import { formatDateOnly } from "utils/format-date"

import { SiteLayout } from "@/components/site-layout"
import { ProductInputField } from "@/features/storefront/product-input-field"
import { RichTextView } from "@/features/storefront/rich-text-view"
import { loginAndRedirect } from "@/lib/login"
import { getSiteUrl } from "@/lib/site-url"

export const Route = createFileRoute("/products/$productSlug")({
  loader: async ({ context: { queryClient }, params }) => {
    const product = await queryClient
      .ensureQueryData(
        queryApi.products.bySlug.queryOptions({
          input: { slug: params.productSlug },
        }),
      )
      .catch(() => null)

    if (!product) {
      throw notFound()
    }

    return { product }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.product) return {}

    const { product } = loaderData
    const productUrl = `${getSiteUrl()}/products/${product.slug}`
    const description =
      product.excerpt ??
      product.description ??
      `Run ${product.name} AI tool on Yopem.`

    return {
      meta: [
        { title: `${product.name} - ${siteTitle ?? "Yopem"}` },
        { name: "description", content: description },
        { property: "og:title", content: product.name },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: productUrl },
      ],
      links: [{ rel: "canonical", href: productUrl }],
    }
  },
  component: ProductDetailComponent,
})

interface WorkflowField {
  variableName: string
  description: string
  type: string
  isOptional?: boolean
  options?: { label: string; value: string }[]
}

interface WorkflowNode {
  type?: string
  data?: { fields?: unknown[] }
}

function ProductDetailComponent() {
  const { product: initialProduct } = useLoaderData({
    from: "/products/$productSlug",
  })
  const { session } = useRouteContext({ from: "__root__" })

  const productQuery = useQuery(
    queryApi.products.bySlug.queryOptions({
      input: { slug: initialProduct.slug },
    }),
  )
  const product = productQuery.data ?? initialProduct

  const [executionResult, setExecutionResult] = useState<unknown>(null)
  const [executionError, setExecutionError] = useState<string | null>(null)

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

  const workflowNodes =
    (product.workflow as { nodes?: WorkflowNode[] } | undefined)?.nodes ?? []
  const inputFields: WorkflowField[] = workflowNodes
    .filter((n) => n.type === "input")
    .flatMap((n) => (n.data?.fields as WorkflowField[] | undefined) ?? [])

  const defaultValues = Object.fromEntries(
    inputFields.map((f) => [f.variableName, ""]),
  )

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

  const handleRunLoginRedirect = () =>
    loginAndRedirect(`/products/${product.slug}`)

  const fileReaderRef = useRef<FileReader | null>(null)

  const cost = Number(product.creditsPerRun ?? 0)
  const formattedDate = formatDateOnly(product.updatedAt) || "N/A"

  return (
    <SiteLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to="/products"
            className="text-muted-foreground hover:text-foreground inline-flex items-center text-sm font-medium transition-colors"
          >
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Marketplace
          </Link>
        </div>

        {/* Main Content Layout matching yopem-old */}
        <div className="flex flex-col gap-y-10 lg:flex-row lg:gap-x-12">
          {/* Left Column */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-y-4 sm:flex-row sm:items-start sm:gap-x-6">
              {product.thumbnail?.url ? (
                <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border sm:size-20">
                  <img
                    src={product.thumbnail.url}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </div>
              ) : (
                <div className="bg-muted border-border flex size-16 shrink-0 items-center justify-center rounded-2xl border sm:size-20">
                  <span className="text-foreground text-3xl font-semibold">
                    {product.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                    {product.name}
                  </h1>
                  <Badge variant="secondary" className="rounded-md font-medium">
                    {product.status}
                  </Badge>
                </div>

                <RichTextView
                  content={product.descriptionContent}
                  fallbackDescription={product.description}
                />

                {product.categories && product.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {product.categories.map((category) => (
                      <Link
                        key={category.id}
                        to="/products"
                        search={{ categorySlugs: [category.slug] }}
                      >
                        <Badge
                          variant="outline"
                          className="bg-background hover:bg-muted rounded-md font-normal transition-colors"
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator className="my-10" />

            {/* Execute Section matching yopem-old */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-foreground text-xl font-semibold tracking-tight">
                  Run this product
                </h2>
                <p className="text-muted-foreground text-sm">
                  Enter the required parameters to execute this product.
                </p>
              </div>

              <Card className="border-border bg-card">
                <CardPanel className="p-6">
                  {!session ? (
                    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                      <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
                        <LogInIcon className="size-6" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">
                          Sign in to Run Tool
                        </CardTitle>
                        <CardDescription className="max-w-sm text-xs">
                          You need to be logged in to execute this tool and
                          generate outputs.
                        </CardDescription>
                      </div>
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => void handleRunLoginRedirect()}
                      >
                        <LogInIcon className="size-4" />
                        <span>Sign In</span>
                      </Button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        void form.handleSubmit()
                      }}
                      className="space-y-5"
                    >
                      {inputFields.length === 0 ? (
                        <p className="text-muted-foreground text-xs italic">
                          No parameter inputs required. Click run to execute.
                        </p>
                      ) : (
                        inputFields.map((field) => (
                          <form.Field
                            key={field.variableName}
                            name={field.variableName}
                          >
                            {(fieldState) => (
                              <div className="space-y-1.5">
                                <Label
                                  htmlFor={field.variableName}
                                  className="text-xs font-medium"
                                >
                                  {field.description || field.variableName}
                                  {!field.isOptional && (
                                    <span className="text-destructive ml-1">
                                      *
                                    </span>
                                  )}
                                </Label>
                                <ProductInputField
                                  field={field}
                                  value={fieldState.state.value}
                                  fileReaderRef={fileReaderRef}
                                  onChange={(_, val) =>
                                    fieldState.handleChange(val)
                                  }
                                />
                              </div>
                            )}
                          </form.Field>
                        ))
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                          <CoinsIcon className="size-4" />
                          <span>
                            {product.creditsPerRun
                              ? `${product.creditsPerRun} credits per run`
                              : "Free run"}
                          </span>
                        </div>

                        <Button
                          type="submit"
                          size="default"
                          className="gap-2 font-medium"
                          disabled={executeMutation.isPending}
                        >
                          {executeMutation.isPending ? (
                            <>
                              <Loader2Icon className="size-4 animate-spin" />
                              <span>Executing...</span>
                            </>
                          ) : (
                            <>
                              <PlayIcon className="size-4 fill-current" />
                              <span>Run Tool</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardPanel>
              </Card>

              {/* Error Display */}
              {executionError && (
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardPanel className="text-destructive flex items-start gap-3 p-4">
                    <AlertCircleIcon className="size-5 shrink-0" />
                    <div className="space-y-1 text-xs">
                      <p className="font-semibold">Execution Failed</p>
                      <p className="leading-relaxed">{executionError}</p>
                    </div>
                  </CardPanel>
                </Card>
              )}

              {/* Output Display */}
              {executionResult !== null && (
                <Card className="border-border bg-card">
                  <CardHeader className="border-border border-b pb-3">
                    <CardTitle className="font-heading flex items-center gap-2 text-base font-semibold">
                      <CheckCircle2Icon className="size-4 text-green-500" />
                      Execution Output
                    </CardTitle>
                  </CardHeader>
                  <CardPanel className="p-5">
                    {product.outputFormat === "image" &&
                    typeof executionResult === "string" ? (
                      <div className="border-border overflow-hidden rounded-lg border">
                        <img
                          src={executionResult}
                          alt="Generated output"
                          className="w-full object-contain"
                        />
                      </div>
                    ) : typeof executionResult === "string" ? (
                      <div className="max-w-none text-sm leading-relaxed">
                        <RichTextView content={executionResult} />
                      </div>
                    ) : (
                      <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-4 font-mono text-xs">
                        {JSON.stringify(executionResult, null, 2)}
                      </pre>
                    )}
                  </CardPanel>
                </Card>
              )}
            </section>
          </div>

          {/* Right Sidebar Column matching yopem-old */}
          <div className="lg:w-[320px] lg:shrink-0">
            <div className="space-y-6 lg:sticky lg:top-8">
              <div className="border-border bg-card rounded-lg border p-5 shadow-2xs">
                <h3 className="text-foreground mb-4 text-sm font-semibold tracking-tight">
                  App Details
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <ZapIcon className="size-4" />
                      <span>Availability</span>
                    </div>
                    <Badge
                      variant={cost > 0 ? "secondary" : "default"}
                      className="text-xs"
                    >
                      {cost > 0 ? "Pro & Enterprise" : "All plans"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground flex items-center gap-2">
                      <CalendarIcon className="size-4" />
                      <span>Last updated</span>
                    </div>
                    <span className="text-foreground font-medium">
                      {formattedDate}
                    </span>
                  </div>

                  {product.categories && product.categories.length > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-muted-foreground flex items-center gap-2">
                        <FolderIcon className="size-4" />
                        <span>Category</span>
                      </div>
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {product.categories.slice(0, 1).map((category) => (
                          <Link
                            key={category.id}
                            to="/products"
                            search={{ categorySlugs: [category.slug] }}
                            className="text-foreground hover:text-primary font-medium transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {product.tags && product.tags.length > 0 && (
                  <div className="border-border/50 mt-5 space-y-3 border-t pt-5">
                    <div className="text-muted-foreground flex items-center gap-2 text-sm">
                      <TagIcon className="size-4" />
                      <span>Tags</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to="/products"
                          search={{ tagSlugs: [tag.slug] }}
                        >
                          <Badge
                            variant="secondary"
                            className="bg-muted text-muted-foreground hover:bg-muted/80 rounded-md font-normal transition-colors"
                          >
                            {tag.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}
