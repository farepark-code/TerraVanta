"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { ConsultantProfile } from "@/types/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { UploadCloud, FileImage, Loader2 } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ConsultantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [companyName, setCompanyName] = useState("");
  const [brandColor, setBrandColor] = useState("#10B981");
  const [tagline, setTagline] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const snap = await getDoc(doc(db, "consultants", user.uid));
      if (snap.exists()) {
        const data = snap.data() as ConsultantProfile;
        setProfile(data);
        setCompanyName(data.companyName);
        if (data.brandColor) setBrandColor(data.brandColor);
        if (data.tagline) setTagline(data.tagline);
        if (data.logoUrl) setLogoPreview(data.logoUrl);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 2MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!user) return;
    if (companyName.trim().length < 3) {
      toast.error("Nama firma minimal 3 karakter.");
      return;
    }
    
    setSaving(true);
    try {
      let finalLogoUrl = profile?.logoUrl || null;
      
      if (logoFile) {
        const ext = logoFile.name.split('.').pop();
        const path = `consultants/${user.uid}/logo/logo_${Date.now()}.${ext}`;
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytesResumable(storageRef, logoFile);
        finalLogoUrl = await getDownloadURL(snapshot.ref);
      }

      await updateDoc(doc(db, "consultants", user.uid), {
        companyName,
        brandColor,
        tagline: tagline || null,
        logoUrl: finalLogoUrl,
        updatedAt: new Date()
      });

      toast.success("Pengaturan berhasil disimpan. Laporan berikutnya akan menggunakan tampilan baru ini.");
    } catch (e: any) {
      console.error(e);
      toast.error("Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Memuat profil...</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Profil & Whitelabel</h1>
        <p className="text-gray-500">Sesuaikan tampilan platform dan laporan PDF/DOCX untuk klien kamu.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Firma</CardTitle>
          <CardDescription>Informasi dasar terkait firma konsultan kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Email Utama (Read-only)</Label>
            <Input value={profile?.email || ""} disabled className="bg-gray-50" />
          </div>
          <div className="grid gap-2">
            <Label>Nama Firma</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whitelabel Settings</CardTitle>
          <CardDescription>Ubah logo dan warna agar laporan mencerminkan identitas brand firma kamu.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="grid gap-2">
            <Label>Logo Firma</Label>
            <div className="flex items-center gap-6">
              {logoPreview ? (
                <div className="w-24 h-24 rounded-md border flex items-center justify-center p-2 bg-gray-50 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-md border-2 border-dashed flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                  <FileImage className="w-8 h-8 opacity-50 mb-1" />
                  <span className="text-[10px] uppercase font-bold">No Logo</span>
                </div>
              )}
              
              <div className="flex-1">
                <Input type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleLogoChange} />
                <p className="text-xs text-gray-500 mt-2">Maksimal 2MB. Format: PNG, JPG, SVG. Disarankan ratio 1:1 atau 2:1 (landscape).</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Brand Color (Warna Utama)</Label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={brandColor} 
                onChange={e => setBrandColor(e.target.value)}
                className="w-12 h-12 rounded cursor-pointer border-0 p-0"
              />
              <Input 
                value={brandColor} 
                onChange={e => setBrandColor(e.target.value)} 
                className="w-32 uppercase" 
                maxLength={7}
              />
            </div>
            <p className="text-xs text-gray-500">Warna ini akan digunakan sebagai warna aksen pada laporan ESG (header, tabel, dll).</p>
          </div>

          <div className="grid gap-2">
            <Label>Tagline / Slogan (Opsional)</Label>
            <Input value={tagline} onChange={e => setTagline(e.target.value)} maxLength={100} placeholder="Leading the future of sustainability..." />
          </div>

          {/* Mini Preview */}
          <div className="mt-8 p-6 rounded-lg border-2" style={{ borderColor: brandColor }}>
            <div className="text-xs text-gray-500 mb-4 uppercase font-bold tracking-wider">Preview Warna & Logo Pada Laporan</div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-black mb-1" style={{ color: brandColor }}>LAPORAN ASSESSMENT ESG</h3>
                <p className="text-gray-600 font-medium">PT. Klien Simulasi Indonesia</p>
              </div>
              {logoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="w-16 h-16 object-contain" />
              )}
              {!logoPreview && (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-100 text-gray-400 text-xs text-center border">
                  Logo<br/>Firma
                </div>
              )}
            </div>
          </div>

        </CardContent>
      </Card>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving} className="w-32">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Simpan Profil"}
        </Button>
      </div>

    </div>
  );
}
