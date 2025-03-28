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
            ? "border-primary text-white"
            : "border-transparent text-gray-300 hover:border-gray-400 hover:text-white",
          "inline-flex items-center px-3 pt-1 border-b-2 text-sm font-medium transition-colors duration-200"
        )}
      >
        {children}
      </a>
    </Link>
  );
}
