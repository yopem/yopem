"use client"

import * as React from "react"
import { Icon } from "@yopem-ui/react-icons"

import { useI18n } from "@/lib/locales/client"
import { handleLogOut } from "./action"

const LogoutButton = () => {
  const t = useI18n()

  return (
    <form action={void handleLogOut}>
      <button
        aria-label={t("logout")}
        className="inline-flex cursor-pointer flex-row"
      >
        <Icon name="LogOut" className="mr-2" />
        {t("logout")}
      </button>
    </form>
  )
}

export default LogoutButton
