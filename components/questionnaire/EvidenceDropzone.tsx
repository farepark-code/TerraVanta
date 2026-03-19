"use client";

import { useState } from "react";
import { storage } from "@/lib/firebase/client";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, UploadCloud, File, AlertCircle } from "lucide-react";

interface EvidenceDropzoneProps {
  clientId: string;
  assessmentId: string;
  questionId: string;
  existingUrl: string | null;
  existingFileName: string | null;
  onUploadSuccess: (url: string, fileName: string) => void;
  onDelete: () => void;
}

const MAX_SIZE_MB = 15;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg"
];

export function EvidenceDropzone({
  clientId, assessmentId, questionId,
  existingUrl, existingFileName, onUploadSuccess, onDelete
}: EvidenceDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (file.size > MAX_SIZE_BYTES) {
      setError(`File terlalu besar. Maksimal ${MAX_SIZE_MB}MB.`);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Tipe file tidak didukung. Gunakan PDF, XLSX, PNG, atau JPG.");
      return;
    }

    setUploading(true);
    setProgress(0);

    const timestamp = new Date().getTime();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const path = `evidence/${clientId}/${assessmentId}/${questionId}/${timestamp}_${sanitizedFilename}`;
    const storageRef = ref(storage, path);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (err) => {
        console.error(err);
        setError("Upload gagal. Silakan coba lagi.");
        setUploading(false);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        setUploading(false);
        onUploadSuccess(downloadUrl, sanitizedFilename);
      }
    );
  };

  const handleDelete = () => {
    onDelete();
  };

  if (existingUrl) {
    return (
      <div className="flex items-center justify-between p-3 border rounded-md bg-green-50">
        <div className="flex items-center gap-3 overflow-hidden">
          <File className="h-5 w-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700 truncate">{existingFileName}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <a href={existingUrl} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm" type="button">Lihat</Button>
          </a>
          <Button variant="destructive" size="sm" type="button" onClick={handleDelete}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!uploading ? (
        <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-md hover:bg-gray-50 transition-colors border-gray-300">
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileDrop}
          />
          <UploadCloud className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-700">Pilih file untuk diunggah</p>
          <p className="text-xs text-gray-500 mt-1">PDF, XLSX, PNG, JPG (Maks. 15MB)</p>
        </div>
      ) : (
        <div className="p-4 border rounded-md bg-gray-50 space-y-3">
          <div className="flex justify-between text-sm text-gray-700">
            <span>Mengunggah file...</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
      
      {error && (
        <div className="flex items-center text-sm text-red-600 mt-2">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
}
