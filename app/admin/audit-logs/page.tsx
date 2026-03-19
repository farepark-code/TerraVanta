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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log Platform</h1>
          <p className="text-gray-500">Log aktivitas immutable (Read-Only).</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" /> Export CSV (Top 100)
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Target</TableHead>
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
              
              {!loading && logs.map((l: any) => {
                const dt = l.timestamp && 'toDate' in l.timestamp ? l.timestamp.toDate().toLocaleString('id-ID') : '...';
                const isExpanded = expandedRow === l.id;
                
                return (
                  <React.Fragment key={l.id}>
                    <TableRow className="hover:bg-gray-50/50 cursor-pointer" onClick={() => setExpandedRow(isExpanded ? null : l.id)}>
                      <TableCell>
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-gray-500">{dt}</TableCell>
                      <TableCell className="text-xs font-medium" title={l.uid}>{l.uid.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${l.isAdminAction ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                          {l.userRole}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-gray-700">{l.action}</TableCell>
                      <TableCell className="text-xs bg-gray-50 px-2 py-1 rounded inline-block mt-2 font-mono" title={l.resourceId}>
                        {l.resourceType}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-gray-50/30">
                        <TableCell colSpan={6} className="p-4 border-b">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white border rounded shadow-sm overflow-x-auto text-xs font-mono text-gray-700">
                              <p className="font-bold text-red-600 mb-2 border-b pb-1">BEFORE</p>
                              <pre>{JSON.stringify(l.before || {}, null, 2)}</pre>
                            </div>
                            <div className="p-3 bg-white border rounded shadow-sm overflow-x-auto text-xs font-mono text-gray-700">
                              <p className="font-bold text-green-600 mb-2 border-b pb-1">AFTER</p>
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
