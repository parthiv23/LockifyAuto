import type { ReactNode } from "react";
import { appUrl } from "@/lib/app-url";

export function AppLink({
  path,
  className,
  testId,
  children,
}: {
  path: string;
  className?: string;
  testId: string;
  children: ReactNode;
}) {
  const href = appUrl(path);
  const external = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={className}
      data-testid={testId}
      rel={external ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}
