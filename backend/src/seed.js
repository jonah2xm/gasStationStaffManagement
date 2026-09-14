// One-off script to populate the local dev database with realistic sample
// data across every collection (stations, personnel, users, absences,
// affectations, congés, récupérations, pointages, notifications).
// Safe to re-run: each block skips insertion if the data already exists.
require("dotenv").config();
const mongoose = require("mongoose");

const Station = require("./models/stationModel");
const Personnel = require("./models/personnelModel");
const User = require("./models/userModel");
const AbsenceAA = require("./models/absenceAAModel");
const AbsenceAI = require("./models/absenceAIModel");
const AffectationTemporaire = require("./models/affectationTemporaire");
const AffectationDefinitif = require("./models/affectatoinDefinitifModel");
const Conge = require("./models/congeModel");
const Pointage = require("./models/pointageModel");
const Notification = require("./models/notificationModel");

const daysFromNow = (n) => {
  const d = new Date();
  d.setHours(8, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
};

async function seedStations() {
  const data = [
    {
      code: "R3120",
      name: "GD R3120",
      address: "Route Nationale 5, Rouiba",
      city: "Alger",
      state: "Alger",
      type: "Urbaine",
      notes: "Station principale de la zone est d'Alger",
    },
    {
      code: "R3121",
      name: "GD R3121",
      address: "Boulevard Front de Mer",
      city: "Oran",
      state: "Oran",
      type: "Urbaine",
      notes: "",
    },
    {
      code: "R3124",
      name: "GD R3124",
      address: "RN3, Zone Industrielle",
      city: "Constantine",
      state: "Constantine",
      type: "Rurale",
      notes: "",
    },
    {
      code: "R3128",
      name: "GD R3128",
      address: "Autoroute Est-Ouest, Sortie Ouargla",
      city: "Ouargla",
      state: "Ouargla",
      type: "Autoroute",
      notes: "Trafic poids-lourds élevé",
    },
    {
      code: "R3133",
      name: "GD R3133",
      address: "Route de l'Aéroport",
      city: "Tlemcen",
      state: "Tlemcen",
      type: "Airport",
      notes: "",
    },
  ];

  const stations = [];
  for (const s of data) {
    const station = await Station.findOneAndUpdate(
      { name: s.name },
      { $setOnInsert: s },
      { upsert: true, new: true }
    );
    stations.push(station);
  }
  console.log(`Stations: ${stations.length} ready`);
  return stations;
}

async function seedPersonnel(stations) {
  const posts = [
    "Pompiste Encaisseur",
    "Laveur Graisseur",
    "Agent Prevention Intervention",
    "Chef d'equipe",
    "Chef de station",
  ];

  const names = [
    ["Karim", "Belkacem"],
    ["Amina", "Cherif"],
    ["Yacine", "Boudiaf"],
    ["Nadia", "Haddad"],
    ["Samir", "Meziane"],
    ["Fatima Zohra", "Rahmani"],
    ["Omar", "Ait Ahmed"],
    ["Sofiane", "Benali"],
    ["Leila", "Bouzid"],
    ["Rachid", "Guerroudj"],
    ["Meriem", "Saadi"],
    ["Farid", "Kaci"],
    ["Hakim", "Bensalem"],
    ["Wafa", "Chaouch"],
    ["Nabil", "Ferhat"],
  ];

  const statusPool = ["Actif", "Actif", "Actif", "En congé", "En formation"];
  const personnelDocs = [];

  let i = 0;
  for (const station of stations) {
    for (let slot = 0; slot < 3; slot++) {
      const [firstName, lastName] = names[i];
      const matricule = `${station.code}-${String(slot + 1).padStart(2, "0")}`;
      const poste = slot === 0 ? "Chef de station" : slot === 1 ? "Chef d'equipe" : posts[i % posts.length];

      const doc = {
        matricule,
        firstName,
        lastName,
        birthDate: new Date(1985 + (i % 15), i % 12, (i % 27) + 1),
        hireDate: new Date(2015 + (i % 9), i % 12, (i % 27) + 1),
        poste,
        contractType: i % 4 === 0 ? "CDD" : "CDI",
        decision: `DEC-${2018 + (i % 7)}-${String(100 + i)}`,
        station: station._id,
        stationName: station.name,
        status: i === 3 || i === 7 ? "Inactif" : statusPool[i % statusPool.length],
        holidaysLeft: i % 5 === 0 ? 0 : 10 + (i % 20),
      };

      const personnel = await Personnel.findOneAndUpdate(
        { matricule },
        { $setOnInsert: doc },
        { upsert: true, new: true }
      );
      personnelDocs.push(personnel);
      i++;
    }
  }
  console.log(`Personnel: ${personnelDocs.length} ready`);
  return personnelDocs;
}

async function seedUsers(stations, personnel) {
  const toCreate = [
    {
      username: "sara.gestionnaire",
      email: "sara.gestionnaire@naftal.dz",
      password: "Gestion2000",
      role: "gestionnaire",
    },
    {
      username: personnel[0].matricule, // Chef de station of GD R3120
      email: `${personnel[0].matricule}@naftal.dz`.toLowerCase(),
      password: "Chef2000",
      role: "chef station",
      occupiedStation: stations[0].name,
    },
    {
      username: personnel[9].matricule, // Chef de station of GD R3128
      email: `${personnel[9].matricule}@naftal.dz`.toLowerCase(),
      password: "Chef2000",
      role: "chef station",
      occupiedStation: stations[3].name,
    },
  ];

  // Restricted "personnel" (pointage-only) accounts for a few employees
  const pointageAccounts = [2, 5, 8, 11].map((idx) => ({
    username: personnel[idx].matricule,
    email: `${personnel[idx].matricule}@naftal.dz`.toLowerCase(),
    password: "Pointage2000",
    role: "personnel",
    occupiedStation: personnel[idx].stationName,
  }));

  const created = [];
  for (const u of [...toCreate, ...pointageAccounts]) {
    let user = await User.findOne({ username: u.username });
    if (!user) {
      user = await User.create(u);
    }
    created.push(user);
  }
  console.log(`Users: ${created.length} additional accounts ready`);
  return created;
}

async function seedAbsences(personnel) {
  if ((await AbsenceAA.countDocuments()) === 0) {
    await AbsenceAA.insertMany([
      {
        personnel: personnel[1]._id,
        startDate: daysFromNow(-10),
        endDate: daysFromNow(-2),
        absenceType: "maladie",
        description: "Grippe saisonnière, arrêt médical",
      },
      {
        personnel: personnel[4]._id,
        startDate: daysFromNow(-3),
        endDate: daysFromNow(4),
        absenceType: "naissance",
        description: "Congé de naissance",
      },
      {
        personnel: personnel[9]._id,
        startDate: daysFromNow(-20),
        endDate: daysFromNow(-18),
        absenceType: "marriage",
        description: "Mariage du frère",
      },
      {
        personnel: personnel[12]._id,
        startDate: daysFromNow(-1),
        endDate: daysFromNow(1),
        absenceType: "examen",
        description: "Examen universitaire",
      },
      {
        personnel: personnel[14]._id,
        startDate: daysFromNow(-30),
        endDate: daysFromNow(-27),
        absenceType: "decés",
        description: "Décès d'un proche",
      },
    ]);
  }

  if ((await AbsenceAI.countDocuments()) === 0) {
    await AbsenceAI.insertMany([
      {
        personnel: personnel[3]._id,
        operationType: "avisAbsence",
        startDate: daysFromNow(-4),
      },
      {
        personnel: personnel[7]._id,
        operationType: "avisAbsence",
        startDate: daysFromNow(-1),
      },
      {
        personnel: personnel[2]._id,
        operationType: "avisReprise",
        startDate: daysFromNow(-15),
        endDate: daysFromNow(-15),
      },
      {
        personnel: personnel[10]._id,
        operationType: "avisReprise",
        startDate: daysFromNow(-8),
        endDate: daysFromNow(-8),
      },
    ]);
  }
  console.log("AbsenceAA / AbsenceAI: ready");
}

async function seedAffectations(personnel, stations) {
  if ((await AffectationTemporaire.countDocuments()) === 0) {
    await AffectationTemporaire.insertMany([
      {
        personnel: personnel[5]._id,
        startDate: daysFromNow(-5),
        endDate: daysFromNow(10),
        originStation: stations[1]._id,
        affectedStation: stations[0]._id,
        description: "Renfort pour surcharge saisonnière",
      },
      {
        personnel: personnel[8]._id,
        startDate: daysFromNow(-2),
        endDate: daysFromNow(5),
        originStation: stations[2]._id,
        affectedStation: stations[4]._id,
        description: "Remplacement congé maladie",
      },
      {
        personnel: personnel[13]._id,
        startDate: daysFromNow(-40),
        endDate: daysFromNow(-30),
        originStation: stations[4]._id,
        affectedStation: stations[3]._id,
        description: "Formation sur site",
      },
    ]);
  }

  if ((await AffectationDefinitif.countDocuments()) === 0) {
    await AffectationDefinitif.insertMany([
      {
        personnel: personnel[11]._id,
        startDate: daysFromNow(-60),
        originStation: stations[3]._id,
        affectedStation: stations[2]._id,
        description: "Mutation définitive suite à demande personnelle",
      },
      {
        personnel: personnel[0]._id,
        startDate: daysFromNow(-200),
        originStation: stations[1]._id,
        affectedStation: stations[0]._id,
        description: "Promotion au poste de chef de station",
      },
    ]);
  }
  console.log("AffectationTemporaire / AffectationDefinitif: ready");
}

async function seedConges(personnel) {
  if ((await Conge.countDocuments()) === 0) {
    await Conge.insertMany([
      {
        personnelId: personnel[1]._id,
        stationName: personnel[1].stationName,
        typeConge: "ordinaire",
        dureeConge: 30,
        dateDebut: daysFromNow(-10),
        dateRetour: daysFromNow(20),
        lieuSejour: "Béjaïa",
        nombreJourRestant: 0,
        documentPath: "seed/conge-ordinaire-1.pdf",
      },
      {
        personnelId: personnel[4]._id,
        stationName: personnel[4].stationName,
        typeConge: "anticipe",
        dureeConge: 10,
        dateDebut: daysFromNow(5),
        dateRetour: daysFromNow(15),
        lieuSejour: "Tipaza",
        nombreJourRestant: 20,
        documentPath: "seed/conge-anticipe-1.pdf",
      },
      {
        personnelId: personnel[6]._id,
        stationName: personnel[6].stationName,
        typeConge: "ordinaire",
        dureeConge: 21,
        dateDebut: daysFromNow(-60),
        dateRetour: daysFromNow(-39),
        lieuSejour: "Annaba",
        nombreJourRestant: 8,
        documentPath: "seed/conge-ordinaire-2.pdf",
      },
      {
        personnelId: personnel[9]._id,
        stationName: personnel[9].stationName,
        typeConge: "ordinaire",
        dureeConge: 15,
        dateDebut: daysFromNow(30),
        dateRetour: daysFromNow(45),
        lieuSejour: "Ghardaïa",
        nombreJourRestant: 5,
        documentPath: "seed/conge-ordinaire-3.pdf",
      },
      {
        personnelId: personnel[10]._id,
        stationName: personnel[10].stationName,
        typeConge: "anticipe",
        dureeConge: 7,
        dateDebut: daysFromNow(-90),
        dateRetour: daysFromNow(-83),
        lieuSejour: "Tlemcen",
        nombreJourRestant: 12,
        documentPath: "seed/conge-anticipe-2.pdf",
      },
      {
        personnelId: personnel[13]._id,
        stationName: personnel[13].stationName,
        typeConge: "ordinaire",
        dureeConge: 30,
        dateDebut: daysFromNow(60),
        dateRetour: daysFromNow(90),
        lieuSejour: "Oran",
        nombreJourRestant: 0,
        documentPath: "seed/conge-ordinaire-4.pdf",
      },
    ]);
  }
  console.log("Conges: ready");
}

async function seedPointages(personnel, users) {
  const pointageUsers = users.filter((u) => u.role === "personnel");
  if (pointageUsers.length === 0 || (await Pointage.countDocuments()) > 0) {
    console.log("Pointages: skipped (no accounts or already seeded)");
    return;
  }

  const entries = [];
  for (const user of pointageUsers) {
    const p = personnel.find((per) => per.matricule === user.username);
    if (!p) continue;

    for (let dayOffset = -5; dayOffset <= 0; dayOffset++) {
      const date = daysFromNow(dayOffset);
      date.setHours(0, 0, 0, 0);

      const entryTime = new Date(date);
      entryTime.setHours(7, 30 + (dayOffset % 3) * 5, 0, 0);

      const isToday = dayOffset === 0;
      const exitTime = isToday
        ? undefined
        : (() => {
            const t = new Date(date);
            t.setHours(15, 30, 0, 0);
            return t;
          })();

      entries.push({
        userId: user._id,
        matricule: p.matricule,
        firstName: p.firstName,
        lastName: p.lastName,
        stationName: p.stationName,
        date,
        entryTime,
        exitTime,
      });
    }
  }

  if (entries.length) await Pointage.insertMany(entries);
  console.log(`Pointages: ${entries.length} entries created`);
}

async function seedNotifications(allUsers) {
  if ((await Notification.countDocuments()) > 0) {
    console.log("Notifications: skipped (already seeded)");
    return;
  }

  const messages = [
    {
      type: "Conge",
      message: "Une nouvelle demande de congé a été soumise par Amina Cherif.",
      detailsUrl: "/conges",
    },
    {
      type: "AbsenceAA",
      message: "Un avis d'absence autorisée a été enregistré pour Samir Meziane.",
      detailsUrl: "/absence/aa",
    },
    {
      type: "AffectationTemporaire",
      message: "Fatima Zohra Rahmani a été affectée temporairement à GD R3120.",
      detailsUrl: "/affectation/temporaire",
    },
    {
      type: "MonthlyAccrual",
      message: "Vous avez reçu 2,5 jours de congés supplémentaires ce mois-ci.",
      detailsUrl: "/conges",
    },
  ];

  const inserts = [];
  for (const user of allUsers) {
    messages.forEach((m, idx) => {
      inserts.push({
        personnel: user._id,
        type: m.type,
        message: m.message,
        detailsUrl: m.detailsUrl,
        seen: idx % 2 === 0,
        seenAt: idx % 2 === 0 ? daysFromNow(-1) : undefined,
        createdAt: daysFromNow(-idx),
      });
    });
  }

  await Notification.insertMany(inserts);
  console.log(`Notifications: ${inserts.length} created`);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB connected:", process.env.MONGO_URI);

  const stations = await seedStations();
  const personnel = await seedPersonnel(stations);
  const newUsers = await seedUsers(stations, personnel);
  await seedAbsences(personnel);
  await seedAffectations(personnel, stations);
  await seedConges(personnel);
  await seedPointages(personnel, newUsers);

  const allUsers = await User.find().select("_id");
  await seedNotifications(allUsers);

  console.log("\n✅ Seed complete.");
  console.log("New login accounts (password shown once):");
  console.log("  sara.gestionnaire / Gestion2000  (gestionnaire)");
  console.log(`  ${personnel[0].matricule} / Chef2000  (chef station @ ${stations[0].name})`);
  console.log(`  ${personnel[9].matricule} / Chef2000  (chef station @ ${stations[3].name})`);
  console.log("  4 pointage-only accounts / Pointage2000");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
