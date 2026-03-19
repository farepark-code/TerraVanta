"use client";

import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, Users, Building2, 
  FileText, Settings, ShieldAlert,
  ListTodo, UserSquare2, LogOut
} from "lucide-react";
import { useEffect } from "react";
import { auth } from "@/lib/firebase/client";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isSuperAdmin, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) {
      router.push('/consultant/dashboard');
    }
  }, [user, isSuperAdmin, loading, router]);

  if (loading) return <div className="p-8">Memuat Admin God Mode...</div>;
  if (!user || !isSuperAdmin) return null;

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/admin/consultants", label: "Semua Consultant", icon: Users },
    { href: "/admin/clients", label: "Semua Client", icon: Building2 },
    { href: "/admin/reports", label: "Laporan Platform", icon: FileText },
    { href: "/admin/templates", label: "Template Kuesioner", icon: ListTodo },
    { href: "/admin/admins", label: "Manage Admin", icon: UserSquare2 },
    { href: "/admin/audit-logs", label: "Audit Log", icon: ShieldAlert },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar - Theme #991B1B */}
      <aside className="w-64 bg-[#991B1B] text-white flex flex-col shadow-xl z-20">
        <div className="p-6 border-b border-red-800/50">
          <div className="flex items-center gap-2 text-xl font-bold mb-1">
            <ShieldAlert className="w-6 h-6 text-yellow-400" /> 
            SUPER ADMIN
          </div>
          <p className="text-xs text-red-200">ESG God Mode Aktif</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {menuItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link href={item.href} className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-red-800 text-white shadow-inner' : 'text-red-100 hover:bg-red-800/50 hover:text-white'}`}>
                    <Icon className={`mr-3 h-5 w-5 ${active ? 'text-white' : 'text-red-300'}`} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-red-800/50 space-y-2">
          <Link href="/consultant/dashboard">
            <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-200 hover:text-white hover:bg-red-800/50 rounded-md transition-colors">
              <LogOut className="mr-3 h-5 w-5 rotate-180" />
              Kembali ke Dashboard
            </button>
          </Link>
          <button onClick={handleLogout} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-200 hover:text-white hover:bg-red-800/50 rounded-md transition-colors">
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        {children}
      </main>
    </div>
  );
}
