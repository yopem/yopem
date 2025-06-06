"use client"

import * as React from "react"
import { Icon } from "@yopem-ui/react-icons"

import { useI18n } from "@/lib/locales/client"
import { handleLogOut } from "./action"

const LogoutButton = () => {
  const [isPending, startTransition] = React.useTransition()

  const t = useI18n()

  const handleSubmit = () => {
    startTransition(async () => {
      await handleLogOut()
    })
  }

  return (
    <form action={handleSubmit}>
      <button
        aria-label="Keluar"
        disabled={isPending}
        className="inline-flex cursor-pointer flex-row"
      >
        <Icon name="LogOut" className="mr-2" />
        {t("logout")}
      </button>
    </form>
  )
}

export default LogoutButton
