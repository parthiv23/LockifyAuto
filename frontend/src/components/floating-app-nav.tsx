import { useState, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { resolveAvatarUrl } from "@/lib/avatars";

type FloatingAppNavProps = {
  extra?: ReactNode;
};

export function FloatingAppNav({ extra }: FloatingAppNavProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [avatarLoading, setAvatarLoading] = useState(true);

  const avatarUrl = resolveAvatarUrl(user?.profileimage, user?.id || user?.username || "1");

  return (
    <nav
      className={cn(
        "floating-app-nav hidden md:flex fixed top-4 left-1/2 z-50 items-center",
        "rounded-full border text-foreground",
      )}
      aria-label="Main"
    >
      <button
        type="button"
        className="nav-brand flex items-center gap-2 rounded-full text-left"
        onClick={() => setLocation("/")}
        aria-label="Go to dashboard"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 141 166" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M70 46L70.5 83L101 101.5V148L69.5 166L0 125V41L31.5 23L70 46ZM8 120L69.5 156.263V120L38.5 102V64L8 46.5V120Z" />
            <path d="M140.5 125L108.5 143.5V60.5L39 18.5L70 0L140.5 42V125Z" />
          </svg>
        </span>
        <h1 className="nav-title text-xl text-foreground">Lumora</h1>
      </button>

      <div className="nav-actions flex items-center gap-1 sm:gap-2">
        {extra}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="rounded-full p-2"
          data-testid="button-theme-toggle"
        >
          {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </Button>

        {user && (
          <div
            id="tour-avatar-desktop"
            className="flex cursor-pointer items-center gap-2 rounded-full pr-1"
            onClick={() => setLocation("/profile")}
          >
            <div className="relative h-7 w-7">
              {avatarLoading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-muted">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <img
                key={avatarUrl}
                src={avatarUrl}
                alt="avatar"
                className={`h-7 w-7 rounded-full border ${avatarLoading ? "opacity-0" : "opacity-100"}`}
                onLoad={() => setAvatarLoading(false)}
                onError={() => setAvatarLoading(false)}
              />
            </div>
            <span className="hidden text-sm text-foreground sm:inline">{user.username}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
