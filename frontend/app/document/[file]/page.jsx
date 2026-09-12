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
import toast from "react-hot-toast";
import { Toaster } from "@/components/ui/toaster"
import { DetailSkeleton, PageError } from "@/components/ui/detail-layout"

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
    return <DetailSkeleton />
  }

  if (error) {
    return (
      <PageError
        title="Erreur de chargement"
        message={error}
        onRetry={handleRefresh}
      />
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="Retour" title="Retour">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span
            aria-hidden
            className="flex h-10 w-[34px] shrink-0 items-center justify-center rounded-[5px] border border-destructive-border bg-destructive-subtle text-[10px] font-bold text-destructive-text"
          >
            PDF
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">{documentInfo.filename}</h1>
            <p className="text-xs tabular-nums text-muted-foreground">
              Document {documentInfo.type} · ouvert le {documentInfo.lastModified}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} aria-label="Actualiser" title="Actualiser">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => window.open(pdfUrl, "_blank")} disabled={!pdfUrl}>
            <Maximize2 className="h-4 w-4" />
            Plein écran
          </Button>
          <Button onClick={handleDownload} disabled={!pdfUrl}>
            <Download className="h-4 w-4" />
            Télécharger
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-muted shadow-xs">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            title={`Document ${documentInfo.filename}`}
            className="h-[calc(100vh-13rem)] min-h-[560px] w-full border-0 bg-card"
          />
        ) : (
          <div className="flex h-96 flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-secondary">
              <FileText className="h-5 w-5 text-ink-700" />
            </span>
            <p className="text-[15px] font-semibold text-foreground">Aucun document à afficher</p>
            <p className="text-[13.5px] text-muted-foreground">Le document demandé n'a pas pu être chargé.</p>
          </div>
        )}
      </div>

      <Toaster position="bottom-left" />
    </div>
  )
}
