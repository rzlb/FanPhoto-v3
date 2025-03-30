import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

export default function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          active
            ? "border-primary text-primary font-medium dark:text-primary"
            : "border-transparent text-muted-foreground hover:border-border hover:text-foreground dark:hover:border-muted dark:hover:text-muted-foreground",
          "inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
        )}
      >
        {children}
      </a>
    </Link>
  );
}
