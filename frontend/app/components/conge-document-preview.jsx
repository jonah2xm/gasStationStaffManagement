"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CongeDocument from "@/components/conge-document";

// La feuille fait 210 mm de large : on la réduit pour la faire tenir dans la
// fenêtre, sans toucher à ses dimensions réelles (l'impression reste en A4).
const SCALE = 0.72;
const SHEET_WIDTH_MM = 210;
const SHEET_HEIGHT_MM = 297;

/**
 * Aperçu de la demande de congé avant enregistrement.
 * `conge` a la même forme que la réponse de GET /api/conges/:id.
 */
export default function CongeDocumentPreview({ open, onOpenChange, conge }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(210mm*0.72+3rem)]">
        <DialogHeader>
          <DialogTitle>Aperçu de la demande</DialogTitle>
          <DialogDescription>
            Document généré à partir du formulaire. Il sera imprimable après
            l’enregistrement du congé.
          </DialogDescription>
        </DialogHeader>
        <div
          className="overflow-auto rounded-md border border-border bg-muted"
          style={{ maxHeight: "70vh" }}
        >
          <div
            style={{
              width: `${SHEET_WIDTH_MM * SCALE}mm`,
              height: `${SHEET_HEIGHT_MM * SCALE}mm`,
            }}
          >
            <CongeDocument
              conge={conge}
              className={`cd-scaled`}
              style={{ transform: `scale(${SCALE})` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
