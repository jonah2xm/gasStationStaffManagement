const cron = require("node-cron");
const { synchroniserAlertesSuivi } = require("../utils/suiviDocuments");

// Toutes les heures : notifications d'alerte du suivi des documents (congés
// CDD / CDI, absences et reprises). Les pages déclenchent aussi cette
// synchronisation, pour les hébergements où les tâches planifiées ne tournent pas.
cron.schedule("5 * * * *", async () => {
  try {
    const { crees } = await synchroniserAlertesSuivi({ force: true });
    console.log(`[CRON] Suivi des documents : ${crees} notification(s) créée(s).`);
  } catch (err) {
    console.error("[CRON] Suivi des documents :", err);
  }
});
