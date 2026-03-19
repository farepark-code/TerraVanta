"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  companyName: z.string().min(3, "Nama Firma minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Konfirmasi password tidak cocok",
  path: ["confirmPassword"],
});

export default function RegisterConsultant() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const res = await fetch("/api/auth/set-claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: user.uid, role: "consultant", isSuperAdmin: false }),
      });
      if (!res.ok) throw new Error("Gagal mengatur hak akses akun");

      await setDoc(doc(db, "consultants", user.uid), {
        email: values.email,
        companyName: values.companyName,
        logoUrl: null,
        brandColor: "#10B981",
        reportCredits: 999999,
        isSuperAdmin: false,
        billingBypass: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const logId = crypto.randomUUID();
      await setDoc(doc(db, "auditLogs", logId), {
        uid: user.uid,
        userRole: "consultant",
        action: "CONSULTANT_REGISTERED",
        resourceType: "consultant",
        resourceId: user.uid,
        before: null,
        after: { companyName: values.companyName, email: values.email },
        isAdminAction: false,
        timestamp: serverTimestamp(),
      });

      await user.getIdToken(true); // force refresh

      toast.success("Registrasi berhasil");
      router.push("/consultant/dashboard");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        form.setError("email", { type: "manual", message: "Email sudah terdaftar" });
      } else if (error.code === "auth/weak-password") {
        form.setError("password", { type: "manual", message: "Password terlalu lemah" });
      } else {
        toast.error(error.message || "Terjadi kesalahan");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Daftar Konsultan ESG</CardTitle>
          <CardDescription>Buat akun untuk memulai pengelolaan klien.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Firma</FormLabel>
                    <FormControl><Input placeholder="Contoh: ESG Advisory Group" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" placeholder="email@firma.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Minimal 8 karakter" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Password</FormLabel>
                    <FormControl><Input type="password" placeholder="Ulangi password" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Daftar"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-gray-600">
            Sudah punya akun? <Link href="/login" className="text-green-600 hover:underline">Masuk</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
