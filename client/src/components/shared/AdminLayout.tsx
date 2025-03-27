import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import NavLink from "./NavLink";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full z-30">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-primary">RWS FanPhoto</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink href="/admin/dashboard" active={location === "/admin/dashboard"}>
                  Dashboard
                </NavLink>
                <NavLink href="/admin/moderation" active={location === "/admin/moderation"}>
                  Moderation
                </NavLink>
                <NavLink href="/admin/transformations" active={location === "/admin/transformations"}>
                  Transformations
                </NavLink>
                <NavLink href="/admin/display-settings" active={location === "/admin/display-settings"}>
                  Display Settings
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <button type="button" className="bg-primary p-1 rounded-full text-white hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <div className="ml-3 relative">
                <div>
                  <button type="button" className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" id="user-menu-button">
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
