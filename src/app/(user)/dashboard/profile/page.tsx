"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { SaveIcon, UserIcon } from "lucide-react"
import { useEffect, useEffectEvent, useState, type ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toastManager } from "@/components/ui/toast"
import { queryApi } from "@/lib/orpc/query"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [image, setImage] = useState("")

  const { data: profile } = useQuery({
    ...queryApi.user.getProfile.queryOptions(),
    retry: false,
    refetchOnWindowFocus: false,
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
    onError: (error: Error) => {
      toastManager.add({
        title: "Error updating profile",
        description: error.message,
        type: "error",
      })
    },
  })

  const onProfileLoaded = useEffectEvent(() => {
    if (profile && !name) {
      setName(profile.name ?? "")
    }
    if (profile && !image) {
      setImage(profile.image ?? "")
    }
  })

  useEffect(() => {
    onProfileLoaded()
  }, [profile])

  const handleSave = () => {
    updateMutation.mutate({ name, image: image || undefined })
  }

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value)
  }

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.value)
  }

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and profile information.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="size-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              value={profile?.email ?? ""}
              disabled
              className="bg-muted"
            />
            <p className="text-muted-foreground text-xs">
              Email cannot be changed.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              placeholder="Enter your name"
              value={name}
              onChange={handleNameChange}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="profile-image">Profile Image URL</Label>
            <Input
              id="profile-image"
              placeholder="https://example.com/avatar.jpg"
              value={image}
              onChange={handleImageChange}
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="mt-4"
          >
            <SaveIcon className="mr-2 size-4" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
