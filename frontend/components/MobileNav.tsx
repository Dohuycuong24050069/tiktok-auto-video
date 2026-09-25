"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "⚡", label: "Dashboard" },
  { href: "/projects",  icon: "📂", label: "Dự án" },
  { href: "/settings",  icon: "⚙️",  label: "Cài đặt" },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex border-t px-2 py-2 gap-1"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200"
          style={{
            background: pathname.startsWith(item.href) ? "rgba(77,111,255,0.15)" : "transparent",
            color: pathname.startsWith(item.href) ? "var(--text-primary)" : "var(--text-secondary)",
          }}>
          <span className="text-xl leading-none">{item.icon}</span>
          <span className="text-xs font-semibold">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
