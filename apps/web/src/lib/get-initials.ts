export function getInitials(name: string | null, email: string): string {
  const source = name ?? email
  return source
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}
