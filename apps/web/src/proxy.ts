import { auth } from "@repo/auth/session"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth/login")) {
    const session = await auth()

    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (request.nextUrl.pathname.startsWith("/dashboard/admin")) {
    const session = await auth()

    if (!session) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (session.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  if (
    request.nextUrl.pathname.startsWith("/dashboard") &&
    !request.nextUrl.pathname.startsWith("/dashboard/admin")
  ) {
    const session = await auth()

    if (!session) {
      const loginUrl = new URL("/auth/login", request.url)
      loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
}
