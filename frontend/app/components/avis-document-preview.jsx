"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AvisDocument from "@/components/avis-document";

// La feuille fait 210 mm de large : on la réduit pour la faire tenir dans la
// fenêtre, sans toucher à ses dimensions réelles (l'impression reste en A4).
const SCALE = 0.72;
const SHEET_WIDTH_MM = 210;
const SHEET_HEIGHT_MM = 297;

/** Aperçu de l'avis avant enregistrement. */
export default function AvisDocumentPreview({ open, onOpenChange, avis }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(210mm*0.72+3rem)]">
        <DialogHeader>
          <DialogTitle>Aperçu de l’avis</DialogTitle>
          <DialogDescription>
            Document généré à partir du formulaire. Il sera imprimable après
            l’enregistrement.
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
            <AvisDocument
              avis={avis}
              className="avis-scaled"
              style={{ transform: `scale(${SCALE})` }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
