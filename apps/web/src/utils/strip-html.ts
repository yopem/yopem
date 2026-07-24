export const stripHtml = (html: string | null | undefined): string => {
  if (!html) return ""

  return html
    .replace(/\u003cscript[^\u003e]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\u003cstyle[^\u003e]*>[\s\S]*?<\/style>/gi, "")
    .replace(/\u003c[^\u003e]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}
