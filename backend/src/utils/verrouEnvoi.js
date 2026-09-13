// utils/verrouEnvoi.js
const fs = require("fs");
const path = require("path");
const Bordereau = require("../models/bordereauModel");
const Reprise = require("../models/repriseModel");

/**
 * Verrou des documents envoyés.
 *
 * Un document figurant sur un bordereau d'envoi (avis d'absence, avis de
 * reprise, demande de congé) ne peut plus être modifié ni supprimé tant que
 * ce bordereau n'est pas annulé. Une absence reprise dans un avis de reprise
 * envoyé est verrouillée elle aussi : l'avis imprimé reprend son motif, sa
 * date et son observation.
 *
 * Chaque fonction répond 423 et renvoie true quand le document est verrouillé ;
 * le contrôleur doit alors s'arrêter.
 */

const formatDate = (value) =>
  new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const idDe = (ref) => (ref && ref._id ? ref._id : ref);

async function bordereauDe(ref) {
  const id = idDe(ref);
  if (!id) return null;
  return Bordereau.findById(id).select("createdAt stationName").lean();
}

const conclusion = (pronom) =>
  `Annulez ce bordereau depuis la page Envois pour ${pronom} modifier ou ${pronom} supprimer.`;

function refuser(req, res, message, bordereau) {
  // Multer a déjà enregistré un éventuel justificatif : il ne servira pas.
  if (req.file && req.file.path) {
    fs.unlink(path.resolve(req.file.path), (err) => {
      if (err) console.warn("Échec suppression du fichier refusé :", err);
    });
  }

  res.status(423).json({
    code: "DOCUMENT_ENVOYE",
    message,
    bordereau: {
      _id: bordereau._id,
      createdAt: bordereau.createdAt,
      stationName: bordereau.stationName,
    },
  });
  return true;
}

async function refuserCongeEnvoye(req, res, conge) {
  const b = await bordereauDe(conge && conge.bordereau);
  if (!b) return false;
  return refuser(
    req,
    res,
    `Cette demande de congé figure sur le bordereau d'envoi du ${formatDate(b.createdAt)}. ${conclusion("la")}`,
    b
  );
}

async function refuserRepriseEnvoyee(req, res, reprise) {
  const b = await bordereauDe(reprise && reprise.bordereau);
  if (!b) return false;
  return refuser(
    req,
    res,
    `Cet avis de reprise figure sur le bordereau d'envoi du ${formatDate(b.createdAt)}. ${conclusion("le")}`,
    b
  );
}

async function refuserAbsenceEnvoyee(req, res, absence) {
  if (!absence) return false;

  const b = await bordereauDe(absence.bordereau);
  if (b) {
    return refuser(
      req,
      res,
      `Cet avis d'absence figure sur le bordereau d'envoi du ${formatDate(b.createdAt)}. ${conclusion("le")}`,
      b
    );
  }

  // Absence clôturée par un avis de reprise déjà envoyé.
  const repriseId = idDe(absence.reprise);
  if (!repriseId) return false;
  const reprise = await Reprise.findById(repriseId).select("bordereau").lean();
  const br = await bordereauDe(reprise && reprise.bordereau);
  if (!br) return false;

  return refuser(
    req,
    res,
    `Cette absence est reprise dans un avis de reprise envoyé sur le bordereau du ${formatDate(br.createdAt)}. ${conclusion("la")}`,
    br
  );
}

module.exports = {
  refuserCongeEnvoye,
  refuserRepriseEnvoyee,
  refuserAbsenceEnvoyee,
};
