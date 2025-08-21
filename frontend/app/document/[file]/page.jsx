"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

export default function DocumentViewerPage() {
  const router = useRouter();
  const { file } = useParams(); // e.g. "uploads%2Ffoo.pdf"
  const [pdfUrl, setPdfUrl] = useState("");



useEffect(() => {
  if (!file) { toast.error("Aucun document spécifié"); router.back(); return; }

  let decoded = decodeURIComponent(file);
  decoded = decoded.replace(/^\/+/, '').replace(/^[A-Za-z]:[\\/]+/, '').replace(/\\/g, '/');

  // get only filename
  const filename = decoded.split('/').pop();
  if (!filename) { toast.error("Nom de fichier invalide"); router.back(); return; }

  const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000').replace(/\/+$/, '');
  setPdfUrl(`${base}/uploads/${encodeURIComponent(filename)}`);
}, [file, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col min-w-screen">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Visualiseur PDF</h1>
        <div className="w-24" />
      </header>

      <main className="flex-1 container mx-auto">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="w-full h-[calc(100vh-6rem)] border"
            title="Document PDF"
          />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            Chargement du document...
          </div>
        )}
      </main>

      <Toaster position="bottom-left" />
    </div>
  );
}
