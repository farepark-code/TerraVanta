"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { QuestionnaireTemplate } from "@/types/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Edit, Plus, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TemplateManagerPage() {
  const [templates, setTemplates] = useState<QuestionnaireTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "questionnaireTemplates"), orderBy("id", "asc")));
      
      const data = snap.docs.map(d => ({ docId: d.id, ...d.data() } as QuestionnaireTemplate & { docId: string }));
      
      data.sort((a, b) => {
        const matchA = a.id.match(/^([a-zA-Z]+)(\d+)\.(\d+)$/);
        const matchB = b.id.match(/^([a-zA-Z]+)(\d+)\.(\d+)$/);
        if (!matchA || !matchB) return a.id.localeCompare(b.id);
        if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
        if (parseInt(matchA[2], 10) !== parseInt(matchB[2], 10)) return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
        return parseInt(matchA[3], 10) - parseInt(matchB[3], 10);
      });

      setTemplates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (docId: string, idStr: string) => {
    if (confirm(`Pertanyaan ${idStr} ini akan dihapus dari semua assessment baru. Lanjutkan?`)) {
      try {
        await deleteDoc(doc(db, "questionnaireTemplates", docId));
        toast.success(`Template ${idStr} dihapus.`);
        load();
        // write AuditLog 'TEMPLATE_DELETED'
      } catch (e) {
        toast.error("Gagal menghapus template");
      }
    }
  };

  const handleReseed = async () => {
    if (confirm("Peringatan: Re-seed akan membaca file TXT script lokal dan mungkin menimpa data di Firestore (jika ID sama). Lanjutkan?")) {
      toast.info("Fitur Re-seed dieksekusi via terminal (npm run seed) karena alasan keamanan data di production.");
    }
  };

  const filtered = templates.filter(t => {
    const matchSearch = t.questionText.toLowerCase().includes(searchTerm.toLowerCase()) || t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTier = tierFilter === "all" ? true : t.tier.toString() === tierFilter;
    return matchSearch && matchTier;
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Template Kuesioner</h1>
          <p className="text-gray-500">Kelola master data pertanyaan ESG Platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReseed}>
            <RefreshCw className="w-4 h-4 mr-2" /> Re-seed Data
          </Button>
          <Button className="bg-[#991B1B] hover:bg-red-800">
            <Plus className="w-4 h-4 mr-2" /> Tambah Pertanyaan
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input 
                placeholder="Cari ID atau pertanyaan..." 
                className="pl-9"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select value={tierFilter} onValueChange={setTierFilter}>
                <SelectTrigger><SelectValue placeholder="Pilih Tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tier</SelectItem>
                  <SelectItem value="1">Tier 1</SelectItem>
                  <SelectItem value="2">Tier 2</SelectItem>
                  <SelectItem value="3">Tier 3</SelectItem>
                  <SelectItem value="4">Tier 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-20">ID</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Pilar</TableHead>
                <TableHead className="w-[40%]">Pertanyaan</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Wajib</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              )}
              
              {!loading && filtered.map((t: any) => (
                <TableRow key={t.docId} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-xs whitespace-nowrap">{t.id}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">T{t.tier}</Badge></TableCell>
                  <TableCell><span className="capitalize text-xs text-gray-600">{t.pillar}</span></TableCell>
                  <TableCell className="text-xs max-w-md truncate" title={t.questionText}>{t.questionText}</TableCell>
                  <TableCell className="text-xs text-gray-500">{t.inputType}</TableCell>
                  <TableCell>
                    {t.isRequired ? <Badge variant="secondary" className="bg-red-50 text-red-700 text-[10px]">WAJIB</Badge> : <Badge variant="outline" className="text-[10px]">OPTIONAL</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Edit className="w-4 h-4 text-gray-500" /></Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(t.docId, t.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">Tidak ada template kuesioner ditemukan.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
