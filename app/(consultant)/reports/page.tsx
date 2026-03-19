"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { ClientProfile } from "@/types/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Loader2, Download, RefreshCcw } from "lucide-react";

interface Report {
  id: string;
  clientId: string;
  companyName: string;
  format: 'pdf' | 'docx';
  downloadUrl: string;
  generatedAt: any;
  finalScore: number;
  ratingBand: string;
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<'pdf'|'docx'>('pdf');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const rSnap = await getDocs(
          query(collection(db, "reports"), where("consultantId", "==", user.uid), orderBy("generatedAt", "desc"))
        );
        setReports(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));

        const cSnap = await getDocs(
          query(collection(db, "clients"), where("consultantId", "==", user.uid), where("status", "==", "completed"))
        );
        setClients(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as ClientProfile)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleGenerate = async () => {
    if (!selectedClient || !selectedFormat) {
      toast.error("Harap pilih klien dan format laporan");
      return;
    }

    setGenerating(true);
    try {
      // Find assessment details
      const aSnap = await getDocs(
        query(collection(db, "assessments"), where("clientId", "==", selectedClient), where("status", "==", "scored"))
      );
      if (aSnap.empty) throw new Error("Assessment tidak ditemukan atau belum selesai dinilai.");
      const assessmentId = aSnap.docs[0].id;

      const generateReportFunc = httpsCallable(functions, "generateReport");
      const { data } = await generateReportFunc({
        clientId: selectedClient,
        assessmentId: assessmentId,
        format: selectedFormat
      }) as any;

      toast.success("Laporan berhasil dibuat!");
      window.open(data.downloadUrl, "_blank");
      setGenerateOpen(false);
      
      // Refresh list
      const newRSnap = await getDocs(
        query(collection(db, "reports"), where("consultantId", "==", user?.uid), orderBy("generatedAt", "desc"))
      );
      setReports(newRSnap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Gagal membuat laporan.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="p-8">Memuat laporan...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan ESG</h1>
          <p className="text-gray-500">Kumpulan laporan whitelabel untuk klien-klien kamu.</p>
        </div>

        <Dialog open={generateOpen} onOpenChange={setGenerateOpen}>
          <DialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2">Buat Laporan Baru</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buat Laporan Whitelabel</DialogTitle>
              <DialogDescription>
                Laporan akan mencakup seluruh hasil asesmen, metrik, skor, dan rekomendasi menggunakan warna & logo firma kamu.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Pilih Klien (Telah Selesai Asesmen)</label>
                <Select value={selectedClient} onValueChange={(val) => { if(val) setSelectedClient(val) }}>
                  <SelectTrigger><SelectValue placeholder="-- Pilih Klien --" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id || ""}>{c.companyName} (Skor: {c.latestScore})</SelectItem>
                    ))}
                    {clients.length === 0 && <div className="p-2 text-sm text-gray-500">Tidak ada klien yang selesai asesmen.</div>}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Format Output</label>
                <Select value={selectedFormat} onValueChange={(val) => { if(val) setSelectedFormat(val as 'pdf'|'docx') }}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">Laporan PDF (Visual Standar)</SelectItem>
                    <SelectItem value="docx">Laporan MS Word (Editable)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setGenerateOpen(false)}>Batal</Button>
              <Button onClick={handleGenerate} disabled={generating || clients.length === 0} className="bg-blue-600 w-32">
                {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Buat Laporan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map(r => {
          const dt = r.generatedAt?.toDate ? r.generatedAt.toDate().toLocaleString('id-ID') : '';
          return (
            <Card key={r.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-1" title={r.companyName}>{r.companyName}</h3>
                      <p className="text-xs text-gray-500">{dt}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={r.format === 'pdf' ? 'bg-red-50 text-red-700 uppercase' : 'bg-blue-50 text-blue-700 uppercase'}>
                    {r.format}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 mb-6 p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-xs text-gray-500">Skor</p>
                    <p className="font-bold text-gray-900">{r.finalScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-bold text-gray-900">{r.ratingBand}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a href={r.downloadUrl} target="_blank" rel="noreferrer" className="flex-1">
                    <Button variant="default" className="w-full">
                      <Download className="w-4 h-4 mr-2" /> Unduh
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {reports.length === 0 && (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white border rounded border-dashed">
            Belum ada laporan yang di-generate.
          </div>
        )}
      </div>

    </div>
  );
}
