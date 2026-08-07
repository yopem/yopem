import type { TImageElement } from "platejs"

import { isRemoteImageSrc } from "./is-remote-image-src"

export function parseImageHtmlElement(
  element: HTMLElement,
  type: string,
): Omit<TImageElement, "children"> | undefined {
  const img =
    element.nodeName === "IMG"
      ? (element as HTMLImageElement)
      : element.querySelector("img")

  if (!img) return undefined

  const url = img.getAttribute("src")
  if (!url || !isRemoteImageSrc(url)) return undefined

  const captionText =
    element.querySelector("figcaption")?.textContent ??
    img.getAttribute("data-caption") ??
    img.getAttribute("alt") ??
    ""

  return {
    type,
    url,
    width: img.getAttribute("width") ?? undefined,
    caption: captionText ? [{ text: captionText }] : undefined,
  }
}
