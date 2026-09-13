"use client";

import "./avis-document.css";
import { motifLabel } from "@/lib/absence-motifs";

/**
 * Réplique imprimable du formulaire NAFTAL « AVIS D'ABSENCE / AVIS DE REPRISE ».
 *
 * Le même document sert aux deux sections : la case cochée en tête change, et
 * la « Date du Premier Jour De Reprise » ne vaut que pour un avis de reprise.
 * Les champs que l'application ne connaît pas restent vides, à remplir à la main.
 */

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const upper = (value) => (value ? String(value).toUpperCase() : "");

/**
 * Construit les données du document depuis une absence.
 * `Date du Premier Jour De Reprise` reste vide : c'est un avis d'absence.
 */
export function avisFromAbsence(absence) {
  if (!absence) return null;
  const p = absence.personnel || {};
  return {
    type: "absence",
    dateEmission: absence.createdAt,
    nom: p.lastName,
    prenom: p.firstName,
    structure: p.stationName,
    motif: motifLabel(absence.motif),
    fonction: p.poste,
    dateAbsence: absence.date,
    dateReprise: "",
    observation: absence.description,
  };
}

/**
 * Construit les données du document depuis un avis de reprise.
 * Le motif, la date d'absence et l'observation viennent de l'avis d'absence
 * clôturé — la description de l'absence tient lieu d'observation.
 */
export function avisFromReprise(reprise) {
  if (!reprise) return null;
  const p = reprise.personnel || {};
  const absences = [...(reprise.absences || [])].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const premiere = absences[0];

  return {
    type: "reprise",
    dateEmission: reprise.createdAt,
    nom: p.lastName,
    prenom: p.firstName,
    structure: p.stationName,
    motif: premiere ? motifLabel(premiere.motif) : "",
    fonction: p.poste,
    dateAbsence: premiere?.date,
    dateReprise: reprise.dateReprise,
    observation: premiere?.description,
  };
}

export default function AvisDocument({ avis, className = "", style }) {
  if (!avis) return null;

  const estReprise = avis.type === "reprise";

  return (
    <div className={`avis-sheet ${className}`.trim()} style={style}>
      <div className="avis-head">
        {/* Logo extrait du modèle Word (word/media/image1.png) */}
        <img src="/avis-entete.png" alt="NAFTAL" />
        <div className="avis-head-lines">
          <p>
            Société Nationale de Commercialisation et de Distribution de Produits
            Pétroliers
          </p>
          <p>District Commercialisation SBA</p>
          <p>Agence commercialisation Oran</p>
        </div>
      </div>

      <p className="avis-date">Date : {formatDate(avis.dateEmission)}</p>

      <div className="avis-titles">
        <div className="avis-title-row">
          <span className="avis-title avis-title-center">AVIS D’ABSENCE</span>
          <span className="avis-box">{estReprise ? "" : "X"}</span>
        </div>
        <div className="avis-title-row">
          <span className="avis-title avis-title-center">AVIS DE REPRISE</span>
          <span className="avis-box">{estReprise ? "X" : ""}</span>
        </div>
      </div>

      <div className="avis-fields">
        <p className="avis-field">Nom : {upper(avis.nom)}</p>
        <p className="avis-field">Prénom : {upper(avis.prenom)}</p>
        <p className="avis-field">Structure : {upper(avis.structure)}</p>
        <p className="avis-field">Motif : {upper(avis.motif)}</p>
        <p className="avis-field-tight">Fonction : {upper(avis.fonction)}</p>
        <p className="avis-field-tight">
          Date du Premier Jour d’absence : {formatDate(avis.dateAbsence)}
        </p>
        <p className="avis-field-tight">
          Date du Premier Jour De Reprise : {formatDate(avis.dateReprise)}
        </p>
      </div>

      <div className="avis-frame">
        <p className="avis-frame-label">Observation : {avis.observation || ""}</p>
        <p className="avis-frame-note">
          Cet avis doit être adressé au service des personnels dès la constations
          de l’absence
        </p>
      </div>

      <p className="avis-signature">Signature du responsable hiérarchique</p>
    </div>
  );
}
