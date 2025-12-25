"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import type { SelectPost } from "@/lib/db/schema/post"
import { clientApi } from "@/lib/orpc/client"

const ExampleMutation = () => {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastCreatedPost, setLastCreatedPost] = useState<SelectPost | null>(
    null,
  )

  const queryClient = useQueryClient()

  const createPostMutation = useMutation({
    mutationFn: async (data: { title: string; description?: string }) => {
      return await clientApi.example.create({
        title: data.title,
        description: data.description,
        userId: "current-user",
      })
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries()
      setLastCreatedPost(data)
      setTitle("")
      setDescription("")
      setIsSubmitting(false)
    },
    onError: (error) => {
      console.error("Failed to create post:", error)
      setIsSubmitting(false)
    },
  })

  const updatePostMutation = useMutation({
    mutationFn: async (data: {
      id: string
      title?: string
      description?: string
    }) => {
      return await clientApi.example.update({
        id: data.id,
        title: data.title,
        description: data.description,
        userId: "current-user",
      })
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries()
      setLastCreatedPost(data)
    },
    onError: (error) => {
      console.error("Failed to update post:", error)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    setIsSubmitting(true)
    createPostMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
    })
  }

  const handleUpdateLastPost = () => {
    if (!lastCreatedPost) return

    updatePostMutation.mutate({
      id: lastCreatedPost.id,
      title: `${lastCreatedPost.title} (Updated)`,
      description: `${lastCreatedPost.description ?? ""} - Updated at ${new Date().toLocaleTimeString()}`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-md">
        <h2 className="mb-4 text-xl font-semibold">Create New Post</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium">
              Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter post description (optional)..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={
              !title.trim() || isSubmitting || createPostMutation.isPending
            }
            className="w-full"
          >
            {createPostMutation.isPending ? "Creating..." : "Create Post"}
          </Button>
        </form>

        {/* Mutation Status */}
        <div className="mt-4 space-y-2">
          {createPostMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                Error:{" "}
                {createPostMutation.error.message || "Failed to create post"}
              </p>
            </div>
          )}

          {updatePostMutation.isError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-700">
                Error:{" "}
                {updatePostMutation.error.message || "Failed to update post"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Last Created Post */}
      {lastCreatedPost && (
        <div className="mx-auto max-w-md">
          <h3 className="mb-2 text-lg font-medium">
            Last Created/Updated Post
          </h3>
          <div className="space-y-2 rounded-md border border-green-200 bg-green-50 p-4">
            <div>
              <strong>ID:</strong> {lastCreatedPost.id}
            </div>
            <div>
              <strong>Title:</strong> {lastCreatedPost.title}
            </div>
            {lastCreatedPost.description && (
              <div>
                <strong>Description:</strong> {lastCreatedPost.description}
              </div>
            )}
            <div>
              <strong>Created:</strong>{" "}
              {lastCreatedPost.createdAt
                ? new Date(lastCreatedPost.createdAt).toLocaleString()
                : "N/A"}
            </div>
            <div className="pt-2">
              <Button
                onClick={handleUpdateLastPost}
                disabled={updatePostMutation.isPending}
                variant="outline"
                size="sm"
              >
                {updatePostMutation.isPending
                  ? "Updating..."
                  : "Update This Post"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mutation Info */}
      <div className="mx-auto max-w-md">
        <h3 className="mb-2 text-lg font-medium">Mutation Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Create Status:</span>
            <span
              className={`font-medium ${
                createPostMutation.isPending
                  ? "text-blue-600"
                  : createPostMutation.isError
                    ? "text-red-600"
                    : createPostMutation.isSuccess
                      ? "text-green-600"
                      : "text-gray-500"
              }`}
            >
              {createPostMutation.isPending
                ? "Loading..."
                : createPostMutation.isError
                  ? "Error"
                  : createPostMutation.isSuccess
                    ? "Success"
                    : "Idle"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Update Status:</span>
            <span
              className={`font-medium ${
                updatePostMutation.isPending
                  ? "text-blue-600"
                  : updatePostMutation.isError
                    ? "text-red-600"
                    : updatePostMutation.isSuccess
                      ? "text-green-600"
                      : "text-gray-500"
              }`}
            >
              {updatePostMutation.isPending
                ? "Loading..."
                : updatePostMutation.isError
                  ? "Error"
                  : updatePostMutation.isSuccess
                    ? "Success"
                    : "Idle"}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExampleMutation
