import { cn } from "@/lib/utils";

type AppLogoProps = {
  className?: string;
};

export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 141 166"
      fill="currentColor"
      preserveAspectRatio="xMidYMid meet"
      className={cn("block", className)}
    >
      <path d="M70 46 70.5 83 101 101.5V148L69.5 166 0 125V41L31.5 23 70 46Zm-62 74 61.5 36.263V120L38.5 102V64L8 46.5V120Z" />
      <path d="M140.5 125 108.5 143.5V60.5L39 18.5 70 0l70.5 42v83Z" />
    </svg>
  );
}
