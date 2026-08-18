"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface StatBox {
  label: string;
  value: ReactNode;
  href: string;
  gradient: string;
  iconBg: string;
  icon: ReactNode;
}

interface DashboardStatBoxesProps {
  boxes: StatBox[];
}

export function DashboardStatBoxes({ boxes }: DashboardStatBoxesProps) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {boxes.map((box) => (
        <Link
          key={box.label}
          href={box.href}
          className={`group relative overflow-hidden rounded-2xl p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${box.gradient}`}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10 blur-2xl transition-all duration-500 group-hover:scale-150"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-3xl transition-all duration-500 group-hover:scale-125"
          />

          <div
            className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner`}
          >
            {box.icon}
          </div>

          <p className="text-3xl font-bold text-white drop-shadow-sm">{box.value}</p>

          <p className="mt-1 text-sm font-medium text-white/80">{box.label}</p>

          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white/70 transition-all duration-300 group-hover:gap-2 group-hover:text-white">
            View details
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </Link>
      ))}
    </div>
  );
}
