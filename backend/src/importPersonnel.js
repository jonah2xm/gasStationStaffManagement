// Import en masse du personnel depuis un classeur Excel (feuilles « Personnel »
// et « Stations », voir Import_Personnel_RSU_Oran.xlsx).
//
//   node src/importPersonnel.js <fichier.xlsx>           simulation, n'écrit rien
//   node src/importPersonnel.js <fichier.xlsx> --apply   écrit dans MONGO_URI
//
// Les stations absentes sont créées (les existantes ne sont pas modifiées) et
// les matricules déjà en base sont ignorés : le script peut être relancé.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mongoose = require("mongoose");
const XLSX = require("xlsx");

const Station = require("./models/stationModel");
const Personnel = require("./models/personnelModel");

const [fichier, ...options] = process.argv.slice(2);
const appliquer = options.includes("--apply");

// Colonne Excel -> champ du modèle
const COLONNES_PERSONNEL = {
  Matricule: "matricule",
  Nom: "lastName",
  "Prénom": "firstName",
  "Date de naissance": "birthDate",
  "Date de recrutement": "hireDate",
  Poste: "poste",
  "Type de contrat": "contractType",
  "Décision": "decision",
  "Code station": "stationCode",
  Statut: "status",
};
const COLONNES_STATION = {
  Code: "code",
  Nom: "name",
  Adresse: "address",
  Ville: "city",
  Wilaya: "state",
  Type: "type",
  Notes: "notes",
};

// Numéro de série Excel ou « jj/mm/aaaa » -> minuit heure locale, comme les
// dates saisies dans l'application.
function lireDate(valeur) {
  if (typeof valeur === "number") {
    const { y, m, d } = XLSX.SSF.parse_date_code(valeur);
    return new Date(y, m - 1, d);
  }
  const m = String(valeur || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? new Date(+m[3], +m[2] - 1, +m[1]) : null;
}

function lireFeuille(classeur, nom, colonnes) {
  const feuille = classeur.Sheets[nom];
  if (!feuille) throw new Error(`Feuille « ${nom} » introuvable dans ${fichier}`);
  return XLSX.utils.sheet_to_json(feuille, { defval: "", raw: true }).map((ligne, i) => {
    const doc = { ligne: i + 2 };
    for (const [colonne, champ] of Object.entries(colonnes)) {
      const v = ligne[colonne];
      doc[champ] = typeof v === "string" ? v.trim() : v;
    }
    return doc;
  });
}

function erreursValidation(doc) {
  const err = doc.validateSync();
  return err ? Object.values(err.errors).map((e) => e.message) : [];
}

async function main() {
  if (!fichier) {
    console.log("Usage : node src/importPersonnel.js <fichier.xlsx> [--apply]");
    process.exit(1);
  }
  const classeur = XLSX.readFile(path.resolve(fichier));
  const lignesStations = lireFeuille(classeur, "Stations", COLONNES_STATION).filter((s) => s.code);
  const lignesPersonnel = lireFeuille(classeur, "Personnel", COLONNES_PERSONNEL).filter((p) => p.matricule);

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Base : ${mongoose.connection.name} · ${appliquer ? "IMPORT" : "SIMULATION (ajoutez --apply pour écrire)"}\n`);

  // 1. Stations
  const stations = new Map(
    (await Station.find({ code: { $in: lignesStations.map((s) => s.code) } })).map((s) => [s.code, s])
  );
  const nouvellesStations = [];
  for (const { ligne, ...s } of lignesStations) {
    if (stations.has(s.code)) continue;
    const doc = new Station(s);
    const erreurs = erreursValidation(doc);
    if (erreurs.length) {
      console.log(`Stations ligne ${ligne} (${s.code}) ignorée : ${erreurs.join(", ")}`);
      continue;
    }
    stations.set(s.code, doc);
    nouvellesStations.push(doc);
  }

  // 2. Personnel
  const dejaEnBase = new Set(
    (await Personnel.find({ matricule: { $in: lignesPersonnel.map((p) => String(p.matricule)) } }, "matricule")).map(
      (p) => p.matricule
    )
  );
  const vus = new Set();
  const aCreer = [];
  const rejets = [];
  let ignores = 0;
  for (const { ligne, stationCode, ...p } of lignesPersonnel) {
    const matricule = String(p.matricule);
    if (dejaEnBase.has(matricule)) {
      ignores++;
      continue;
    }
    if (vus.has(matricule)) {
      rejets.push(`ligne ${ligne} : matricule ${matricule} en double dans le fichier`);
      continue;
    }
    vus.add(matricule);
    const station = stations.get(stationCode);
    const doc = new Personnel({
      ...p,
      matricule,
      birthDate: lireDate(p.birthDate),
      hireDate: lireDate(p.hireDate),
      station: station && station._id,
      stationName: station && station.name,
      status: p.status || "Actif",
      holidaysLeft: 0,
    });
    const erreurs = erreursValidation(doc);
    if (!station) erreurs.unshift(`station « ${stationCode} » inconnue`);
    if (erreurs.length) rejets.push(`ligne ${ligne} (${matricule}) : ${erreurs.join(", ")}`);
    else aCreer.push(doc);
  }

  // 3. Écriture
  if (appliquer) {
    if (nouvellesStations.length) await Station.insertMany(nouvellesStations);
    if (aCreer.length) await Personnel.insertMany(aCreer, { ordered: false });
  }

  const verbe = appliquer ? "créé(s)" : "à créer";
  console.log(`Stations : ${nouvellesStations.length} ${verbe}${nouvellesStations.length ? ` (${nouvellesStations.map((s) => s.code).join(", ")})` : ""}, ${lignesStations.length - nouvellesStations.length} déjà en base`);
  console.log(`Personnel : ${aCreer.length} ${verbe}, ${ignores} déjà en base, ${rejets.length} rejeté(s)`);
  rejets.forEach((r) => console.log(`  - ${r}`));

  await mongoose.disconnect();
  process.exit(rejets.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error("Import interrompu :", err.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
