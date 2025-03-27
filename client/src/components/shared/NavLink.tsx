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
            ? "border-primary text-gray-900"
            : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
          "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
        )}
      >
        {children}
      </a>
    </Link>
  );
}
