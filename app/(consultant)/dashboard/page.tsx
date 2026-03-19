"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Eye, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ClientProfile, RatingBand } from "@/types/firestore";

function getRatingBadgeColor(rating: RatingBand | null) {
  if (!rating) return "bg-white/10 text-emerald-100/50 border border-white/10";
  if (["AAA", "AA", "A"].includes(rating)) return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
  if (["BBB", "BB"].includes(rating)) return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  return "bg-red-500/20 text-red-300 border border-red-500/30";
}

export default function Dashboard() {
  const { user, consultantId, loading: authLoading } = useAuth();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClients: 0,
    avgScore: 0,
    completedAssessments: 0,
    reportsGenerated: 0,
  });

  useEffect(() => {
    async function fetchData() {
      if (!user || (!consultantId && !user.uid)) return;
      const targetId = consultantId || user.uid;

      try {
        const q = query(
          collection(db, "clients"),
          where("consultantId", "==", targetId)
        );
        const snapshot = await getDocs(q);
        const clientsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClientProfile));
        
        // Manual sort if index is missing
        clientsData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setClients(clientsData);

        const total = clientsData.length;
        const scoredClients = clientsData.filter(c => c.latestScore !== null);
        const avg = scoredClients.reduce((acc, c) => acc + (c.latestScore || 0), 0) / (scoredClients.length || 1);
        
        setStats({
          totalClients: total,
          avgScore: Math.round(avg),
          completedAssessments: scoredClients.length,
          reportsGenerated: 0, 
        });
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) fetchData();
  }, [user, consultantId, authLoading]);

  const dateStr = new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  if (authLoading) return null;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-end animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Selamat datang, Konsultan</h1>
          <p className="text-emerald-100/60 mt-1">{dateStr}</p>
        </div>
        <Link href="/consultant/clients/new">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white glow-effect transition-all hover:scale-105">
            <Plus className="mr-2 h-4 w-4" /> Tambah Klien Baru
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
        <Card className="glass-panel border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Total Klien Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : <div className="text-4xl font-black text-white">{stats.totalClients}</div>}
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Rata-rata Skor ESG</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : <div className="text-4xl font-black text-white">{stats.avgScore}</div>}
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Assessment Selesai</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : <div className="text-4xl font-black text-white">{stats.completedAssessments}</div>}
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 hover:border-emerald-500/50 transition-colors">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Laporan Dibuat</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-8 w-16 bg-white/10" /> : <div className="text-4xl font-black text-white">{stats.reportsGenerated}</div>}
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        <CardHeader>
          <CardTitle className="text-emerald-50">Daftar Klien Eksekutif</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
              <Skeleton className="h-10 w-full bg-white/10" />
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white/5 border border-white/10 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-4 glow-effect">
                <Users className="h-10 w-10 text-emerald-400" />
              </div>
              <h3 className="text-lg font-medium text-emerald-50">Belum ada klien</h3>
              <p className="text-emerald-100/50 mt-1 mb-6">Mulai tambahkan klien pertama Anda untuk melakukan assessment ESG.</p>
              <Link href="/consultant/clients/new">
                <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"><Plus className="mr-2 h-4 w-4" />Tambah Klien</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-sm font-medium text-emerald-100/50">
                    <th className="pb-3 pl-2">Nama Perusahaan</th>
                    <th className="pb-3">Industri</th>
                    <th className="pb-3">Tier</th>
                    <th className="pb-3">Skor & Rating</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 pl-2 font-medium text-emerald-50">{client.companyName}</td>
                      <td className="py-4 text-emerald-100/60">{client.industry}</td>
                      <td className="py-4 text-emerald-100/60">Tier {client.tier}</td>
                      <td className="py-4">
                        {client.latestScore !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-50">{client.latestScore}</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRatingBadgeColor(client.latestRating)}`}>
                              {client.latestRating}
                            </span>
                          </div>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${getRatingBadgeColor(null)}`}>
                            Belum Dinilai
                          </span>
                        )}
                      </td>
                      <td className="py-4 capitalize text-emerald-100/60">{client.status}</td>
                      <td className="py-4 text-right pr-2">
                        <div className="flex justify-end gap-2">
                          <Link href={`/consultant/clients/${client.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 hover:bg-emerald-500/10 hover:text-emerald-400 text-emerald-100/70"><Eye className="h-4 w-4 mr-1"/> Detail</Button>
                          </Link>
                          {client.status === 'completed' && (
                            <Button variant="outline" size="sm" className="h-8 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10"><FileText className="h-4 w-4 mr-1"/> Laporan</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
