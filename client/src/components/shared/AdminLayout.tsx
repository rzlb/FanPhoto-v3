import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import NavLink from "./NavLink";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <img src="/assets/rws-logo-dark.png" alt="RWS Logo" className="h-8 mr-3" />
                <span className="text-xl font-bold text-gray-800">FanPhoto</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8">
                <NavLink href="/admin/dashboard" active={location === "/admin/dashboard" || location === "/admin"}>
                  Dashboard
                </NavLink>
                <NavLink href="/admin/moderation" active={location === "/admin/moderation"}>
                  Moderation
                </NavLink>
                <NavLink href="/admin/archived" active={location === "/admin/archived"}>
                  Archived
                </NavLink>
                <NavLink href="/admin/display-settings" active={location === "/admin/display-settings"}>
                  Display Settings
                </NavLink>
                <NavLink href="/admin/analytics" active={location === "/admin/analytics"}>
                  Analytics
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/display" target="_blank">
                <a className="mr-4 text-sm text-primary hover:text-primary-dark flex items-center" target="_blank" rel="noopener noreferrer">
                  <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Display
                </a>
              </Link>
              <div className="ml-3 relative">
                <div>
                  <button type="button" className="bg-gray-100 rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" id="user-menu-button">
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center">
                      <span className="text-sm font-medium">AD</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="pt-16 flex flex-col flex-grow">
        <main className="flex-grow flex">
          <div className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
