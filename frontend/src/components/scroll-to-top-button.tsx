import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

const AUTH_ROUTES = new Set(["/login", "/register", "/forgot-password"]);

export function ScrollToTopButton() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);
  const frame = useRef(0);

  const hasFabs = location === "/" || location === "/starred";

  useEffect(() => {
    const sync = () => {
      setVisible(window.scrollY > 240);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(() => {
        frame.current = 0;
        sync();
      });
    };

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, [location]);

  if (AUTH_ROUTES.has(location)) return null;

  return (
    <button
      type="button"
      className={cn(
        "scroll-to-top-btn",
        hasFabs && "has-fabs",
        visible && "is-visible",
      )}
      aria-label="Scroll to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      data-testid="button-scroll-to-top"
      onClick={() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
      }}
    >
      <ArrowUp className="h-5 w-5" aria-hidden />
    </button>
  );
}
