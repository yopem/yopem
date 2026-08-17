"use client"

import { useSyncExternalStore } from "react"

const TOUCH_QUERY = "(pointer: coarse)"

function getServerSnapshot() {
  return false
}

function getSnapshot() {
  return window.matchMedia(TOUCH_QUERY).matches
}

function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(TOUCH_QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

export function useIsTouchDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
