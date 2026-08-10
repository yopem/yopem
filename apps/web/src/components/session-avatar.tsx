"use client"

import { useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "ui/avatar"

import { getInitials } from "@/lib/get-initials"

interface SessionAvatarProps {
  name: string | null
  email: string
  image?: string | null
  className?: string
  fallbackClassName?: string
}

export function SessionAvatar({
  name,
  email,
  image,
  className,
  fallbackClassName,
}: SessionAvatarProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <Avatar className={className}>
      {image && !imageError && (
        <AvatarImage
          src={image}
          alt={name ?? email}
          onError={() => setImageError(true)}
        />
      )}
      <AvatarFallback className={fallbackClassName}>
        {getInitials(name, email)}
      </AvatarFallback>
    </Avatar>
  )
}
