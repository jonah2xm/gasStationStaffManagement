"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Trash2, X } from "lucide-react"

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

  const isDestructive = variant === "destructive"

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4 animate-in fade-in-0"
      onClick={handleOverlayClick}
    >
      <div
        ref={contentRef}
        className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-card-foreground shadow-lg outline-none animate-in fade-in-0 zoom-in-95"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div className="flex gap-3">
          {isDestructive && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive-subtle" aria-hidden>
              <Trash2 className="h-[18px] w-[18px] text-destructive" />
            </span>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <h2 id="dialog-title" className="text-base font-semibold leading-6 text-foreground">
              {title}
            </h2>
            <p id="dialog-description" className="text-[13.5px] leading-5 text-muted-foreground">
              {description}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-1.5 -mt-1.5 h-[30px] w-[30px]"
            onClick={handleCancel}
            disabled={loading}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            {cancelText}
          </Button>
          {onConfirm && (
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={loading}
            >
              {loading && (
                <span
                  className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
                  aria-hidden
                />
              )}
              {confirmText}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
