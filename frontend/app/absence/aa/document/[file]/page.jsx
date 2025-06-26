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
    if (!file) {
      toast.error("Aucun document spécifié");
      router.back();
      return;
    }
    // Decode "uploads%2Ffoo.pdf" → "uploads/foo.pdf"
    const decoded = decodeURIComponent(file);
    console.log("decoded:", decoded);
    setPdfUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${decoded}`);
  }, [file, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>
        <h1 className="text-xl font-bold">Visualiseur PDF</h1>
        <div className="w-24" />
      </header>

      <main className="flex-1 container mx-auto px-6">
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
