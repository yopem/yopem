"use client"

import { useCallback, useReducer, useState } from "react"
import {
  BarChartIcon,
  BotIcon,
  BrainIcon,
  DollarSignIcon,
  EyeIcon,
  EyeOffIcon,
  HelpCircleIcon,
  KeyIcon,
  MoreVerticalIcon,
  PlusCircleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from "lucide-react"

import AdminBreadcrumb from "@/components/admin/admin-breadcrumb"
import AdminPageHeader from "@/components/admin/admin-page-header"
import AccessManagementTable from "@/components/admin/settings/access-management-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "@/components/ui/menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toastManager } from "@/components/ui/toast"
import {
  useAddApiKey,
  useApiKeys,
  useApiKeyStats,
  useDeleteApiKey,
  useUpdateApiKey,
} from "@/hooks/use-api-keys"
import type { AddApiKeyInput, ApiKeyConfig } from "@/lib/schemas/api-keys"

const providerIcons: Record<string, React.ReactNode> = {
  openai: <BotIcon className="text-background" />,
  anthropic: <BrainIcon className="text-background" />,
  google: <KeyIcon className="text-background" />,
  azure: <KeyIcon className="text-background" />,
  other: <KeyIcon className="text-background" />,
}

const providerNames: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google AI",
  azure: "Azure OpenAI",
  other: "Other",
}

type ModalState =
  | { type: "closed" }
  | { type: "adding" }
  | { type: "editing"; provider: ApiKeyConfig }
  | { type: "deleting"; provider: ApiKeyConfig }

type ModalAction =
  | { type: "OPEN_ADD" }
  | { type: "OPEN_EDIT"; provider: ApiKeyConfig }
  | { type: "OPEN_DELETE"; provider: ApiKeyConfig }
  | { type: "CLOSE" }

function modalReducer(_state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case "OPEN_ADD":
      return { type: "adding" }
    case "OPEN_EDIT":
      return { type: "editing", provider: action.provider }
    case "OPEN_DELETE":
      return { type: "deleting", provider: action.provider }
    case "CLOSE":
      return { type: "closed" }
  }
}

export default function AdminSettingsPage() {
  const breadcrumbItems = [
    { label: "Settings", href: "/dashboard/admin/setting" },
    { label: "API Configuration" },
  ]

  const users = [
    {
      id: "1",
      name: "David Chen",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC03MDeOhoU810hDPn7ScY1hZVCP_Fq_X_Bc95ljrQghnbo5b9E-Ly7yTMerVDlnBB5D8pm-ZXcQ05Bp2oq2_SfnHXRZp4d4Y1-irwMHZEpLUAcLw41VIVJG44GeHjwRFM2pKH1cxLsBlrjUM784xP8dl08ySP7OROnofzgwGINJYT6ojxnhpRMiyQm5GNkbDNUrFmTENiEzx-h4f86-4JbVgfGoYU7kOwULS22wB-FnvX7ea_daTEXvt9wuyV6mMc6QJABq2TnMr4",
      role: "owner" as const,
      permissions: "Full Access",
    },
    {
      id: "2",
      name: "Sarah Miller",
      avatar:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDOk281IWtOILWpcd8lnAawqs9upcktcEdpObjdj1BNgZJxwhXsrTU9jbqu72BUoJjSrqw6CSOJMI7dd1hnqH4vcNwxxpJnmhaOoGrKwyi3E66FzWfYkFdRMly_gf6o1MRwLsAWnrmmgFcCgk4qAGhuEvmCOOHNAPDyEV4jgj9yACPOH4QSoJulPFS5UBN3owyofIHmMgGTufyBHFlxWCfN5yFKOqnKkVijK0Wf8q9q06nUvRJV7xjGPUydQBYbc0ZAQ3-SL5TTktM",
      role: "developer" as const,
      permissions: "Read Only",
    },
  ]

  const [modalState, dispatch] = useReducer(modalReducer, { type: "closed" })
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())
  const [formData, setFormData] = useState<AddApiKeyInput>({
    provider: "openai",
    name: "",
    description: "",
    apiKey: "",
    status: "active",
  })

  const { data: apiKeys, isLoading: keysLoading } = useApiKeys()
  const { data: stats, isLoading: statsLoading } = useApiKeyStats()
  const addMutation = useAddApiKey()
  const updateMutation = useUpdateApiKey()
  const deleteMutation = useDeleteApiKey()

  const handleAddProvider = useCallback(() => {
    void (async () => {
      try {
        await addMutation.mutateAsync(formData)
        toastManager.add({
          title: "Provider added successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
        setFormData({
          provider: "openai",
          name: "",
          description: "",
          apiKey: "",
          status: "active",
        })
      } catch (error) {
        toastManager.add({ title: "Failed to add provider", type: "error" })
        console.error(error)
      }
    })()
  }, [addMutation, formData])

  const handleUpdateProvider = useCallback(() => {
    if (modalState.type !== "editing") return
    void (async () => {
      try {
        await updateMutation.mutateAsync({
          id: modalState.provider.id,
          name: modalState.provider.name,
          description: modalState.provider.description,
          status: modalState.provider.status,
          provider: modalState.provider.provider,
        })
        toastManager.add({
          title: "Provider updated successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
      } catch (error) {
        toastManager.add({ title: "Failed to update provider", type: "error" })
        console.error(error)
      }
    })()
  }, [updateMutation, modalState])

  const handleDeleteProvider = useCallback(() => {
    if (modalState.type !== "deleting") return
    void (async () => {
      try {
        await deleteMutation.mutateAsync({ id: modalState.provider.id })
        toastManager.add({
          title: "Provider deleted successfully",
          type: "success",
        })
        dispatch({ type: "CLOSE" })
      } catch (error) {
        toastManager.add({ title: "Failed to delete provider", type: "error" })
        console.error(error)
      }
    })()
  }, [deleteMutation, modalState])

  const toggleKeyVisibility = useCallback((keyId: string) => {
    setVisibleKeys((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }, [])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8 pb-24">
          <AdminBreadcrumb items={breadcrumbItems} />

          <AdminPageHeader
            title="API Configuration"
            description="Manage API keys and secrets for your AI providers. Keys are encrypted at rest. Rotate keys periodically for enhanced security."
            action={
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <HelpCircleIcon className="size-4" />
                Documentation
              </Button>
            }
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statsLoading ? (
              <>
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
                <Skeleton className="h-24" />
              </>
            ) : (
              <>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Total Requests
                        </p>
                        <p className="text-foreground text-2xl font-bold">
                          {(stats?.totalRequests ?? 0).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          <TrendingUpIcon className="mr-1 inline size-3" />
                          +12.5% from last month
                        </p>
                      </div>
                      <BarChartIcon className="text-muted-foreground size-10" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Active Keys
                        </p>
                        <p className="text-foreground text-2xl font-bold">
                          {stats?.activeKeys ?? 0}
                        </p>
                      </div>
                      <KeyIcon className="text-muted-foreground size-10" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm">
                          Monthly Cost
                        </p>
                        <p className="text-foreground text-2xl font-bold">
                          ${(stats?.monthlyCost ?? 0).toLocaleString()}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          <TrendingDownIcon className="mr-1 inline size-3" />
                          {stats?.costChange ?? 0}% cost efficiency
                        </p>
                      </div>
                      <DollarSignIcon className="text-muted-foreground size-10" />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <div className="flex flex-col gap-8">
            {keysLoading ? (
              <>
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
              </>
            ) : (
              apiKeys?.map((key) => (
                <Card key={key.id}>
                  <CardHeader className="bg-card/50 flex-row items-center justify-between border-b p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-foreground flex h-10 w-10 items-center justify-center rounded-md [&>svg]:size-6">
                        {providerIcons[key.provider]}
                      </div>
                      <div>
                        <h3 className="text-foreground font-medium">
                          {key.name}
                        </h3>
                        <p className="text-muted-foreground text-xs">
                          {key.description ?? providerNames[key.provider]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          key.status === "active" ? "default" : "secondary"
                        }
                        className="capitalize"
                      >
                        {key.status}
                      </Badge>
                      <Menu>
                        <MenuTrigger
                          render={
                            <Button size="icon-xs" variant="ghost">
                              <MoreVerticalIcon className="size-4" />
                            </Button>
                          }
                        />
                        <MenuPopup align="end">
                          <MenuItem
                            onClick={() =>
                              dispatch({ type: "OPEN_EDIT", provider: key })
                            }
                          >
                            Edit
                          </MenuItem>
                          <MenuItem
                            onClick={() =>
                              dispatch({ type: "OPEN_DELETE", provider: key })
                            }
                            className="text-destructive"
                          >
                            Delete
                          </MenuItem>
                        </MenuPopup>
                      </Menu>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-6 p-6">
                    <div className="space-y-2">
                      <Label>Secret Key</Label>
                      <div className="flex gap-2">
                        <Input
                          type={visibleKeys.has(key.id) ? "text" : "password"}
                          value={key.apiKey}
                          readOnly
                          className="font-mono text-sm"
                        />
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => toggleKeyVisibility(key.id)}
                        >
                          {visibleKeys.has(key.id) ? (
                            <EyeOffIcon className="size-4" />
                          ) : (
                            <EyeIcon className="size-4" />
                          )}
                        </Button>
                      </div>
                      {key.lastUsed && (
                        <p className="text-muted-foreground text-xs">
                          Last used: {new Date(key.lastUsed).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            <button
              onClick={() => dispatch({ type: "OPEN_ADD" })}
              className="border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 hover:bg-accent/50 group flex w-full items-center justify-center gap-2 rounded-xl border border-dashed py-4 transition-all"
            >
              <PlusCircleIcon className="size-5 transition-transform group-hover:scale-110" />
              <span className="text-sm font-medium">Add New Provider</span>
            </button>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-foreground text-lg font-bold">
                  Key Access Management
                </h2>
                <Button variant="outline" size="sm">
                  Manage Roles
                </Button>
              </div>
              <AccessManagementTable users={users} />
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={modalState.type === "adding"}
        onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Provider</DialogTitle>
            <DialogDescription>
              Add a new AI provider API key to your account
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                  value={formData.provider}
                  onValueChange={(value) => {
                    if (value)
                      setFormData({
                        ...formData,
                        provider: value,
                      })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                    <SelectItem value="google">Google AI</SelectItem>
                    <SelectItem value="azure">Azure OpenAI</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Production OpenAI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="e.g., Used for GPT-4 and Embeddings"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={formData.apiKey}
                  onChange={(e) =>
                    setFormData({ ...formData, apiKey: e.target.value })
                  }
                  placeholder="sk-proj-..."
                />
              </div>
            </div>
          </DialogPanel>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "CLOSE" })}
              disabled={addMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddProvider}
              disabled={
                addMutation.isPending || !formData.name || !formData.apiKey
              }
            >
              {addMutation.isPending ? "Adding..." : "Add Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalState.type === "editing"}
        onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Provider</DialogTitle>
            <DialogDescription>
              Update provider settings and configuration
            </DialogDescription>
          </DialogHeader>
          {modalState.type === "editing" && (
            <DialogPanel>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Name</Label>
                  <Input
                    id="edit-name"
                    value={modalState.provider.name}
                    onChange={(e) =>
                      dispatch({
                        type: "OPEN_EDIT",
                        provider: {
                          ...modalState.provider,
                          name: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={modalState.provider.description ?? ""}
                    onChange={(e) =>
                      dispatch({
                        type: "OPEN_EDIT",
                        provider: {
                          ...modalState.provider,
                          description: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={modalState.provider.status}
                    onValueChange={(value) => {
                      if (value) {
                        dispatch({
                          type: "OPEN_EDIT",
                          provider: {
                            ...modalState.provider,
                            status: value,
                          },
                        })
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DialogPanel>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "CLOSE" })}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProvider}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalState.type === "deleting"}
        onOpenChange={(open) => !open && dispatch({ type: "CLOSE" })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Provider</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this provider? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogPanel>
            {modalState.type === "deleting" && (
              <div className="bg-muted rounded-lg p-4">
                <p className="text-foreground font-medium">
                  {modalState.provider.name}
                </p>
                <p className="text-muted-foreground text-sm">
                  {modalState.provider.description ??
                    providerNames[modalState.provider.provider]}
                </p>
              </div>
            )}
          </DialogPanel>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => dispatch({ type: "CLOSE" })}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProvider}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Provider"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
