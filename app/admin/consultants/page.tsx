"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { ConsultantProfile } from "@/types/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Edit2, Ban, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<ConsultantProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "consultants"), orderBy("createdAt", "desc")));
        setConsultants(snap.docs.map(d => ({ id: d.id, ...d.data() } as ConsultantProfile)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleImpersonate = (firmName: string) => {
    // Basic frontend simulation. Real impersonation requires token changes or complex state management.
    toast.success(`Viewing as ${firmName}. (Simulasi UI impersonation)`);
  };

  const handleDisable = (firmName: string) => {
    if (confirm(`Apakah Anda yakin ingin menonaktifkan ${firmName}?`)) {
      toast.success(`Akun ${firmName} dinonaktifkan.`);
      // write AuditLog 'CONSULTANT_DISABLED'
    }
  };

  const filtered = consultants.filter(c => 
    c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Consultant</h1>
          <p className="text-gray-500">Daftar semua penyewa platform beserta status langganan.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                placeholder="Cari firma atau email..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead>Nama Firma</TableHead>
                <TableHead>Email Akun</TableHead>
                <TableHead>Klien</TableHead>
                <TableHead>Laporan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              
              {!loading && filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-[10px] font-bold">
                        {c.companyName[0]}
                      </div>
                      {c.companyName}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-500">{c.email}</TableCell>
                  <TableCell>...</TableCell>
                  <TableCell>{999999 - c.reportCredits} / ♾️</TableCell>
                  <TableCell>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Aktif</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleImpersonate(c.companyName)}>
                        <Eye className="w-4 h-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => handleDisable(c.companyName)}>
                        <Ban className="w-4 h-4 mr-1" /> Disable
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">Tidak ada consultant ditemukan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
