import { Home, Heart, Search, User } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

const AUTH_PATHS = ["/login", "/register", "/forgot-password"];

export function MobileBottomNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const isSearch = (el: EventTarget | null) =>
      el instanceof HTMLElement && el.id === "vault-search-input";

    const onFocusIn = (e: FocusEvent) => setSearchFocused(isSearch(e.target));
    const onFocusOut = (e: FocusEvent) => {
      if (isSearch(e.target)) {
        requestAnimationFrame(() => {
          setSearchFocused(document.activeElement?.id === "vault-search-input");
        });
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (!user || AUTH_PATHS.includes(location)) return null;

  const focusSearch = () => {
    const go = () => {
      const input = document.getElementById("vault-search-input") as HTMLInputElement | null;
      input?.scrollIntoView({ behavior: "smooth", block: "center" });
      input?.focus();
    };
    if (location === "/" || location === "/starred") {
      go();
      return;
    }
    sessionStorage.setItem("lockify-focus-search", "1");
    setLocation("/");
  };

  const homeActive = location === "/" && !searchFocused;
  const starredActive = location === "/starred" && !searchFocused;
  const searchActive = searchFocused;
  const profileActive =
    (location === "/profile" ||
      location === "/about" ||
      location === "/history" ||
      location === "/trash") &&
    !searchFocused;

  const items = [
    {
      id: "home",
      label: "Home",
      active: homeActive,
      Icon: Home,
      onClick: () => setLocation("/"),
    },
    {
      id: "starred",
      label: "Starred",
      active: starredActive,
      Icon: Heart,
      onClick: () => setLocation("/starred"),
    },
    {
      id: "search",
      label: "Search",
      active: searchActive,
      Icon: Search,
      onClick: focusSearch,
    },
    {
      id: "profile",
      label: "Profile",
      active: profileActive,
      Icon: User,
      onClick: () => setLocation("/profile"),
    },
  ] as const;

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden />
      <nav
        className="md:hidden fixed left-1/2 z-[60] w-[min(92%,22rem)] -translate-x-1/2 bottom-[max(1rem,env(safe-area-inset-bottom))]"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around rounded-full border border-border bg-card px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_40px_rgba(0,0,0,0.55)]">
          {items.map(({ id, label, active, Icon, onClick }) => (
            <button
              key={id}
              type="button"
              onClick={onClick}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              data-testid={`mobile-nav-${id}`}
              id={id === "profile" ? "tour-avatar-mobile" : undefined}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon
                className="h-6 w-6"
                strokeWidth={active ? 2.25 : 1.75}
                fill={active ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
