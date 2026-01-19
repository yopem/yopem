"use client"

import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Save as SaveIcon, User as UserIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [image, setImage] = useState("")

  const { data: profile } = useQuery({
    ...queryApi.user.getProfile.queryOptions(),
  }) as {
    data:
      | {
          id: string
          email: string
          name: string | null
          username: string | null
          image: string | null
        }
      | undefined
  }

  const updateMutation = useMutation({
    mutationFn: async (data: { name?: string; image?: string }) => {
      await queryApi.user.updateProfile.call(data)
    },
    onSuccess: () => {
      toastManager.add({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        type: "success",
      })
    },
    onError: (err: Error) => {
      toastManager.add({
        title: "Error updating profile",
        description: err.message,
        type: "error",
      })
    },
  })

  if (profile) {
    if (!name) setName(profile.name ?? "")
    if (!image) setImage(profile.image ?? "")
  }

  const handleSave = () => {
    updateMutation.mutate({ name, image: image || undefined })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and profile information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Email</label>
            <Input value={profile?.email ?? ""} disabled className="bg-muted" />
            <p className="text-muted-foreground text-xs">
              Email cannot be changed.
            </p>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Profile Image URL</label>
            <Input
              placeholder="https://example.com/avatar.jpg"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="mt-4"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
