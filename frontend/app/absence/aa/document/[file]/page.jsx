"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";

// Import the worker as a URL using the legacy path for your version.
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

// Configure PDF.js worker using the imported URL.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function DocumentViewerPage() {
  const router = useRouter();
  const { file } = useParams(); // dynamic route parameter (encoded file path)
  const [pdfUrl, setPdfUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  useEffect(() => {
    if (file) {
      // Decode the file parameter (e.g., "uploads%2Ffile.pdf" becomes "uploads/file.pdf")
      const decodedPath = decodeURIComponent(file);
      // Build the absolute URL based on your backend.
      setPdfUrl(`${process.env.NEXT_PUBLIC_BACKEND_URL}/${decodedPath}`);
    } else {
      toast.error("Aucun document spécifié");
      router.push("/");
    }
  }, [file, router]);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const goToPreviousPage = () =>
    setPageNumber((prev) => (prev <= 1 ? prev : prev - 1));
  const goToNextPage = () =>
    setPageNumber((prev) => (prev >= numPages ? prev : prev + 1));

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500">Chargement du document...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-6 py-8 flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          Visualiseur de Document PDF
        </h1>
        <div className="w-24"></div>
      </div>

      <div className="container mx-auto px-6 flex-1">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="flex justify-center"
          >
            <Page pageNumber={pageNumber} className="mx-auto" />
          </Document>
        </div>
      </div>

      {numPages && (
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <p className="text-gray-700">
            Page {pageNumber} sur {numPages}
          </p>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              disabled={pageNumber <= 1}
              onClick={goToPreviousPage}
              className="flex items-center"
            >
              <ChevronLeft className="h-5 w-5" />
              Précédent
            </Button>
            <Button
              variant="outline"
              disabled={pageNumber >= numPages}
              onClick={goToNextPage}
              className="flex items-center"
            >
              Suivant
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      )}

      <Toaster position="bottom-left" />
    </div>
  );
}
