"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import toast, { Toaster } from "react-hot-toast"

export default function DocumentViewerPage() {
  const router = useRouter()
  const { file } = useParams()
  const [pdfUrl, setPdfUrl] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [documentInfo, setDocumentInfo] = useState({
    filename: "",
    size: "",
    type: "PDF",
    lastModified: "",
  })

  useEffect(() => {
    if (!file) {
      toast.error("Aucun document spécifié")
      router.back()
      return
    }

    try {
      let decoded = decodeURIComponent(file)
      decoded = decoded
        .replace(/^\/+/, "")
        .replace(/^[A-Za-z]:[\\/]+/, "")
        .replace(/\\/g, "/")

      const filename = decoded.split("/").pop()
      if (!filename) {
        toast.error("Nom de fichier invalide")
        router.back()
        return
      }

      const base = (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000").replace(/\/+$/, "")
      const url = `${base}/uploads/${encodeURIComponent(filename)}`

      setPdfUrl(url)
      setDocumentInfo((prev) => ({
        ...prev,
        filename: filename,
        lastModified: new Date().toLocaleDateString("fr-FR"),
      }))

      setLoading(false)
    } catch (err) {
      console.error("Error processing document:", err)
      setError("Erreur lors du traitement du document")
      setLoading(false)
    }
  }, [file, router])

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement("a")
      link.href = pdfUrl
      link.download = documentInfo.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("Téléchargement démarré")
    }
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="flex space-x-2 justify-center">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Retour
                </Button>
                <Button onClick={handleRefresh}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réessayer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{documentInfo.filename}</h1>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {documentInfo.type}
                    </Badge>
                    <span>•</span>
                    <span>Modifié le {documentInfo.lastModified}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={handleDownload} className="flex items-center bg-transparent">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(pdfUrl, "_blank")}
                className="flex items-center"
              >
                <Maximize2 className="mr-2 h-4 w-4" />
                Plein écran
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Document Viewer */}
      <main className="flex-1 container mx-auto px-6 py-6">
        <Card className="h-full shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Visualiseur de Document</span>
              </CardTitle>

              {/* Viewer Controls */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" title="Zoom avant">
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Zoom arrière">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" title="Rotation">
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-4" />
                <Button variant="ghost" size="sm" onClick={handleRefresh} title="Actualiser">
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="relative bg-gray-100 rounded-b-lg overflow-hidden">
              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  className="w-full h-[calc(100vh-12rem)] border-0"
                  title="Document PDF"
                  style={{ minHeight: "600px" }}
                />
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Aucun document à afficher</p>
                    <p className="text-sm">Le document demandé n'a pas pu être chargé</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Visualiseur PDF intégré</span>
              <Separator orientation="vertical" className="h-4" />
              <span>Prise en charge des formats PDF</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>Powered by</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                NAFTAL
              </Badge>
            </div>
          </div>
        </div>
      </footer>

      <Toaster position="bottom-left" />
    </div>
  )
}
