"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
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
import { Leaf, ShieldCheck, Globe } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export default function Login() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const idToken = await userCredential.user.getIdToken();
      const tokenResult = await userCredential.user.getIdTokenResult();
      const role = tokenResult.claims.role;

      // SET COOKIE FOR NEXT.JS MIDDLEWARE (SSR routing bypass)
      document.cookie = `session=${idToken}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;

      toast.success("Login berhasil", { description: "Selamat datang kembali." });

      // Beri jeda 500ms agar cookie benar-benar tersimpan sebelum redirect
      setTimeout(() => {
        if (role === "client_user") {
          router.push("/client/portal");
        } else {
          router.push("/admin/dashboard");
        }
      }, 500);
    } catch (error: any) {
      toast.error("Akses Ditolak", { description: "Email atau password salah, atau domain belum diizinkan di Firebase." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full font-sans selection:bg-primary/30 text-emerald-50">
      
      {/* Left Abstract Graphic Side */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        {/* Abstract Glow Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />
        
        {/* Brand */}
        <div className="z-10 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center glow-effect">
            <Leaf className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">TerraVanta</span>
        </div>

        {/* Copywriting */}
        <div className="z-10 max-w-lg mb-20 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight mb-6">
            Masa Depan Keberlanjutan Korporasi
          </h1>
          <p className="text-lg text-emerald-100/70 leading-relaxed mb-8">
            Platform intelijen ESG tingkat Enterprise untuk pelaporan, analisis risiko iklim, dan tata kelola hijau dengan keamanan tingkat tinggi.
          </p>
          <div className="flex space-x-6">
            <div className="flex items-center space-x-2 text-emerald-200">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Enkripsi Militer</span>
            </div>
            <div className="flex items-center space-x-2 text-emerald-200">
              <Globe className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium">Standar Global</span>
            </div>
          </div>
        </div>
        
        <div className="z-10 text-sm text-emerald-400/50 font-medium">
          © 2026 TerraVanta Intelligence
        </div>
      </div>

      {/* Right Login Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 relative z-10 w-full lg:w-1/2">
         {/* Mobile Brand (hidden on lg) */}
         <div className="flex lg:hidden items-center space-x-3 mb-12">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center glow-effect">
            <Leaf className="w-6 h-6 text-black" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white drop-shadow-md">TerraVanta</span>
        </div>

        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-8 duration-700">
          <div className="glass-panel rounded-2xl p-8 sm:p-10 w-full relative overflow-hidden">
            {/* Subtle inner reflection */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Selamat Datang</h2>
              <p className="text-emerald-100/60 text-sm">Masuk untuk mengelola portofolio ESG Anda.</p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-emerald-50">Email Institusi</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="eksekutif@perusahaan.com" 
                          className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 h-12 transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center mb-1">
                        <FormLabel className="text-emerald-50">Kata Sandi</FormLabel>
                        <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                          Lupa sandi?
                        </Link>
                      </div>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="bg-black/40 border-white/10 text-white placeholder:text-white/20 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500 h-12 transition-all"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all glow-effect hover:scale-[1.02]" 
                    disabled={isLoading}
                  >
                    {isLoading ? "Mengamankan Koneksi..." : "Otorisasi Masuk"}
                  </Button>
                </div>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-white/5 text-center">
              <p className="text-sm text-emerald-100/50">
                Belum memiliki akses? <br className="sm:hidden"/>
                <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium ml-1 transition-colors">
                  Hubungi Administrator
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
