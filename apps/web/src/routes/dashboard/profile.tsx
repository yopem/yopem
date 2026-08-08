"use client"

import { useForm } from "@tanstack/react-form"
import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute, useLoaderData } from "@tanstack/react-router"
import { Loader2Icon, UserIcon } from "lucide-react"
import * as v from "valibot"

import { queryApi } from "rpc/query"
import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"
import { Button } from "ui/button"
import { Card, CardHeader, CardPanel, CardTitle } from "ui/card"
import { Input } from "ui/input"
import { Label } from "ui/label"

export const Route = createFileRoute("/dashboard/profile")({
  loader: async ({ context: { queryClient } }) => {
    const user = await queryClient.ensureQueryData(
      queryApi.user.me.queryOptions(),
    )
    return { user }
  },
  component: ProfileComponent,
})

function ProfileComponent() {
  const { user: initialUser } = useLoaderData({ from: "/dashboard/profile" })
  const userQuery = useQuery(queryApi.user.me.queryOptions())
  const user = userQuery.data ?? initialUser

  const updateMutation = useMutation(
    queryApi.user.update.mutationOptions({
      onSuccess: () => {
        void userQuery.refetch()
      },
    }),
  )

  const initials = (user.name ?? user.email)
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  const form = useForm({
    defaultValues: { name: user.name ?? "" },
    onSubmit: ({ value }) => {
      updateMutation.mutate({ name: value.name })
    },
  })

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-0.5">
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Profile
        </h1>
        <p className="text-muted-foreground text-sm">
          Manage your account information.
        </p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="border-border border-b pb-3">
          <CardTitle className="font-heading flex items-center gap-2 text-base font-semibold">
            <UserIcon className="size-4" />
            Account Details
          </CardTitle>
        </CardHeader>
        <CardPanel className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {user.image && (
                <AvatarImage src={user.image} alt={user.name ?? user.email} />
              )}
              <AvatarFallback className="text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-foreground font-semibold">
                {user.name ?? user.username}
              </p>
              <p className="text-muted-foreground text-sm">{user.email}</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field
              name="name"
              validators={{
                onBlur: ({ value }) =>
                  v.safeParse(v.pipe(v.string(), v.minLength(1)), value).success
                    ? undefined
                    : "Name is required",
                onSubmit: ({ value }) =>
                  v.safeParse(v.pipe(v.string(), v.minLength(1)), value).success
                    ? undefined
                    : "Name is required",
              }}
            >
              {(field) => (
                <div className="space-y-1.5">
                  <Label htmlFor="profile-name" className="text-xs font-medium">
                    Display Name
                  </Label>
                  <Input
                    id="profile-name"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Your name"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-xs">
                      {field.state.meta.errors[0]}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <Button
              type="submit"
              size="sm"
              className="gap-2"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <Loader2Icon className="size-3.5 animate-spin" />
              )}
              Save Changes
            </Button>
          </form>
        </CardPanel>
      </Card>
    </div>
  )
}
