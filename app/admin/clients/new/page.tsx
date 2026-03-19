"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const industries = [
  "Perbankan & Keuangan", "Manufaktur", "Properti & Konstruksi", 
  "Pertambangan", "Teknologi & Digital", "Agrikultur", 
  "Energi & Utilitas", "Kesehatan", "Pendidikan", "Ritel", "Lainnya"
] as const;

const formSchema = z.object({
  companyName: z.string().min(1, "Nama Perusahaan wajib diisi"),
  industry: z.string().min(1, "Pilih industri"),
  companySize: z.string().min(1, "Pilih ukuran perusahaan"),
  tier: z.string().min(1, "Pilih tier ESG"),
  picName: z.string().min(1, "Nama PIC wajib diisi"),
  picEmail: z.string().email("Format email PIC tidak valid"),
});

export default function NewClient() {
  const router = useRouter();
  const { user, consultantId, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      picName: "",
      picEmail: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (authLoading || !user) return;
    setIsLoading(true);
    
    try {
      const activeConsultantId = consultantId || user.uid;

      const clientRef = doc(collection(db, "clients"));
      const clientId = clientRef.id;

      await setDoc(clientRef, {
        consultantId: activeConsultantId,
        companyName: values.companyName,
        industry: values.industry,
        companySize: values.companySize,
        tier: parseInt(values.tier, 10),
        picEmail: values.picEmail,
        picName: values.picName,
        latestScore: null,
        latestRating: null,
        latestPillarScores: null,
        complianceFlags: [],
        status: "invited",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const assessmentRef = doc(collection(db, "assessments"));
      await setDoc(assessmentRef, {
        clientId: clientId,
        consultantId: activeConsultantId,
        tier: parseInt(values.tier, 10),
        status: "draft",
        finalScore: null,
        ratingBand: null,
        pillarScores: null,
        complianceFlags: [],
        submittedAt: null,
        scoredAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const logRef = doc(collection(db, "auditLogs"));
      await setDoc(logRef, {
        uid: user.uid,
        userRole: "consultant",
        action: "CLIENT_CREATED",
        resourceType: "client",
        resourceId: clientId,
        before: null,
        after: { companyName: values.companyName, picEmail: values.picEmail, tier: values.tier },
        isAdminAction: false,
        timestamp: serverTimestamp(),
      });

      toast.success(`Klien berhasil ditambahkan. Undangan telah dikirim ke ${values.picEmail}`);
      router.push(`/consultant/clients/${clientId}`);

    } catch (error: any) {
      console.error(error);
      toast.error("Gagal menambahkan klien: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/consultant/dashboard">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Klien Baru</h1>
          <p className="text-gray-500 text-sm">Masukan detail pendaftaran klien ESG</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Kolom Kiri - Profil Perusahaan */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium border-b pb-2">Profil Perusahaan</h3>
                  
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Perusahaan</FormLabel>
                        <FormControl><Input placeholder="PT ABCD Indonesia" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industri</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih sektor industri" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {industries.map(ind => (
                              <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Ukuran Perusahaan</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="startup" /></FormControl>
                              <FormLabel className="font-normal">Startup (&lt;50 karyawan)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="sme" /></FormControl>
                              <FormLabel className="font-normal">UKM (50-250 karyawan)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl><RadioGroupItem value="enterprise" /></FormControl>
                              <FormLabel className="font-normal">Enterprise (&gt;250 karyawan)</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Kolom Kanan - Assessment & PIC */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium border-b pb-2">Assessment & Kontak</h3>

                  <FormField
                    control={form.control}
                    name="tier"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tier ESG Assessment</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <FormItem className="flex items-start space-x-3 space-y-0 bg-gray-50 p-3 rounded-md border">
                              <FormControl className="mt-1"><RadioGroupItem value="1" /></FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-medium cursor-pointer">Tier 1: Dasar</FormLabel>
                                <p className="text-xs text-gray-500">20 pertanyaan fundamental</p>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0 bg-gray-50 p-3 rounded-md border">
                              <FormControl className="mt-1"><RadioGroupItem value="2" /></FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-medium cursor-pointer">Tier 2: Menengah</FormLabel>
                                <p className="text-xs text-gray-500">+15 pertanyaan tambahan</p>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0 bg-gray-50 p-3 rounded-md border">
                              <FormControl className="mt-1"><RadioGroupItem value="3" /></FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-medium cursor-pointer">Tier 3: Lanjutan</FormLabel>
                                <p className="text-xs text-gray-500">+20 pertanyaan mendalam</p>
                              </div>
                            </FormItem>
                            <FormItem className="flex items-start space-x-3 space-y-0 bg-gray-50 p-3 rounded-md border">
                              <FormControl className="mt-1"><RadioGroupItem value="4" /></FormControl>
                              <div className="space-y-1">
                                <FormLabel className="font-medium cursor-pointer">Tier 4: Komprehensif</FormLabel>
                                <p className="text-xs text-gray-500">Seluruh 70+ pertanyaan ESG penuh</p>
                              </div>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="picName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap PIC</FormLabel>
                          <FormControl><Input placeholder="Budi Santoso" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="picEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email PIC Akses Portal</FormLabel>
                          <FormControl><Input type="email" placeholder="budi@abcd.com" {...field} /></FormControl>
                          <FormDescription>Undangan akses portal ESG akan dikirim ke email ini.</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()} disabled={isLoading}>
                  Batal
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  {isLoading ? "Menyimpan..." : "Simpan & Undang Klien"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
