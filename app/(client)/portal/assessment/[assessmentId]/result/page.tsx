"use client";

import { use, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Assessment, RatingBand } from "@/types/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

function getRatingDescription(rating: RatingBand | null) {
  if (["AAA", "AA"].includes(rating as string)) return "Sangat Baik 🌟";
  if (["A", "BBB"].includes(rating as string)) return "Baik ✅";
  if (["BB", "B"].includes(rating as string)) return "Perlu Peningkatan ⚠️";
  return "Kritis ❌";
}

export default function AssessmentResult(props: PageProps) {
  const params = use(props.params);
  const [assessment, setAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "assessments", params.assessmentId), (docSnap) => {
      if (docSnap.exists()) {
        setAssessment({ id: docSnap.id, ...docSnap.data() } as Assessment);
      }
    });
    return () => unsub();
  }, [params.assessmentId]);

  if (!assessment) return <div className="flex h-screen items-center justify-center p-8">Memuat data...</div>;

  if (assessment.status === 'submitted') {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-8 bg-gray-50 text-center space-y-6">
        <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
        <h1 className="text-3xl font-bold text-gray-900">⏳ Sistem sedang menghitung skor ESG Anda...</h1>
        <p className="text-gray-500 max-w-md">Mohon tunggu sebentar. Engine skoring ESG Platform sedang mengevaluasi jawaban dan bukti yang Anda lampirkan.</p>
      </div>
    );
  }

  if (assessment.status === 'scored') {
    let finalDate = '...';
    if (assessment.scoredAt) {
      if ('toDate' in assessment.scoredAt) {
        finalDate = (assessment.scoredAt as any).toDate().toLocaleDateString('id-ID');
      } else if (assessment.scoredAt instanceof Date) {
        finalDate = assessment.scoredAt.toLocaleDateString('id-ID');
      }
    }

    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-5xl mx-auto px-8 space-y-8">
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Hasil Assessment ESG: Tier {assessment.tier}</h1>
            <p className="text-lg text-gray-600">Diselesaikan pada {finalDate}</p>
          </div>

          <Card className="bg-gradient-to-br from-green-50 to-white shadow-lg border-green-100 overflow-hidden">
            <CardContent className="p-12 text-center flex flex-col items-center">
              <h3 className="text-sm font-bold tracking-wider text-green-800 uppercase mb-4">Skor Final</h3>
              <div className="flex items-baseline justify-center gap-4">
                <span className={`text-9xl font-black tracking-tighter ${assessment.finalScore && assessment.finalScore >= 60 ? 'text-green-600' : 'text-gray-800'}`}>
                  {assessment.finalScore ?? "-"}
                </span>
                <span className="text-3xl text-gray-400 font-bold">/ 100</span>
              </div>
              <div className="mt-8 space-y-2">
                <Badge className="px-8 py-3 text-2xl font-black bg-green-600 hover:bg-green-700 text-white">
                  Rating: {assessment.ratingBand}
                </Badge>
                <div className="text-lg font-medium text-green-800 mt-2">
                  {getRatingDescription(assessment.ratingBand)}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['environment', 'social', 'governance', 'economic'].map(pillar => {
              const score = assessment.pillarScores?.[pillar as keyof typeof assessment.pillarScores] || 0;
              return (
                <Card key={pillar}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base text-gray-700 capitalize">{pillar}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-bold">{score}</span>
                      <span className="text-sm text-gray-500">/ 100</span>
                    </div>
                    <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500" style={{ width: `${score}%` }} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {assessment.complianceFlags && assessment.complianceFlags.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800"><AlertTriangle className="h-5 w-5"/> Compliance Identifiers</CardTitle>
                <CardDescription className="text-yellow-700">Regulasi atau framework yang membutuhkan perhatian khusus berdasarkan hasil assessment.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assessment.complianceFlags.map((flag: string, idx: number) => (
                    <div key={idx} className="flex items-center p-3 bg-white border border-yellow-100 rounded-md gap-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded">{flag}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center pt-8">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg h-auto">
              <Download className="mr-3 h-5 w-5" /> 
              Unduh Laporan Executive (PDF)
            </Button>
          </div>

        </div>
      </div>
    );
  }

  // Fallback for draft or other states
  return <div className="p-8">Assessment belum selesai.</div>;
}
