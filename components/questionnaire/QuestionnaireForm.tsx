"use client";

import { useEffect, useState } from "react";
import { 
  collection, query, where, getDocs, doc, 
  onSnapshot, serverTimestamp, writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Assessment, QuestionnaireTemplate, AssessmentResponse, ESGPillar } from "@/types/firestore";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { EvidenceDropzone } from "./EvidenceDropzone";
import { AlertCircle, CheckCircle2, Loader2, Check } from "lucide-react";
import { useDebounce } from "use-debounce";

interface QuestionnaireFormProps {
  assessment: Assessment;
  clientName: string;
  readOnly?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function QuestionnaireForm({ assessment, clientName, readOnly = false }: QuestionnaireFormProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionnaireTemplate[]>([]);
  const [responses, setResponses] = useState<Record<string, AssessmentResponse>>({});
  const [loading, setLoading] = useState(true);
  
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [debouncedLocalValues] = useDebounce(localValues, 1500);
  
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const q = query(
          collection(db, "questionnaireTemplates"),
          where("tier", "<=", assessment.tier)
        );
        const snapshot = await getDocs(q);
        const qsData = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as QuestionnaireTemplate));
        
        qsData.sort((a, b) => {
          const matchA = a.id.match(/^([a-zA-Z]+)(\d+)\.(\d+)$/);
          const matchB = b.id.match(/^([a-zA-Z]+)(\d+)\.(\d+)$/);
          if (!matchA || !matchB) return a.id.localeCompare(b.id);
          
          if (matchA[1] !== matchB[1]) return matchA[1].localeCompare(matchB[1]);
          if (parseInt(matchA[2], 10) !== parseInt(matchB[2], 10)) return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
          return parseInt(matchA[3], 10) - parseInt(matchB[3], 10);
        });
        
        setQuestions(qsData);
      } catch (err) {
        console.error(err);
      }
    }
    fetchQuestions();
  }, [assessment.tier]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, `assessments/${assessment.id}/responses`),
      (snapshot) => {
        const resData: Record<string, AssessmentResponse> = {};
        const lValues: Record<string, any> = {};
        
        snapshot.forEach(docSnap => {
          const data = docSnap.data() as AssessmentResponse;
          resData[data.questionId] = data;
          lValues[data.questionId] = {
            value: data.value,
            isNA: data.isNA,
            evidenceUrl: data.evidenceUrl,
            evidenceFileName: data.evidenceFileName
          };
        });
        
        setResponses(resData);
        setLocalValues(prev => {
           // Provide basic non-destructive local merge
           return { ...lValues, ...prev };
        });
        setLoading(false);
      }
    );
    return () => unsub();
  }, [assessment.id]);

  useEffect(() => {
    if (Object.keys(debouncedLocalValues).length === 0 || readOnly || !user) return;
    
    let isMounted = true;
    const saveChanges = async () => {
      setSaveState("saving");
      try {
        const batch = writeBatch(db);
        let hasChanges = false;
        
        for (const qId of Object.keys(debouncedLocalValues)) {
          const local = debouncedLocalValues[qId];
          const remote = responses[qId];
          
          if (
            !remote || 
            JSON.stringify(local.value) !== JSON.stringify(remote.value) || 
            local.isNA !== remote.isNA ||
            local.evidenceUrl !== remote.evidenceUrl
          ) {
            hasChanges = true;
            const ref = doc(db, `assessments/${assessment.id}/responses`, qId);
            batch.set(ref, {
              questionId: qId,
              value: local.value !== undefined ? local.value : null,
              isNA: local.isNA || false,
              evidenceUrl: local.evidenceUrl || null,
              evidenceFileName: local.evidenceFileName || null,
              answeredAt: serverTimestamp(),
              answeredBy: user.uid
            }, { merge: true });
          }
        }
        
        if (hasChanges && isMounted) {
          await batch.commit();
          setLastSaved(new Date());
          setSaveState("saved");
          setTimeout(() => { if (isMounted) setSaveState("idle"); }, 3000);
        } else if (isMounted) {
          setSaveState("idle");
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setSaveState("error");
      }
    };
    
    saveChanges();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedLocalValues, assessment.id, readOnly, user]);

  const handleChange = (qId: string, field: "value" | "isNA" | "evidenceUrl" | "evidenceFileName", val: any) => {
    if (readOnly) return;
    setLocalValues(prev => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { value: null, isNA: false, evidenceUrl: null, evidenceFileName: null }),
        [field]: val
      }
    }));
  };

  if (loading || questions.length === 0) return <div className="p-8 text-center text-gray-500">Memuat kuesioner...</div>;

  const pillars: ESGPillar[] = ['environment', 'social', 'governance', 'economic'];
  const questionsByPillar = pillars.reduce((acc, pillar) => {
    acc[pillar] = questions.filter(q => q.pillar === pillar);
    return acc;
  }, {} as Record<ESGPillar, QuestionnaireTemplate[]>);

  const requiredQuestions = questions.filter(q => q.isRequired).length;
  const answeredRequired = questions.filter(q => {
    const loc = localValues[q.id];
    if (!q.isRequired) return false;
    if (!loc) return false;
    if (loc.isNA) return true;
    if (loc.value !== null && loc.value !== "" && (Array.isArray(loc.value) ? loc.value.length > 0 : true)) return true;
    return false;
  }).length;
  const progressPercent = requiredQuestions === 0 ? 0 : Math.round((answeredRequired / requiredQuestions) * 100);

  return (
    <div className="space-y-6 relative pb-24">
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">{clientName} — Tier {assessment.tier} Assessment</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex-1 max-w-md h-2 bg-gray-100 rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full bg-green-600 transition-all" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-sm font-medium text-gray-700">{progressPercent}% Selesai</span>
        </div>
      </div>

      <Tabs defaultValue="environment" className="w-full">
        <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-white/90 backdrop-blur-md">
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="economic">Economic</TabsTrigger>
        </TabsList>

        {pillars.map(pillar => (
          <TabsContent key={pillar} value={pillar} className="space-y-6 mt-6">
            {questionsByPillar[pillar].map(q => {
              const loc = localValues[q.id] || { value: null, isNA: false, evidenceUrl: null, evidenceFileName: null };
              const isDisabled = readOnly || loc.isNA;

              return (
                <Card key={q.id} className={loc.isNA ? "opacity-60 bg-gray-50" : ""}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs bg-gray-100">{q.id}</Badge>
                          {q.isRequired && <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 hover:bg-red-50 border-red-100">Wajib</Badge>}
                          {!loc.isNA && loc.value && (
                             <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-base font-medium text-gray-900">{q.questionText}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Label htmlFor={`na-${q.id}`} className="text-sm text-gray-500 cursor-pointer">Tidak Relevan (N/A)</Label>
                        <Switch 
                          id={`na-${q.id}`} 
                          checked={loc.isNA} 
                          onCheckedChange={(checked: boolean) => {
                            handleChange(q.id, "isNA", checked);
                            if (checked) handleChange(q.id, "value", null);
                          }} 
                          disabled={readOnly}
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      {q.inputType === 'single_choice' && q.options && (
                        <RadioGroup 
                          disabled={isDisabled}
                          value={loc.value as string || ""}
                          onValueChange={(val: any) => handleChange(q.id, "value", val)}
                          className="space-y-2"
                        >
                          {q.options.map((opt: string, idx: number) => (
                            <div key={idx} className="flex items-center space-x-3 bg-gray-50 border p-3 rounded-md">
                              <RadioGroupItem value={opt} id={`${q.id}-opt-${idx}`} />
                              <Label htmlFor={`${q.id}-opt-${idx}`} className="font-normal cursor-pointer flex-1">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}

                      {q.inputType === 'multi_choice' && q.options && (
                        <div className="space-y-2">
                          {q.options.map((opt: string, idx: number) => {
                            const isChecked = Array.isArray(loc.value) && loc.value.includes(opt);
                            return (
                              <div key={idx} className="flex items-center space-x-3 bg-gray-50 border p-3 rounded-md">
                                <Checkbox 
                                  id={`${q.id}-chk-${idx}`} 
                                  disabled={isDisabled}
                                  checked={isChecked}
                                  onCheckedChange={(checked: boolean) => {
                                    let currentArr = Array.isArray(loc.value) ? [...loc.value] : [];
                                    if (checked) currentArr.push(opt);
                                    else currentArr = currentArr.filter((v: any) => v !== opt);
                                    handleChange(q.id, "value", currentArr);
                                  }}
                                />
                                <Label htmlFor={`${q.id}-chk-${idx}`} className="font-normal cursor-pointer flex-1">{opt}</Label>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.inputType === 'numeric' && (
                        <div className="max-w-sm">
                          <Input 
                            type="number" 
                            disabled={isDisabled}
                            value={loc.value || ""}
                            onChange={(e: any) => handleChange(q.id, "value", e.target.value)}
                            placeholder="Masukkan angka..."
                          />
                        </div>
                      )}

                      {q.inputType === 'text' && (
                        <Textarea 
                          disabled={isDisabled}
                          value={loc.value || ""}
                          onChange={(e: any) => handleChange(q.id, "value", e.target.value)}
                          placeholder="Masukkan jawaban..."
                          className="min-h-[100px]"
                        />
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-dashed">
                      <Label className="text-sm font-medium mb-3 block">Dokumen Pendukung (Evidence)</Label>
                      {!isDisabled && !readOnly && (
                        <EvidenceDropzone 
                          clientId={assessment.clientId}
                          assessmentId={assessment.id}
                          questionId={q.id}
                          existingUrl={loc.evidenceUrl}
                          existingFileName={loc.evidenceFileName}
                          onUploadSuccess={(url, name) => {
                            handleChange(q.id, "evidenceUrl", url);
                            handleChange(q.id, "evidenceFileName", name);
                          }}
                          onDelete={() => {
                            handleChange(q.id, "evidenceUrl", null);
                            handleChange(q.id, "evidenceFileName", null);
                          }}
                        />
                      )}
                      {(isDisabled || readOnly) && loc.evidenceUrl && (
                        <div className="text-sm">
                          <a href={loc.evidenceUrl} target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
                            Lihat Dokumen: {loc.evidenceFileName}
                          </a>
                        </div>
                      )}
                      {(isDisabled || readOnly) && !loc.evidenceUrl && (
                        <p className="text-sm text-gray-400">Tidak ada dokumen.</p>
                      )}
                    </div>

                  </CardContent>
                </Card>
              );
            })}
            
            {questionsByPillar[pillar].length === 0 && (
              <div className="p-12 text-center text-gray-500 bg-white border rounded border-dashed">
                Tidak ada pertanyaan untuk aspek ini di Tier {assessment.tier}.
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              {saveState === 'idle' && <CheckCircle2 className="h-5 w-5 text-gray-400" />}
              {saveState === 'saving' && <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />}
              {saveState === 'saved' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {saveState === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              
              <span className="text-sm font-medium text-gray-700">
                {saveState === 'idle' && "Tidak ada modifikasi (Idle)"}
                {saveState === 'saving' && "Menyimpan secara otomatis..."}
                {saveState === 'saved' && `Tersimpan (terakhir: ${lastSaved?.toLocaleTimeString()})`}
                {saveState === 'error' && "Gagal menyimpan perubahan."}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Perubahan disimpan otomatis. Tidak perlu klik tombol Simpan.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
