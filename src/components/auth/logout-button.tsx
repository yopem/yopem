import { LogOutIcon } from "lucide-react"

import { logout } from "@/lib/auth/logout"

const LogoutButton = () => {
  return (
    <form action={logout}>
      <button
        aria-label="Keluar"
        className="inline-flex cursor-pointer flex-row"
      >
        <LogOutIcon name="LogOut" className="mr-2" />
        Logout
      </button>
    </form>
  )
}

export default LogoutButton
