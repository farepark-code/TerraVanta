"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, updateDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { Assessment, ClientProfile, QuestionnaireTemplate, AssessmentResponse } from "@/types/firestore";
import { QuestionnaireForm } from "@/components/questionnaire/QuestionnaireForm";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ assessmentId: string }>;
}

export default function ClientPortalAssessment(props: PageProps) {
  const params = use(props.params);
  const router = useRouter();
  const { user } = useAuth();
  
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [unansweredCount, setUnansweredCount] = useState(0);

  useEffect(() => {
    async function fetchMainData() {
      try {
        const aSnap = await getDoc(doc(db, "assessments", params.assessmentId));
        if (aSnap.exists()) {
          const aData = { id: aSnap.id, ...aSnap.data() } as Assessment;
          setAssessment(aData);
          
          const cSnap = await getDoc(doc(db, "clients", aData.clientId));
          if (cSnap.exists()) {
            setClient({ id: cSnap.id, ...cSnap.data() } as ClientProfile);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchMainData();
  }, [params.assessmentId]);

  const handleValidateAndSubmit = async () => {
    if (!assessment || !client || !user) return;
    setSubmitting(true);
    try {
      const qsSnap = await getDocs(collection(db, "questionnaireTemplates"));
      const requiredQs = qsSnap.docs
        .map(d => d.data() as QuestionnaireTemplate)
        .filter(q => q.tier <= assessment.tier && q.isRequired);

      const resSnap = await getDocs(collection(db, `assessments/${assessment.id}/responses`));
      const responses = resSnap.docs.map(d => d.data() as AssessmentResponse);
      const resMap = responses.reduce((acc, curr) => ({ ...acc, [curr.questionId]: curr }), {} as Record<string, AssessmentResponse>);

      let missingCount = 0;
      for (const q of requiredQs) {
        const r = resMap[q.id];
        if (!r) { missingCount++; continue; }
        if (r.isNA) continue;
        if (r.value === null || r.value === "") missingCount++;
        else if (Array.isArray(r.value) && r.value.length === 0) missingCount++;
      }

      if (missingCount > 0) {
        setUnansweredCount(missingCount);
        toast.error(`Ada ${missingCount} pertanyaan wajib yang belum dijawab.`);
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setUnansweredCount(0);
      
      await updateDoc(doc(db, "assessments", assessment.id), {
        status: "submitted",
        submittedAt: serverTimestamp(),
      });
      
      await setDoc(doc(db, "auditLogs", crypto.randomUUID()), {
        uid: user.uid,
        userRole: "client_user",
        action: "ASSESSMENT_SUBMITTED",
        resourceType: "assessment",
        resourceId: assessment.id,
        before: { status: "draft" },
        after: { status: "submitted" },
        isAdminAction: false,
        timestamp: serverTimestamp(),
      });

      toast.success("Kuesioner berhasil dikirim!");
      router.push(`/client/portal/assessment/${assessment.id}/result`);

    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Gagal submit kuesioner.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Memuat data...</div>;
  if (!assessment || !client) return <div className="p-8">Data tidak ditemukan.</div>;

  const isSubmitted = assessment.status === 'submitted' || assessment.status === 'scored';

  return (
    <div className="bg-gray-50 min-h-screen pb-32">
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center font-bold text-green-700">ESG</div>
            <div>
              <h1 className="font-bold text-gray-900">{client.companyName}</h1>
              <p className="text-xs text-gray-500">Portal Klien</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {unansweredCount > 0 && (
              <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-full">
                <AlertCircle className="w-4 h-4 mr-2" />
                {unansweredCount} pertanyaan wajib belum dijawab
              </div>
            )}

            {!isSubmitted && (
              <AlertDialog>
                <AlertDialogTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2" disabled={submitting}>
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? "Mengirim..." : "Kirim Kuesioner"}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Kirim Kuesioner Sekarang?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Setelah dikirim, jawaban tidak dapat diubah lagi. Pastikan semua jawaban dan dokumen bukti pendukung sudah dimasukkan dengan benar.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleValidateAndSubmit} className="bg-blue-600 hover:bg-blue-700">
                      Ya, Kirim Sekarang
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            
            {isSubmitted && (
              <Button disabled variant="outline">
                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                Kuesioner Terkirim
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 mt-8">
        <QuestionnaireForm 
          assessment={assessment} 
          clientName={client.companyName} 
          readOnly={isSubmitted} 
        />
      </div>
    </div>
  );
}
