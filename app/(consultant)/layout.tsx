"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase/client";
import { LogOut, Home, Users, BarChart2, Settings } from "lucide-react";

export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSuperAdmin, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center">Memuat...</div>;

  const navItems = [
    { name: "Dasbor", href: "/consultant/dashboard", icon: Home },
    { name: "Klien Saya", href: "/consultant/clients", icon: Users },
    { name: "Laporan", href: "/consultant/reports", icon: BarChart2 },
    { name: "Pengaturan", href: "/consultant/settings/profile", icon: Settings },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {isSuperAdmin && (
        <div className="bg-red-900 text-white px-6 py-3 flex items-center justify-between text-sm shadow-md z-50">
          <div className="flex items-center gap-2 font-medium">
            <span>⚡ SUPER ADMIN MODE AKTIF — Kamu dapat mengakses seluruh data platform.</span>
          </div>
          <Link href="/admin/dashboard" className="bg-white text-red-900 px-4 py-1.5 rounded-md font-bold hover:bg-red-50 transition-colors">
            Buka Admin Dashboard →
          </Link>
        </div>
      )}
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r flex flex-col flex-shrink-0">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold text-gray-800">ESG Platform</h1>
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
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-green-700" : "text-gray-400"}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t mt-auto">
            <div className="mb-4 px-4 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.displayName || "Konsultan"}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Keluar
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
