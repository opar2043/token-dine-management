"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/lib/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

function IconGrid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function IconUsers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function IconPackage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}
function IconTable() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}
function IconChart() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
function IconCreditCard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}
function IconClipboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" />
    </svg>
  );
}
function IconGift() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}
function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

const navByRole: Record<Role, NavItem[]> = {
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: <IconGrid /> },
    { label: "Users", href: "/dashboard/admin/users", icon: <IconUsers /> },
    { label: "Clients", href: "/dashboard/admin/clients", icon: <IconUser /> },
    { label: "Products", href: "/dashboard/admin/products", icon: <IconPackage /> },
    { label: "Tables", href: "/dashboard/admin/tables", icon: <IconTable /> },
    { label: "Product Flow", href: "/dashboard/admin/product-flow", icon: <IconChart /> },
    { label: "Transactions", href: "/dashboard/admin/transactions", icon: <IconCreditCard /> },
    { label: "Attendance", href: "/dashboard/admin/attendance", icon: <IconClipboard /> },
    { label: "Bonuses", href: "/dashboard/admin/bonuses", icon: <IconGift /> },
    { label: "Complaints", href: "/dashboard/admin/complaints", icon: <IconAlert /> },
  ],
  manager: [
    { label: "Overview", href: "/dashboard/manager", icon: <IconGrid /> },
    { label: "Workers", href: "/dashboard/manager/workers", icon: <IconUsers /> },
    { label: "Daily Progress", href: "/dashboard/manager/daily-progress", icon: <IconChart /> },
    { label: "Tables", href: "/dashboard/manager/tables", icon: <IconTable /> },
    { label: "Attendance", href: "/dashboard/manager/attendance", icon: <IconClipboard /> },
    { label: "Inventory", href: "/dashboard/manager/inventory", icon: <IconPackage /> },
    { label: "Sales", href: "/dashboard/manager/sales", icon: <IconCreditCard /> },
    { label: "Bonusess", href: "/dashboard/manager/bonuses", icon: <IconGift /> },
    { label: "Clients Bonus", href: "/dashboard/manager/clients-bonus", icon: <IconTarget /> },
  ],
  
  worker: [
    { label: "Clients", href: "/dashboard/worker/clients", icon: <IconUser /> },
    { label: "New Client", href: "/dashboard/worker/new-client", icon: <IconPlus /> },
    { label: "Sell Token", href: "/dashboard/worker/sell-token", icon: <IconCreditCard /> },
    { label: "Sales", href: "/dashboard/worker/sales", icon: <IconChart /> },
    { label: "My Progress", href: "/dashboard/worker/progress", icon: <IconGrid /> },
    { label: "Attendance", href: "/dashboard/worker/attendance", icon: <IconClipboard /> },
    { label: "Complaints", href: "/dashboard/worker/complaints", icon: <IconAlert /> },
  ],
};

interface SidebarProps {
  role: Role;
  onNavigate?: () => void;
}

export function Sidebar({ role, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-gray-100 bg-white dark:border-gray-800 dark:bg-gray-950">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-sm font-bold text-white shadow-sm">
          TD
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Token Dine</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{role} portal</p>
        </div>
      </div>
      <nav className="flex-1  px-2 ">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <span className="flex h-7 w-6 shrink-0 items-center justify-center rounded-lg  text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-500">v1.0.0</p>
      </div>
    </aside>
  );
}
