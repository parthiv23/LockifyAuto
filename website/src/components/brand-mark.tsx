import { AppLogo } from "@/components/app-logo";
import { cn } from "@/lib/utils";

export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5" data-testid="brand-lumora">
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-[0.9rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,.14)]",
          inverse ? "bg-lime text-ink" : "bg-ink text-lime",
        )}
      >
        <AppLogo className="h-[1.2rem] w-[1.02rem]" />
      </span>
      <span className="text-[1.02rem] font-semibold tracking-[-0.04em]">lumora</span>
    </span>
  );
}
