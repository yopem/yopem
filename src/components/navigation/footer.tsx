"use client"
import Link from "@/components/link"
import Logo from "@/components/logo"
import ThemeSwitcher from "@/components/theme/theme-switcher"

const Footer = () => {
  return (
    <footer className="bg-background w-full border-t py-12 text-sm">
      <div className="container mx-auto max-w-7xl px-4 md:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex-1">
            <div className="mb-4 flex items-center gap-2">
              <div className="bg-card flex size-6 items-center justify-center overflow-hidden rounded-sm">
                <Link href="/">
                  <Logo className="size-full p-0.5" />
                </Link>
              </div>
              <h3 className="text-foreground text-lg font-bold">Yopem</h3>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              Access powerful AI tools with simple credit-based pricing. No
              subscriptions, no complexity.
            </p>
            <ThemeSwitcher />
          </div>
          <div className="flex gap-4">
            <a
              className="text-muted-foreground hover:text-foreground"
              target="_blank"
              href="https://x.com/yopemdotcom"
            >
              <span className="sr-only">X</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              className="text-muted-foreground hover:text-foreground"
              target="_blank"
              href="https://github.com/yopem/yopem"
            >
              <span className="sr-only">GitHub</span>
              <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  fillRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
        <div className="text-muted-foreground flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm md:flex-row">
          <p>© {new Date().getFullYear()} Yopem. All rights reserved.</p>
          <div className="flex gap-6">
            <Link className="hover:text-foreground" href="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-foreground" href="/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
