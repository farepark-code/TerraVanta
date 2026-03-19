"use client";

import { useState, useEffect } from "react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLog } from "@/types/firestore";
import { ShieldAlert, Users, Building2, FileText, Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalConsultants: 0,
    totalClients: 0,
    totalAssessments: 0,
    totalReports: 0,
  });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for charts since aggregation is complex client-side
  const planData = [
    { name: 'Agency', value: 3 },
    { name: 'Pro', value: 12 },
    { name: 'Starter', value: 45 },
    { name: 'Trial', value: 10 }
  ];
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#6B7280'];

  const trendData = [
    { name: 'Jan', assessments: 12 },
    { name: 'Feb', assessments: 19 },
    { name: 'Mar', assessments: 24 },
    { name: 'Apr', assessments: 22 },
    { name: 'May', assessments: 35 },
    { name: 'Jun', assessments: 48 },
  ];

  useEffect(() => {
    async function loadData() {
      try {
        // Parallel counts logic simplified for MVP (normally we use aggregate queries or counters)
        const [cSnap, clSnap, aSnap, rSnap, logsSnap] = await Promise.all([
          getDocs(collection(db, "consultants")),
          getDocs(collection(db, "clients")),
          getDocs(collection(db, "assessments")),
          getDocs(collection(db, "reports")),
          getDocs(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(10)))
        ]);

        setStats({
          totalConsultants: cSnap.size,
          totalClients: clSnap.size,
          totalAssessments: aSnap.size,
          totalReports: rSnap.size,
        });

        setRecentLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <div className="p-8">Memuat data global...</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-md">Platform Overview</h1>
        <p className="text-emerald-100/60 mt-1">Memonitor metrik global seluruh penyewa platform (God Mode).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-panel border-emerald-500/20 glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Total Consultant</CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalConsultants}</div>
            <p className="text-xs text-emerald-100/40 mt-1">termasuk admin</p>
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Total Client Aktif</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Asesmen Selesai</CardTitle>
            <Activity className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalAssessments}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-emerald-500/20 glow-effect">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100/70">Laporan Dibuat</CardTitle>
            <FileText className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1 glass-panel">
          <CardHeader>
            <CardTitle className="text-emerald-50">Distribusi Paket Berlangganan (MoC)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {planData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1 glass-panel">
          <CardHeader>
            <CardTitle className="text-emerald-50">Trend Asesmen (MoC)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                 <XAxis dataKey="name" stroke="#a1a1aa" />
                 <YAxis stroke="#a1a1aa" />
                 <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                 <Line type="monotone" dataKey="assessments" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2 }} />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-emerald-50">Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogs.map((log) => {
              const dt = log.timestamp && 'toDate' in (log.timestamp as any) ? (log.timestamp as any).toDate().toLocaleString('id-ID') : '...';
              return (
                <div key={log.id} className="flex items-start justify-between border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 glow-effect"></div>
                    <div>
                      <p className="text-sm font-medium text-emerald-50">{log.action}</p>
                      <p className="text-xs text-emerald-100/50">Resource: {log.resourceType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-100/70">{log.uid.slice(0,8)}</p>
                    <p className="text-xs text-emerald-100/40">{dt}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
