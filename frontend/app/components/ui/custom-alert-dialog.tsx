"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X } from "lucide-react"

interface CustomAlertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
  variant?: "default" | "destructive"
  loading?: boolean
}

export function CustomAlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: CustomAlertDialogProps) {
  const overlayRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  // Handle focus management
  React.useEffect(() => {
    if (open) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Focus the dialog content
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus()
        }
      }, 100)

      // Prevent body scroll
      document.body.style.overflow = "hidden"
    } else {
      // Restore body scroll
      document.body.style.overflow = "unset"

      // Restore focus to the previously focused element
      setTimeout(() => {
        if (previousActiveElement.current) {
          previousActiveElement.current.focus()
        } else {
          // Fallback: focus the body or first focusable element
          const firstFocusable = document.querySelector(
            'button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
          ) as HTMLElement
          if (firstFocusable) {
            firstFocusable.focus()
          } else {
            document.body.focus()
          }
        }
      }, 100)
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [open])

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        handleCancel()
      }
    }

    if (open) {
      document.addEventListener("keydown", handleEscape)
    }

    return () => {
      document.removeEventListener("keydown", handleEscape)
    }
  }, [open])

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  const handleConfirm = () => {
    onConfirm?.()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      handleCancel()
    }
  }

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={handleOverlayClick}
    >
      <Card
        ref={contentRef}
        className="w-full max-w-lg bg-white shadow-lg"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle id="dialog-title" className="text-lg font-semibold">
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleCancel} disabled={loading}>
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p id="dialog-description" className="text-sm text-muted-foreground">
            {description}
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              {cancelText}
            </Button>
            {onConfirm && (
              <Button
                variant={variant === "destructive" ? "destructive" : "default"}
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading && (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {confirmText}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
