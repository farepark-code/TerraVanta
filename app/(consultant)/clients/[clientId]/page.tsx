"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { ClientProfile, AuditLog } from "@/types/firestore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft, AlertTriangle, ShieldCheck, Eye } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ clientId: string }>;
}

export default function ClientDetail(props: PageProps) {
  const params = use(props.params);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const clientSnap = await getDoc(doc(db, "clients", params.clientId));
        if (clientSnap.exists()) {
          setClient({ id: clientSnap.id, ...clientSnap.data() } as ClientProfile);
        }

        const logsQ = query(
          collection(db, "auditLogs"), 
          where("resourceId", "==", params.clientId)
        );
        const logsSnap = await getDocs(logsQ);
        const logsData = logsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as AuditLog))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setLogs(logsData);
        
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.clientId]);

  if (loading) {
    return <div className="p-8 space-y-6"><Skeleton className="h-20 w-full" /><Skeleton className="h-96 w-full" /></div>;
  }
  if (!client) return <div className="p-8">Klien tidak ditemukan.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/consultant/dashboard">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="text-sm text-gray-500">
          Klien Saya / <span className="text-gray-900 font-medium">{client.companyName}</span>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{client.companyName}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="bg-gray-100">Tier {client.tier}</Badge>
            <Badge variant="outline" className={`capitalize ${client.status === 'active' ? 'bg-blue-50 text-blue-700' : client.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
              {client.status}
            </Badge>
            <span className="text-sm text-gray-500">{client.industry}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {client.status === 'completed' && (
            <Button className="bg-green-600 hover:bg-green-700">Generate Laporan Baru</Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="ringkasan" className="w-full mt-6 flex-1">
        <TabsList className="bg-white border-b rounded-none w-full justify-start h-auto p-0 pb-1 mb-6 gap-6">
          <TabsTrigger value="ringkasan" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:shadow-none px-1 py-2">Ringkasan</TabsTrigger>
          <TabsTrigger value="kuesioner" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:shadow-none px-1 py-2">Kuesioner</TabsTrigger>
          <TabsTrigger value="evidence" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:shadow-none px-1 py-2">Evidence</TabsTrigger>
          <TabsTrigger value="laporan" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:shadow-none px-1 py-2">Laporan</TabsTrigger>
          <TabsTrigger value="aktivitas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-600 data-[state=active]:shadow-none px-1 py-2">Aktivitas</TabsTrigger>
        </TabsList>

        <TabsContent value="ringkasan" className="space-y-6">
          <Card className="bg-gradient-to-br from-green-50 to-white overflow-hidden border-green-100">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <h3 className="text-sm font-bold tracking-wider text-green-800 uppercase mb-2">Skor ESG Final</h3>
              <div className="flex items-baseline gap-4 justify-center">
                <span className={`text-7xl font-bold tracking-tighter ${client.latestScore && client.latestScore >= 60 ? 'text-green-600' : 'text-gray-800'}`}>
                  {client.latestScore ?? "-"}
                </span>
                <span className="text-2xl text-gray-400 font-medium">/ 100</span>
              </div>
              <div className="mt-6">
                {client.latestRating ? (
                  <Badge className="px-6 py-2 text-xl font-bold bg-green-100 text-green-800 hover:bg-green-200">{client.latestRating}</Badge>
                ) : (
                  <Badge variant="outline" className="px-6 py-2 text-lg text-gray-500">Belum Ada Rating</Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['Environment', 'Social', 'Governance', 'Economic'].map(pillar => {
              const score = client.latestPillarScores?.[pillar.toLowerCase() as keyof typeof client.latestPillarScores] || 0;
              return (
                <Card key={pillar}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-gray-700">{pillar}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl font-bold">{score}</span>
                      <span className="text-sm text-gray-500">/ 100</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 transition-all" style={{ width: `${score}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-green-600"/> Compliance Flags</CardTitle>
            </CardHeader>
            <CardContent>
              {client.complianceFlags && client.complianceFlags.length > 0 ? (
                <div className="space-y-3">
                  {client.complianceFlags.map((flag, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-100 rounded-md">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">{flag}</h4>
                        <p className="text-sm text-yellow-700 mt-1">Regulasi/Alignment teridentifikasi berdasarkan jawaban kuesioner.</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Belum ada flag compliance yang terpicu.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kuesioner">
          <Card>
            <CardHeader>
              <CardTitle>Progres Kuesioner</CardTitle>
              <CardDescription>Gambaran pengisian assesment ESG oleh klien.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">Status: <span className="capitalize">{client.status}</span></h3>
              <p className="text-sm text-gray-500 max-w-sm mt-2 mb-6">Klien sedang dalam proses peninjauan pertanyaan. Anda dapat memantau atau mengunci kuesioner jika telah selesai didiskusikan.</p>
              <Button><Eye className="mr-2 h-4 w-4"/> Lihat & Isi Kuesioner</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence">
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p>Belum ada evidence/dokumen pendukung yang diunggah.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="laporan">
          <Card>
            <CardContent className="py-12 text-center text-gray-500 flex flex-col justify-center items-center">
              <Download className="h-10 w-10 mb-4 opacity-20" />
              <p>Belum ada laporan PDF/DOCX yang di-generate untuk klien ini.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aktivitas">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {logs.length ? logs.map((log) => (
                  <div key={log.id} className="relative pl-6 pb-2 border-l-2 border-gray-100 last:border-0 last:pb-0">
                    <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-[7px] top-1 border-2 border-white"></div>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{log.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500 mt-1">Sistem / {log.userRole}</p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {log.timestamp?.toLocaleString("id-ID") || "Waktu tak diketahui"}
                      </span>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-500 text-sm text-center py-4">Belum ada riwayat aktivitas.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
