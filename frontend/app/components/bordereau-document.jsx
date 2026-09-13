"use client";

import "./bordereau-document.css";
import { categoriesBordereau, DESTINATION } from "@/lib/bordereau";

/**
 * Réplique imprimable du « BORDEREAU D'ENVOI » NAFTAL (bordereau d'envoi.doc).
 *
 * L'en-tête nomme la station expéditrice, le destinataire est l'Agence COM
 * Oran. La colonne DESIGNATION liste une catégorie par type de document, un
 * agent par ligne (« (2) » quand il a plusieurs pièces) ; NB compte les pièces
 * de chaque catégorie. N° et OBSERVATION restent vides, comme sur l'exemple.
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

export default function BordereauDocument({ bordereau, className = "", style }) {
  if (!bordereau) return null;

  const categories = categoriesBordereau(bordereau);

  return (
    <div className={`bd-sheet ${className}`.trim()} style={style}>
      <header className="bd-head">
        {/* Logo extrait du modèle Word (word/media/image1.png) */}
        <img src="/bordereau-entete.png" alt="NAFTAL" />
        <p>District Commercialisation SBA</p>
        <p>{String(bordereau.stationName || "").toUpperCase()}</p>
      </header>

      <p className="bd-date">Oran, le {formatDate(bordereau.createdAt)}</p>

      <h1 className="bd-title">BORDEREAU D’ENVOI</h1>
      <p className="bd-recipient">{bordereau.destination || DESTINATION}</p>

      <p className="bd-intro">Veuillez trouver ci-joint :</p>

      <div className="bd-table">
        <div className="bd-row bd-row-head">
          <div className="bd-cell">N°</div>
          <div className="bd-cell">DESIGNATION</div>
          <div className="bd-cell">NB</div>
          <div className="bd-cell">OBSERVATION</div>
        </div>

        <div className="bd-body">
          {categories.map((cat) => (
            <div className="bd-row bd-row-cat" key={cat.numero}>
              <div className="bd-cell" />
              <div className="bd-cell bd-designation">
                <p className="bd-cat">
                  <span className="bd-cat-num">{cat.numero}.</span>
                  {cat.designation}
                </p>
                {cat.agents.map((agent, index) => (
                  <p className="bd-agent" key={agent.key}>
                    <span className="bd-agent-num">
                      {cat.numero}.{index + 1}.
                    </span>
                    {agent.nom}
                    {agent.nombre > 1 ? ` (${agent.nombre})` : ""}
                  </p>
                ))}
              </div>
              <div className="bd-cell bd-nb">{cat.nb}</div>
              <div className="bd-cell" />
            </div>
          ))}

          {/* Étire les filets verticaux jusqu'au bas de la grande ligne. */}
          <div className="bd-row bd-row-fill" aria-hidden>
            <div className="bd-cell" />
            <div className="bd-cell" />
            <div className="bd-cell" />
            <div className="bd-cell" />
          </div>
        </div>

        <div className="bd-row bd-row-foot" aria-hidden>
          <div className="bd-cell" />
          <div className="bd-cell" />
          <div className="bd-cell" />
          <div className="bd-cell" />
        </div>
      </div>

      <p className="bd-responsable">Responsable :</p>

      <footer className="bd-foot">
        <p className="bd-foot-1">
          Société Nationale de Commercialisation et de Distribution de Produits
          Pétroliers Naftal SPA au Capital de 15.650.000.000.00DA
        </p>
        <p className="bd-foot-2">
          District Commercialisation d’ Oran, Chemin Vicinal N°9 Petit Lac Oran{" "}
          <b>B.P 1520 ORAN EL MENOUAR</b>
        </p>
        <p className="bd-foot-3">
          <b>
            ☎ : (041) 45.25.23-(041) 46.35.34 - ℻ : (041) 45.18.31-(041)
            45.19.65.
          </b>{" "}
          émail : <b className="bd-mail">clporan@algeriecom.com</b>
        </p>
      </footer>
    </div>
  );
}
