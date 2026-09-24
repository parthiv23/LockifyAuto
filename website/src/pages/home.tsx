import { ArrowRight, Check, ChevronRight, Clock3, Download, Fingerprint, KeyRound, LockKeyhole, Moon, Search, ShieldCheck, Sparkles, Star, Trash2, Zap, type LucideIcon } from "lucide-react";
import { AppLogo } from "@/components/app-logo";
import { AppLink } from "@/components/app-link";
import { Reveal } from "@/components/reveal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

const CORE_FEATURES: { icon: LucideIcon; title: string; copy: string }[] = [
  { icon: LockKeyhole, title: "Encrypted password vault", copy: "Store logins securely" },
  { icon: Zap, title: "Password generator", copy: "Create strong, unique passwords" },
  { icon: Search, title: "Search and filters", copy: "Find any account fast" },
  { icon: Star, title: "Starred favorites", copy: "Keep important logins one tap away" },
  { icon: Trash2, title: "Trash and restore", copy: "Recover deleted records" },
  { icon: Clock3, title: "Activity history", copy: "See what changed in your vault" },
  { icon: Fingerprint, title: "Fingerprint login", copy: "Unlock with biometrics" },
  { icon: KeyRound, title: "Recovery key", copy: "Reset access if you forget your password" },
  { icon: Moon, title: "Dark and light theme", copy: "Works on phone and desktop" },
  { icon: Download, title: "Install as an app", copy: "Add Lumora to the home screen" },
];

function PublicOrb() {
  return (
    <div
      className="relative mx-auto aspect-square w-[min(76vw,31rem)]"
      aria-label="Abstract calm secure vault illustration"
      role="img"
      data-testid="illustration-hero-orb"
    >
      <div className="absolute inset-[8%] rounded-full bg-moss/80 opacity-70 blur-3xl dark:bg-lime/20" />
      <div className="absolute inset-[13%] rounded-full bg-moss shadow-[0_24px_70px_hsl(var(--ink)/.16)] dark:bg-ink dark:shadow-[0_24px_70px_hsl(0_0%_0%/.35)]" />
      <div className="absolute inset-[19%] overflow-hidden rounded-full border border-ink/15 bg-lime dark:border-lime/20 dark:bg-lime">
        <div className="absolute -left-[12%] top-[40%] h-[25%] w-[124%] rounded-[50%] border border-ink/20 bg-moss dark:border-ink/25 dark:bg-[#b8d98a]" />
        <div className="absolute left-[27%] top-[23%] flex h-[40%] w-[40%] items-center justify-center rounded-[48%] border border-ink/25 bg-ink text-lime shadow-[inset_0_0_0_1px_rgba(255,255,255,.22)]">
          <AppLogo className="h-[52%] w-[44%]" />
        </div>
      </div>
      <div className="orbit absolute inset-[4%] rounded-full border border-dashed border-ink/20 dark:border-lime/25" />
      <div className="absolute left-[2%] top-[29%] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-heading shadow-sm">
        <LockKeyhole size={15} />
      </div>
      <div className="absolute bottom-[16%] right-[1%] flex h-11 w-11 items-center justify-center rounded-full bg-ink text-lime shadow-lg">
        <Fingerprint size={19} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main id="top" className="lumora-shell overflow-hidden">
      <SiteHeader />

      <section className="relative mx-auto grid min-h-[min(900px,100dvh)] max-w-[1440px] items-center gap-8 px-6 pb-16 pt-36 sm:px-10 lg:grid-cols-[1.02fr_.98fr] lg:px-16">
        <div className="relative z-10 max-w-[47rem]">
          <div className="eyebrow reveal reveal-delay-1 flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
            <span className="text-heading">00</span>
            <span className="h-px w-8 bg-current opacity-50" />
            <span>Private by design</span>
          </div>
          <h1
            className="display reveal reveal-delay-2 mt-7 max-w-[11ch] text-[clamp(4.3rem,10.4vw,9.4rem)] leading-[.78] text-heading"
            data-testid="heading-hero"
          >
            Your digital life, <em className="text-emphasis">in order.</em>
          </h1>
          <p className="reveal reveal-delay-3 mt-8 max-w-[28rem] text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
            Lumora is the password manager for people who are done treating security like a chore.
            Encrypt your logins on the device, keep them with your account, and get back to what matters.
          </p>
          <div className="reveal reveal-delay-4 mt-9 flex flex-wrap items-center gap-5">
            <AppLink
              path="/login"
              className="magnetic-cta group flex items-center gap-3 rounded-full bg-ink px-5 py-3.5 text-sm font-semibold text-ink-foreground shadow-[0_12px_25px_hsl(var(--ink)/.22)]"
              testId="link-hero-cta"
            >
              Open Lumora
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-ink transition-transform group-hover:translate-x-0.5">
                <ArrowRight size={13} />
              </span>
            </AppLink>
            <AppLink
              path="/register"
              className="story-link flex items-center gap-2 text-sm font-medium text-heading"
              testId="link-hero-register"
            >
              Create a free account
            </AppLink>
            <AppLink
              path="/forgot-password"
              className="story-link flex items-center gap-2 text-sm font-medium text-heading"
              testId="link-hero-forgot-password"
            >
              Forgot password
            </AppLink>
            <a
              href="#features"
              className="story-link flex items-center gap-2 text-sm font-medium text-heading"
              data-testid="link-hero-story"
            >
              See the features <ChevronRight size={15} />
            </a>
          </div>
        </div>
        <div className="reveal reveal-delay-3 relative flex items-center justify-center lg:pt-4">
          <PublicOrb />
        </div>
      </section>

      <section id="why" className="scroll-mt-20 border-y border-border bg-band text-band-foreground">
        <div className="mx-auto max-w-[1440px] px-6 py-20 sm:px-10 sm:py-28 lg:px-16">
          <Reveal>
            <div className="grid gap-14 lg:grid-cols-[.72fr_1.28fr] lg:gap-20">
              <div>
                <div className="eyebrow flex items-center gap-3 text-band-muted">
                  <span className="text-band-accent">01</span>
                  <span className="h-px w-8 bg-current opacity-50" />
                  <span>The why</span>
                </div>
                <p className="mt-8 max-w-[15rem] text-sm leading-6 text-band-muted">
                  You should not need to think about the lock on the door every time you leave the house.
                </p>
              </div>
              <div>
                <h2 className="display max-w-[12ch] text-[clamp(3.4rem,7vw,7rem)] leading-[.86]">
                  Security should <em className="text-band-accent">disappear</em> into the background.
                </h2>
                <div className="mt-12 grid max-w-[50rem] gap-8 border-t border-band-foreground/20 pt-8 sm:grid-cols-2">
                  <p className="text-base leading-7 text-band-foreground/85">
                    The safest choice should also be the easiest one. No spreadsheet hiding in a drawer.
                    No trade-off between being protected and feeling free.
                  </p>
                  <p className="text-base leading-7 text-band-foreground/85">
                    Just a quiet place for the keys to your digital life — organized, encrypted, and yours to unlock.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="vault" className="scroll-mt-20 bg-card">
        <div className="mx-auto grid max-w-[1440px] items-center gap-14 px-6 py-24 sm:px-10 sm:py-32 lg:grid-cols-[.9fr_1.1fr] lg:gap-24 lg:px-16">
          <Reveal>
            <div className="eyebrow flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
              <span className="text-heading">02</span>
              <span className="h-px w-8 bg-current opacity-50" />
              <span>The vault</span>
            </div>
            <h2 className="display mt-7 max-w-[10ch] text-[clamp(3.7rem,7vw,7rem)] leading-[.82] text-heading">
              Put the <em className="text-emphasis">mess</em> away.
            </h2>
            <p className="mt-8 max-w-[28rem] text-base leading-7 text-[hsl(var(--muted-foreground))]">
              A secure vault for all the small doors into your life. Search, generate, favorite, and know what happened.
              Your vault key stays on the device; encrypted records stay with your account.
            </p>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-heading">
              <span className="flex items-center gap-2"><Check size={14} />encrypted vault</span>
              <span className="flex items-center gap-2"><Check size={14} />password generator</span>
              <span className="flex items-center gap-2"><Check size={14} />starred favorites</span>
            </div>
          </Reveal>
          <Reveal delay={140}>
            <div className="soft-card rounded-[1.8rem] p-5 sm:p-7">
              <div className="flex items-center gap-3 border-b border-current/10 pb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-lime">
                  <AppLogo className="h-4 w-3.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Your vault</p>
                  <p className="eyebrow mt-0.5 text-[hsl(var(--muted-foreground))]">only you can unlock it</p>
                </div>
                <span className="ml-auto text-[0.67rem] text-emphasis">AES-GCM</span>
              </div>
              {["Northstar Bank", "Morrow Studio", "Tideway Wi-Fi"].map((name, index) => (
                <div key={name} className="flex items-center gap-3 border-b border-current/5 px-1 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-moss text-xs font-semibold text-ink dark:bg-ink dark:text-lime">
                    {name[0]}
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{name}</span>
                    <span className="block text-[0.68rem] text-[hsl(var(--muted-foreground))]">
                      {["Finance", "Work", "Home"][index]} · encrypted
                    </span>
                  </span>
                  <ShieldCheck size={15} className="ml-auto text-emphasis" />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 border-y border-border bg-secondary">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
          <Reveal>
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="eyebrow flex items-center gap-3 text-[hsl(var(--muted-foreground))]">
                  <span className="text-heading">03</span>
                  <span className="h-px w-8 bg-current opacity-50" />
                  <span className="inline-flex items-center gap-2">
                    The features <Sparkles size={12} />
                  </span>
                </div>
                <h2 className="display mt-7 max-w-[13ch] text-[clamp(3.4rem,7vw,7rem)] leading-[.84] text-heading">
                  Built for the <em className="text-emphasis">everyday</em> vault.
                </h2>
              </div>
              <p className="max-w-[22rem] text-sm leading-6 text-[hsl(var(--muted-foreground))]">
                Ten quiet tools in the real Lumora app. Search, generate, recover, and keep your logins in order — on your phone or your desk.
              </p>
            </div>
          </Reveal>
          <Reveal fadeOnly delay={80}>
            <div className="mt-14 grid gap-px overflow-hidden rounded-[1.6rem] border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
              {CORE_FEATURES.map(({ icon: Icon, title, copy }) => (
                <article
                  key={title}
                  className="h-full bg-card p-5 sm:min-h-[13.5rem] sm:p-6"
                  data-testid={`card-feature-${title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-moss text-ink dark:bg-ink dark:text-lime">
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-5 text-sm font-semibold tracking-[-0.02em] text-heading">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{copy}</p>
                </article>
              ))}
            </div>
          </Reveal>
          <Reveal delay={80}>
            <div className="mt-10">
              <AppLink
                path="/register"
                className="story-link inline-flex items-center gap-2 text-sm font-medium text-heading"
                testId="link-features-cta"
              >
                Create an account and try them <ArrowRight size={15} />
              </AppLink>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="promise" className="scroll-mt-20 bg-panel text-panel-foreground">
        <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-10 sm:py-32 lg:px-16">
          <Reveal>
            <div className="grid gap-14 lg:grid-cols-[.82fr_1.18fr] lg:gap-24">
              <div>
                <div className="eyebrow flex items-center gap-3 text-panel-muted">
                  <span className="text-panel-foreground">04</span>
                  <span className="h-px w-8 bg-current opacity-50" />
                  <span>The promise</span>
                </div>
                <p className="mt-8 max-w-[15rem] text-sm leading-6 text-panel-muted">
                  Privacy is not a checkbox. It is the feeling that no one is standing behind you, taking notes.
                </p>
              </div>
              <div>
                <h2 className="display max-w-[12ch] text-[clamp(3.6rem,7vw,7rem)] leading-[.82] text-panel-foreground">
                  We keep it <em className="text-emphasis">simple.</em>
                </h2>
                <div className="mt-14 divide-y divide-panel-foreground/15 border-y border-panel-foreground/15">
                  {[
                    ["No watching", "Your vault is not a product we mine. We do not sell your data."],
                    ["No guessing", "Records are encrypted with AES-GCM. The vault key is derived on your device."],
                    ["No friction", "Search, generate, recover, and get back to what matters."],
                  ].map(([title, copy], index) => (
                    <Reveal key={title} fadeOnly delay={index * 90}>
                      <div className="grid gap-4 py-6 sm:grid-cols-[2rem_9rem_1fr]">
                        <span className="text-panel-foreground">0{index + 1}</span>
                        <span className="text-sm font-semibold text-panel-foreground">{title}</span>
                        <span className="max-w-[27rem] text-sm leading-6 text-panel-muted">{copy}</span>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-ink text-ink-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-24 sm:px-10 sm:py-32 lg:flex-row lg:items-end lg:justify-between lg:px-16">
          <Reveal>
            <div>
              <div className="eyebrow text-lime">05 / A calmer place to start</div>
              <h2 className="display mt-7 max-w-[11ch] text-[clamp(4rem,9vw,9rem)] leading-[.78]">
                Make space for what <em className="text-lime">matters.</em>
              </h2>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="flex flex-wrap items-center gap-4">
              <AppLink
                path="/register"
                className="magnetic-cta flex w-fit items-center gap-3 rounded-full border border-lime/40 px-5 py-3.5 text-sm font-semibold text-lime"
                testId="link-final-register"
              >
                Create account
              </AppLink>
              <AppLink
                path="/login"
                className="magnetic-cta flex w-fit items-center gap-3 rounded-full bg-lime px-5 py-3.5 text-sm font-semibold text-ink"
                testId="link-final-cta"
              >
                Open Lumora <ArrowRight size={15} />
              </AppLink>
              <AppLink
                path="/forgot-password"
                className="story-link text-sm font-medium text-lime"
                testId="link-final-forgot-password"
              >
                Forgot password
              </AppLink>
            </div>
          </Reveal>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
