/**
 * Migration : AbsenceAA + AbsenceAI  ->  Absence (collection unique).
 *
 *   node src/scripts/migrateAbsences.js --dry-run   (par défaut, n'écrit rien)
 *   node src/scripts/migrateAbsences.js --commit    (écrit réellement)
 *
 * Règles retenues :
 *   - AbsenceAA -> motif = absenceType, date = startDate
 *   - AbsenceAI -> motif = "nonAutorisee", date = startDate
 *   - la date de fin n'est pas reprise : une absence ne porte plus qu'une date
 *   - les avis de reprise (operationType "avisReprise") ne sont pas repris :
 *     ils décrivent un retour, pas une absence, et feront l'objet d'une
 *     fonctionnalité dédiée
 *
 * Les collections d'origine ne sont pas touchées : elles restent disponibles
 * en sauvegarde. Le script est rejouable — un enregistrement déjà migré est
 * ignoré (même agent, même date).
 */

require("dotenv").config();
const mongoose = require("mongoose");

const Absence = require("../models/absenceModel");
const { MOTIFS, MOTIF_NON_AUTORISE } = require("../models/absenceModel");
const AbsenceAA = require("../models/absenceAAModel");
const AbsenceAI = require("../models/absenceAIModel");

const COMMIT = process.argv.includes("--commit");

function startOfDay(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function alreadyMigrated(personnel, date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  const found = await Absence.findOne({
    personnel,
    date: { $gte: date, $lt: next },
  })
    .select("_id")
    .lean();
  return Boolean(found);
}

async function run() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGO_URI absent de l'environnement.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connecté. Mode : ${COMMIT ? "ÉCRITURE" : "SIMULATION (dry-run)"}\n`);

  const report = {
    aaLues: 0,
    aaMigrees: 0,
    aiLues: 0,
    aiMigrees: 0,
    reprisesIgnorees: 0,
    doublonsIgnores: 0,
    motifsInconnus: [],
    sansPersonnel: 0,
  };

  // --- AbsenceAA -------------------------------------------------------
  const aaRecords = await AbsenceAA.find().lean();
  report.aaLues = aaRecords.length;

  for (const aa of aaRecords) {
    if (!aa.personnel || !aa.startDate) {
      report.sansPersonnel += 1;
      continue;
    }

    let motif = aa.absenceType;
    if (!MOTIFS.includes(motif)) {
      // Un motif hors liste devient "autre" plutôt que de bloquer la reprise.
      report.motifsInconnus.push(String(motif));
      motif = "autre";
    }

    const date = startOfDay(aa.startDate);
    if (await alreadyMigrated(aa.personnel, date)) {
      report.doublonsIgnores += 1;
      continue;
    }

    const doc = {
      personnel: aa.personnel,
      date,
      motif,
      description: aa.description || "",
      document: aa.document || "",
      createdAt: aa.createdAt || date,
    };

    if (COMMIT) await Absence.create(doc);
    report.aaMigrees += 1;
  }

  // --- AbsenceAI -------------------------------------------------------
  const aiRecords = await AbsenceAI.find().lean();
  report.aiLues = aiRecords.length;

  for (const ai of aiRecords) {
    if (ai.operationType === "avisReprise") {
      report.reprisesIgnorees += 1;
      continue;
    }
    if (!ai.personnel || !ai.startDate) {
      report.sansPersonnel += 1;
      continue;
    }

    const date = startOfDay(ai.startDate);
    if (await alreadyMigrated(ai.personnel, date)) {
      report.doublonsIgnores += 1;
      continue;
    }

    const doc = {
      personnel: ai.personnel,
      date,
      motif: MOTIF_NON_AUTORISE,
      description: "",
      document: ai.document || "",
      createdAt: ai.createdAt || date,
    };

    if (COMMIT) await Absence.create(doc);
    report.aiMigrees += 1;
  }

  console.log("Absences AA lues              :", report.aaLues);
  console.log("Absences AA migrées           :", report.aaMigrees);
  console.log("Avis AI lus                   :", report.aiLues);
  console.log("Avis AI migrés                :", report.aiMigrees);
  console.log("Avis de reprise ignorés       :", report.reprisesIgnorees);
  console.log("Doublons ignorés              :", report.doublonsIgnores);
  console.log("Enregistrements incomplets    :", report.sansPersonnel);
  if (report.motifsInconnus.length) {
    const counts = report.motifsInconnus.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});
    console.log("Motifs inconnus -> 'autre'    :", counts);
  }

  const total = await Absence.countDocuments();
  console.log("\nTotal dans la collection Absence :", total);

  if (!COMMIT) {
    console.log("\nSimulation : aucune écriture. Relancer avec --commit.");
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Échec de la migration :", err);
  await mongoose.disconnect();
  process.exit(1);
});
