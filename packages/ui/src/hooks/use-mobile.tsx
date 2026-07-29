"use client"

import { useSyncExternalStore } from "react"

const MOBILE_BREAKPOINT = 768

function getServerSnapshot() {
  return false
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
