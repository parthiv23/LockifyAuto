import { Link } from "wouter";
import { AppLink } from "@/components/app-link";
import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="bg-ink px-6 pb-8 text-ink-foreground sm:px-10 lg:px-16">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 border-t border-ink-foreground/20 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <BrandMark inverse />
        <div className="flex flex-wrap items-center gap-5 text-xs text-ink-foreground/70">
          <AppLink path="/login" className="story-link" testId="link-footer-login">
            Sign in
          </AppLink>
          <AppLink path="/register" className="story-link" testId="link-footer-register">
            Create account
          </AppLink>
          <AppLink path="/forgot-password" className="story-link" testId="link-footer-forgot-password">
            Forgot password
          </AppLink>
          <Link href="/privacy" className="story-link" data-testid="link-footer-privacy">
            Privacy
          </Link>
          <span>© 2026 Lumora</span>
        </div>
      </div>
    </footer>
  );
}
