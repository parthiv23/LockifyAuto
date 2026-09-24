import { useEffect } from "react";
import { appUrl } from "@/lib/app-url";

export function RedirectToApp({ path }: { path: string }) {
  const target = appUrl(path);

  useEffect(() => {
    window.location.replace(target);
  }, [target]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-6">
      <p className="text-sm text-[hsl(var(--muted-foreground))]">Opening Lumora…</p>
    </main>
  );
}
