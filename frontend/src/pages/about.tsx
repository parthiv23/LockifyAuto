import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Target, Lock, Heart, Zap, Eye, Users, Check } from "lucide-react";
import { FloatingAppNav } from "@/components/floating-app-nav";
import type { ReactNode } from "react";

const beliefs = [
  {
    icon: Shield,
    title: "Security First",
    body: "Your data is encrypted on the device before it is saved to your account. The vault key stays on this device; we never receive it in the clear.",
  },
  {
    icon: Zap,
    title: "Simple & Efficient",
    body: "We believe security shouldn't be complicated. Lumora provides an intuitive interface that makes managing your passwords effortless and fast.",
  },
  {
    icon: Eye,
    title: "Privacy Matters",
    body: "We respect your privacy. Your passwords and personal information are yours alone— we don't sell your data or track your activities.",
  },
];

const features = [
  "Secure password vault with on-device encryption",
  "Password generator for creating strong, unique passwords",
  "Starred favorites, search, and filters",
  "Activity history and trash recovery",
  "Fingerprint login and a recovery key",
  "Dark and light themes, plus install as an app",
];

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <FloatingAppNav />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-4 sm:px-6 sm:pb-32 sm:pt-8 md:px-8 md:pb-12 md:pt-24">
        <div className="mb-6 flex items-center gap-3 sm:mb-8">
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-foreground"
            onClick={() => setLocation("/profile")}
            aria-label="Back to profile"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl leading-none text-foreground sm:text-4xl">About Us</h1>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          <section className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border/60 px-5 py-5 sm:px-7 sm:py-6">
              <SectionHeading icon={<Target className="h-5 w-5" />} title="Our Mission" />
            </div>
            <p className="px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-7 sm:py-6 sm:text-base">
              Lumora is a modern, secure password management solution designed to simplify your digital life.
              In an age where we juggle dozens of online accounts, remembering complex passwords for each one
              is nearly impossible. That's where Lumora comes in—we make password security accessible,
              intuitive, and reliable for everyone.
            </p>
          </section>

          <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:p-7">
            <SectionHeading icon={<Heart className="h-5 w-5" />} title="What We Believe" />
            <div className="mt-5 grid gap-3 sm:grid-cols-3 sm:gap-4">
              {beliefs.map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-xl border border-border bg-muted/30 p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-background text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-5 text-card-foreground shadow-sm sm:p-7">
            <SectionHeading icon={<Lock className="h-5 w-5" />} title="Key Features" />
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-sm">
            <div className="border-b border-border/60 px-5 py-5 sm:px-7 sm:py-6">
              <SectionHeading icon={<Users className="h-5 w-5" />} title="About the Creator" />
            </div>
            <div className="space-y-4 px-5 py-5 text-sm leading-relaxed text-muted-foreground sm:px-7 sm:py-6 sm:text-base">
              <p>
                Lumora was created by a passionate developer dedicated to building tools that enhance
                digital security without compromising user experience. With a background in web development
                and a deep commitment to privacy, the goal was to create a password manager that anyone
                can trust and use with confidence.
              </p>
              <p>
                This project combines modern web technologies with security best practices to deliver
                a robust solution that helps users take control of their online security. Whether you're
                managing a handful of accounts or hundreds, Lumora is designed to scale with your needs.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-8 text-center sm:px-8">
            <h2 className="font-serif text-2xl text-foreground sm:text-3xl">Ready to secure your digital life?</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start organizing and protecting your passwords today with Lumora.
            </p>
            <Link href="/">
              <Button size="lg" className="mt-5 font-semibold">
                Go to Dashboard
              </Button>
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <h2 className="font-serif text-2xl leading-none text-foreground sm:text-3xl">{title}</h2>
    </div>
  );
}
