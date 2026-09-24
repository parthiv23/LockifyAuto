import { Link } from "wouter";
import { BrandMark } from "@/components/brand-mark";
import { AppLink } from "@/components/app-link";
import { Reveal } from "@/components/reveal";

export default function NotFound() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 text-center">
      <Reveal>
        <BrandMark />
        <h1 className="display mt-10 text-[clamp(3.2rem,8vw,6rem)] leading-[.82] text-heading">
          This page is not here.
        </h1>
        <p className="mt-5 max-w-sm text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          The address may be wrong, or the page moved. The vault still lives in the Lumora app.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/"
            className="magnetic-cta rounded-full bg-ink px-5 py-3 text-sm font-semibold text-ink-foreground"
            data-testid="link-404-home"
          >
            Back to the website
          </Link>
          <AppLink
            path="/login"
            className="story-link text-sm font-medium text-heading"
            testId="link-404-app"
          >
            Open Lumora
          </AppLink>
        </div>
      </Reveal>
    </main>
  );
}
