"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase/client";
import { LogOut, Home, Users, BarChart2, Settings, FileText, ShieldAlert } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Memuat...</div>;

  const navItems = [
    { name: "Dasbor", href: "/admin/dashboard", icon: Home },
    { name: "Daftar Klien", href: "/admin/clients", icon: Users },
    { name: "Laporan", href: "/admin/reports", icon: BarChart2 },
    { name: "Template Kuisioner", href: "/admin/templates", icon: FileText },
    { name: "Audit Logs", href: "/admin/audit-logs", icon: ShieldAlert },
    { name: "Pengaturan", href: "/admin/settings/profile", icon: Settings },
  ];

  const handleLogout = async () => {
    document.cookie = "session=; path=/; max-age=0";
    await auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-xl font-bold text-white">ESG Platform</h1>
            <p className="text-xs text-emerald-400 mt-1">Admin Console</p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-md transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20"
                      : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-emerald-400" : "text-zinc-500"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-zinc-800 mt-auto">
            <div className="mb-4 px-4 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.displayName || "Administrator"}</p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative bg-zinc-950 text-white">
          {children}
        </main>
      </div>
    </div>
  );
}
