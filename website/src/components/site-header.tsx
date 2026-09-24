import { useState } from "react";
import { Link } from "wouter";
import { Menu, Moon, Sun, X } from "lucide-react";
import { AppLink } from "@/components/app-link";
import { BrandMark } from "@/components/brand-mark";
import { useTheme } from "@/lib/theme";

const NAV = [
  ["/#why", "The why"],
  ["/#vault", "The vault"],
  ["/#features", "Features"],
  ["/#promise", "The promise"],
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-border text-heading transition-[background-color,color,border-color,transform] duration-200 ease-out hover:bg-muted active:scale-95"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4 sm:px-6 lg:px-10">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between rounded-full border border-border/80 bg-background/80 px-4 py-2.5 shadow-[0_10px_30px_hsl(var(--ink)/.06)] backdrop-blur-md sm:px-5 dark:border-white/8 dark:bg-background/70 dark:shadow-[0_10px_30px_hsl(0_0%_0%/.28)]">
        <Link href="/" className="focus-ring rounded-full" data-testid="link-brand-home">
          <BrandMark />
        </Link>
        <nav className="hidden items-center gap-6 md:flex lg:gap-7" aria-label="Main navigation">
          {NAV.map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="story-link text-sm text-muted-foreground hover:text-foreground"
              data-testid={`link-nav-${label.toLowerCase().replace(" ", "-")}`}
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <AppLink
            path="/register"
            className="story-link hidden whitespace-nowrap text-xs font-semibold text-heading sm:inline"
            testId="link-header-register"
          >
            Create account
          </AppLink>
          <AppLink
            path="/login"
            className="magnetic-cta whitespace-nowrap rounded-full bg-ink px-3 py-2 text-xs font-semibold text-ink-foreground sm:px-4"
            testId="link-header-cta"
          >
            Open Lumora
          </AppLink>
          <button
            type="button"
            className="focus-ring rounded-full p-2 text-heading md:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            data-testid="button-open-menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={18} />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" data-testid="panel-mobile-nav">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 dark:bg-black/55"
            aria-label="Close menu overlay"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-4 top-4 rounded-3xl border border-border bg-background p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button
                type="button"
                className="focus-ring rounded-full p-2 text-heading"
                aria-label="Close menu"
                data-testid="button-close-menu"
                onClick={() => setOpen(false)}
              >
                <X size={18} />
              </button>
            </div>
            <nav className="mt-6 grid gap-1" aria-label="Mobile navigation">
              {NAV.map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  className="rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </a>
              ))}
            </nav>
            <div className="mt-4 grid gap-2">
              <AppLink
                path="/register"
                className="focus-ring rounded-xl border border-border px-4 py-3 text-center text-sm font-semibold text-heading"
                testId="link-mobile-register"
              >
                Create account
              </AppLink>
              <AppLink
                path="/login"
                className="magnetic-cta rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-ink-foreground"
                testId="link-mobile-cta"
              >
                Open Lumora
              </AppLink>
              <AppLink
                path="/forgot-password"
                className="focus-ring rounded-xl px-4 py-3 text-center text-sm font-medium text-muted-foreground"
                testId="link-mobile-forgot-password"
              >
                Forgot password
              </AppLink>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
