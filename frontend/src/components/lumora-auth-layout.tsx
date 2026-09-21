import type { ReactNode } from "react";
import { Link } from "wouter";
import { Check, KeyRound, LockKeyhole, Moon, Sun, X } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { AppLogo } from "@/components/app-logo";
import type { PasswordValidation } from "@/lib/password-validation";

export type AuthMode = "unlock" | "create" | "recover";

export function BrandMark() {
  return (
    <span className="inline-flex items-center gap-2.5" data-testid="brand-lumora">
      <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#084734] text-[#cef17b]">
        <span className="absolute h-4 w-4 rounded-full border border-current opacity-60" />
        <AppLogo className="relative z-10 h-3.5 w-3.5" />
      </span>
      <span className="text-[1.02rem] font-semibold tracking-[-0.04em]">lumora</span>
    </span>
  );
}

const tabs: { mode: AuthMode; href: string; label: string; testId: string }[] = [
  { mode: "unlock", href: "/login", label: "Unlock", testId: "button-mode-unlock" },
  { mode: "create", href: "/register", label: "New vault", testId: "button-mode-create" },
  { mode: "recover", href: "/forgot-password", label: "Recovery", testId: "button-mode-recover" },
];

export function LumoraAuthLayout({
  mode,
  title,
  children,
}: {
  mode: AuthMode;
  title: string;
  children: ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  return (
    <main className="lumora-auth flex min-h-[100dvh] min-h-[100svh] w-full max-w-[100vw] flex-col">
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:py-5 lg:px-10">
        <Link href="/login" className="lumora-focus-ring min-w-0 rounded-full" data-testid="link-login-brand">
          <BrandMark />
        </Link>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="lumora-eyebrow hidden text-muted-foreground md:block">
            local-first / zero knowledge
          </span>
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="lumora-focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-current/15 text-current transition hover:bg-current/10"
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
            data-testid="button-theme-toggle"
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-2 sm:items-center sm:px-6 sm:py-8 lg:px-10">
        <div className="grid w-full min-w-0 max-w-6xl items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12 xl:gap-16">
          <div className="min-w-0 text-center lg:text-left">
            <p className="lumora-eyebrow text-[#4b8b69]">A quiet place for your keys</p>
            <h1 className="lumora-display mx-auto mt-4 max-w-[8ch] text-[clamp(3.4rem,12vw,7rem)] leading-[.78] text-[#084734] sm:mt-6 lg:mx-0 lg:mt-7 dark:text-[#cef17b]">
              Security,
              <br />
              <em className="text-[#4b8b69]">invisible.</em>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:mt-6 lg:mx-0 lg:mt-7">
              Lumora encrypts your vault with a key only you hold. Sign in to open it, or recover with
              the key you saved when you created your account.
            </p>
            <div className="mt-5 hidden items-center justify-center gap-3 text-xs text-muted-foreground sm:flex lg:mt-10 lg:justify-start">
              <LockKeyhole size={16} className="shrink-0 text-[#4b8b69]" />
              <span>AES-GCM encryption · your vault key never leaves this device</span>
            </div>
          </div>

          <div className="lumora-soft-card mx-auto w-full min-w-0 max-w-[30rem] rounded-[1.5rem] p-5 sm:rounded-[2rem] sm:p-8 lg:mx-0 lg:justify-self-end xl:p-9">
            <div className="mb-6 flex items-center gap-2 border-b border-current/10 pb-4 sm:mb-8 sm:pb-5">
              <KeyRound className="shrink-0 text-[#4b8b69]" size={20} />
              <span className="text-sm font-semibold">{title}</span>
            </div>
            <div className="mb-5 flex gap-1 rounded-xl bg-[#cdefb3]/45 p-1 dark:bg-[#084734] sm:mb-6">
              {tabs.map((tab) => (
                <Link
                  key={tab.mode}
                  href={tab.href}
                  className={`flex min-w-0 flex-1 items-center justify-center rounded-lg px-1.5 py-2 text-center text-[0.65rem] font-semibold sm:px-3 sm:text-xs ${
                    mode === tab.mode
                      ? "bg-[#084734] text-[#cef17b]"
                      : "text-muted-foreground"
                  }`}
                  data-testid={tab.testId}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export function PasswordRules({ validation }: { validation: PasswordValidation }) {
  const rows = [
    { ok: validation.checks.length, label: "8+ characters" },
    { ok: validation.checks.uppercase, label: "Uppercase letter" },
    { ok: validation.checks.lowercase, label: "Lowercase letter" },
    { ok: validation.checks.number && validation.checks.special, label: "Number & symbol" },
  ];
  return (
    <div className="mt-2 grid grid-cols-1 gap-1 text-[0.68rem] min-[400px]:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center gap-1">
          {row.ok ? <Check className="h-3 w-3 text-[#4b8b69]" /> : <X className="h-3 w-3 text-red-600" />}
          <span className={row.ok ? "text-[#4b8b69]" : "text-red-600"}>{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function AuthStatus({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "success";
}) {
  return (
    <p
      className={`mt-4 rounded-xl p-3 text-xs leading-5 ${
        tone === "success" ? "bg-[#cdefb3] text-[#084734]" : "bg-[#084734]/10 text-foreground"
      }`}
      role="status"
      data-testid="status-login"
    >
      {children}
    </p>
  );
}
