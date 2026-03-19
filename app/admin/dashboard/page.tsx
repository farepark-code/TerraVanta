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
        <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
        <p className="text-gray-500">Memonitor metrik global seluruh penyewa platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consultant</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConsultants}</div>
            <p className="text-xs text-gray-500">termasuk admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Client Aktif</CardTitle>
            <Building2 className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asesmen Selesai</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAssessments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan Dibuat</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Distribusi Paket Berlangganan (MoC)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {planData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Trend Asesmen (MoC)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={trendData}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" />
                 <YAxis />
                 <Tooltip />
                 <Line type="monotone" dataKey="assessments" stroke="#991B1B" strokeWidth={3} />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live Activity Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLogs.map((log) => {
              const dt = log.timestamp && 'toDate' in (log.timestamp as any) ? (log.timestamp as any).toDate().toLocaleString('id-ID') : '...';
              return (
                <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-600 mt-1"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500">Resource: {log.resourceType}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{log.uid.slice(0,8)}</p>
                    <p className="text-xs text-gray-400">{dt}</p>
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
