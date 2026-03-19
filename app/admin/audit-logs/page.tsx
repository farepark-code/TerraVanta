"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { AuditLog } from "@/types/firestore";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Download, ChevronDown, ChevronRight } from "lucide-react";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100)));
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog & { id: string })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    // Generate simple CSV
    let csv = "ID,Timestamp,ActorUID,Role,Action,ResourceType,ResourceID\n";
    logs.forEach(l => {
      const dt = l.timestamp && 'toDate' in (l.timestamp as any) ? (l.timestamp as any).toDate().toISOString() : '';
      csv += `${l.id},${dt},${l.uid},${l.userRole},${l.action},${l.resourceType},${l.resourceId}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_log_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Audit Log Platform</h1>
          <p className="text-emerald-100/60">Log aktivitas immutable (Read-Only).</p>
        </div>
        <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (Top 100)
        </Button>
      </div>

      <Card className="glass-panel animate-in fade-in slide-in-from-bottom-8 duration-700">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-white/5 border-b border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="w-10"></TableHead>
                <TableHead className="text-emerald-100/50">Timestamp</TableHead>
                <TableHead className="text-emerald-100/50">Actor</TableHead>
                <TableHead className="text-emerald-100/50">Role</TableHead>
                <TableHead className="text-emerald-100/50">Aksi</TableHead>
                <TableHead className="text-emerald-100/50">Target</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12 text-emerald-100/50">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                  </TableCell>
                </TableRow>
              )}
              
              {!loading && logs.map((l: any) => {
                const dt = l.timestamp && 'toDate' in l.timestamp ? l.timestamp.toDate().toLocaleString('id-ID') : '...';
                const isExpanded = expandedRow === l.id;
                
                return (
                  <React.Fragment key={l.id}>
                    <TableRow className="border-white/5 hover:bg-white/5 cursor-pointer transition-colors" onClick={() => setExpandedRow(isExpanded ? null : l.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-400" /> : <ChevronRight className="w-4 h-4 text-emerald-100/40" />}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-emerald-100/60">{dt}</TableCell>
                      <TableCell className="text-xs font-medium text-emerald-50" title={l.uid}>{l.uid.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${l.isAdminAction ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                          {l.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-white tracking-wide">{l.action}</TableCell>
                      <TableCell>
                        <span className="text-xs bg-black/40 border border-white/10 px-2 py-1 rounded inline-block mt-2 font-mono text-emerald-100/70" title={l.resourceId}>
                          {l.resourceType}
                        </span>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-black/20 border-white/5 hover:bg-black/20">
                        <TableCell colSpan={6} className="p-4 border-b border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-black/40 border border-white/10 rounded shadow-inner overflow-x-auto text-xs font-mono text-emerald-100/70">
                              <p className="font-bold text-red-400 mb-2 border-b border-white/10 pb-1">BEFORE</p>
                              <pre>{JSON.stringify(l.before || {}, null, 2)}</pre>
                            </div>
                            <div className="p-3 bg-black/40 border border-white/10 rounded shadow-inner overflow-x-auto text-xs font-mono text-emerald-100/70">
                              <p className="font-bold text-emerald-400 mb-2 border-b border-white/10 pb-1">AFTER</p>
                              <pre>{JSON.stringify(l.after || {}, null, 2)}</pre>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// Dummy React import for React.Fragment
import React from 'react';
