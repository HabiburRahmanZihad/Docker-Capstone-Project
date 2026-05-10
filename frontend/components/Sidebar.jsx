"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  HardDrive,
  Network,
  Image,
  Container,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/containers", label: "Containers", icon: Box },
  { href: "/images", label: "Images", icon: Image },
  { href: "/volumes", label: "Volumes", icon: HardDrive },
  { href: "/networks", label: "Networks", icon: Network },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-gray-700">
        <Container className="w-6 h-6 text-blue-400" />
        <span className="text-lg font-bold tracking-tight">DockerManager</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-4 border-t border-gray-700 text-xs text-gray-500">
        Docker Engine API
      </div>
    </aside>
  );
}
