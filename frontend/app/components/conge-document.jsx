"use client";

import { useEffect, useState } from "react";
import "./conge-document.css";

/**
 * Réplique imprimable du formulaire NAFTAL « Demande de congé annuel »
 * (ER.NAF.RH.12.V2, date d'application 29 Mai 2022). La mise en page suit le
 * .docx d'origine : mêmes libellés, mêmes pointillés, même cartouche et même
 * pied de page.
 *
 * Les champs que l'application ne suit pas (exercice, fonction de l'intérimaire,
 * avis du responsable) restent vides, à remplir à la main après impression.
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

// Le formulaire remplit chaque champ de points jusqu'au bord de la colonne.
const DOTS = "…".repeat(60);

function Fill({ short = false }) {
  return (
    <span className={`cd-fill${short ? " cd-fill-short" : ""}`} aria-hidden>
      {DOTS}
    </span>
  );
}

export default function CongeDocument({ conge, className = "", style }) {
  // La date du jour est calculée après montage : rendue au serveur, elle
  // provoquerait une divergence d'hydratation autour de minuit.
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(formatDate(new Date()));
  }, []);

  if (!conge) return null;

  const personnel = conge.personnel || {};

  const nomPrenom = [personnel.lastName, personnel.firstName]
    .filter(Boolean)
    .join(" ");

  // Le formulaire ne connaît que le congé annuel ; l'anticipation est précisée.
  const droitsConge =
    conge.typeConge === "anticipe"
      ? "CONGÉ ANNUEL PAR ANTICIPATION"
      : "CONGÉ ANNUEL";

  const jours = Number(conge.dureeConge) || 0;

  return (
    <div className={`cd-sheet ${className}`.trim()} style={style}>
      <table className="cd-head">
        <tbody>
          <tr className="cd-head-row-1">
            <td className="cd-head-logo" rowSpan={2}>
              {/* Logo extrait du modèle Word (word/media/image1.jpeg) */}
              <img src="/naftal-cartouche.jpg" alt="NAFTAL" />
              <span>Direction Générale</span>
            </td>
            <td className="cd-head-title" rowSpan={2}>
              Demande de congé
            </td>
            <td className="cd-head-ref">ER.NAF.RH.12.V2</td>
          </tr>
          <tr className="cd-head-row-2">
            <td className="cd-head-ref">
              Date d’application :
              <span className="cd-head-date">29 Mai 2022</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="cd-body">
        <p className="cd-top-line">
          {upper(conge.stationName)} le {today}
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Nom et Prénom :</span>
          <span className="cd-val">{upper(nomPrenom)}</span>
          <span className="cd-lbl"> </span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Fonction : …</span>
          <span className="cd-val">{upper(personnel.poste)}</span>
          <span className="cd-lbl"> </span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Matricule …</span>
          <span className="cd-val">{personnel.matricule || ""}</span>
          <Fill />
          <span className="cd-lbl"> Structure :…</span>
          <span className="cd-val">{upper(conge.stationName)}</span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Droits à congé : …</span>
          <span className="cd-val">{droitsConge}</span>
          <span className="cd-lbl"> </span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Nombre de jours demandés : </span>
          <span className="cd-val">
            {jours || ""} JOUR{jours > 1 ? "S" : ""}
          </span>
          <span className="cd-lbl"> </span>
          <Fill />
          {/* L'exercice de rattachement n'est pas suivi par l'application. */}
          <span className="cd-lbl">Exercice : ……………/………………</span>
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Date de Départ : </span>
          <span className="cd-val">{formatDate(conge.dateDebut)}</span>
          <Fill short />
          <span className="cd-lbl">Date de Retour : </span>
          <span className="cd-val">{formatDate(conge.dateRetour)}</span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Intérimaire </span>
          <span className="cd-sup">(1)</span>
          <span className="cd-lbl"> : …</span>
          <span className="cd-val">{upper(conge.agentInterimaire)}</span>
          <Fill />
          {/* La fonction de l'intérimaire n'est pas saisie dans l'application. */}
          <span className="cd-lbl">. Fonction : </span>
          <Fill />
        </p>

        <p className="cd-row">
          <span className="cd-lbl">Lieu de séjour prévu (adresse exacte) : </span>
          <span className="cd-val">{conge.lieuSejour || ""}</span>
          <Fill />
        </p>

        <div className="cd-gap-a" />

        <p className="cd-row-tight">Signature de l’intéressé(e)</p>

        <div className="cd-gap-b" />

        {/* Les deux mentions sont calées sur leurs cases, ancrées en absolu
            comme les rectangles du .docx. */}
        <p className="cd-avis">
          Avis du Responsable hiérarchique :
          <span className="cd-avis-acceptee">Acceptée</span>
          <span className="cd-box cd-box-acceptee" aria-hidden />
          <span className="cd-avis-refusee">Refusée</span>
          <span className="cd-box cd-box-refusee" aria-hidden />
        </p>

        <div className="cd-rule" />

        <div className="cd-gap-c" />

        <p className="cd-date-signature">Date et Signature</p>

        <div className="cd-gap-d" />

        <p className="cd-note">
          <span className="cd-sup">(1)</span> A renseigner lorsqu’il s’agit de
          postes d’encadrement et/ou de responsabilité.
        </p>
      </div>

      <div className="cd-foot">
        <span>Date d’édition : Mai 2022</span>
        <span>Propriété NAFTAL- Reproduction interdite</span>
        <span>Page 1 sur 1</span>
      </div>
    </div>
  );
}
