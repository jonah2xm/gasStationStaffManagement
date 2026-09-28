// controllers/demandeController.js
const DemandeAnnulation = require("../models/demandeAnnulationModel");
const { TYPES_DOCUMENT, STATUTS, MOTIF_MAX } = require("../models/demandeAnnulationModel");
const Absence = require("../models/absenceModel");
const Reprise = require("../models/repriseModel");
const Conge = require("../models/congeModel");
const Users = require("../models/userModel");
const Notification = require("../models/notificationModel");
const { verrouDocument, formatDate } = require("../utils/verrouEnvoi");
const { deleteAbsence } = require("./absenceController");
const { deleteReprise } = require("./repriseController");
const { deleteConge } = require("./congeController");

/**
 * Demandes d'annulation : le chef de station demande, le gestionnaire ou
 * l'administrateur décide. Accepter une demande supprime le document avec la
 * route de suppression habituelle, et donc ses effets (solde de congés rendu,
 * absences rouvertes, notifications).
 */

const ROLES_DECIDEURS = ["gestionnaire", "administrateur"];
const CHEF = "chef station";

const LIBELLES_MOTIF_ABSENCE = {
  maladie: "Maladie",
  "decés": "Décès",
  marriage: "Mariage",
  naissance: "Naissance",
  examen: "Examen",
  autre: "Autre",
  nonAutorisee: "Non autorisée",
};

const LIBELLES_CONGE = {
  ordinaire: "Congé ordinaire",
  anticipe: "Congé anticipé",
  recuperation: "Récupération",
};

const jours = (n) => `${n} jour${n > 1 ? "s" : ""}`;

/** Ce qu'il faut savoir de chaque type de document. */
const DOCUMENTS = {
  Absence: {
    charger: (id) => Absence.findById(id).populate("personnel", "firstName lastName matricule stationName"),
    personnel: (doc) => doc.personnel,
    apercu: (doc) => ({
      titre: "Avis d'absence",
      detail: [
        LIBELLES_MOTIF_ABSENCE[doc.motif] || doc.motif,
        `le ${formatDate(doc.date)}`,
        doc.duree ? jours(doc.duree) : null,
      ]
        .filter(Boolean)
        .join(" — "),
    }),
    supprimer: deleteAbsence,
  },
  Reprise: {
    charger: (id) => Reprise.findById(id).populate("personnel", "firstName lastName matricule stationName"),
    personnel: (doc) => doc.personnel,
    apercu: (doc) => {
      const n = (doc.absences || []).length;
      return {
        titre: "Avis de reprise",
        detail: `Reprise le ${formatDate(doc.dateReprise)} — clôture ${n} absence${n > 1 ? "s" : ""}`,
      };
    },
    supprimer: deleteReprise,
  },
  Conge: {
    charger: (id) => Conge.findById(id).populate("personnelId", "firstName lastName matricule stationName"),
    personnel: (doc) => doc.personnelId,
    apercu: (doc) => ({
      titre: LIBELLES_CONGE[doc.typeConge] || "Congé",
      detail: `Du ${formatDate(doc.dateDebut)} au ${formatDate(doc.dateRetour)} — ${jours(doc.dureeConge)}`,
    }),
    supprimer: deleteConge,
  },
};

const LIBELLE_TYPE = {
  Absence: "l'avis d'absence",
  Reprise: "l'avis de reprise",
  Conge: "la demande de congé",
};

/** Insère les notifications puis les émet via Socket.IO (rooms par utilisateur). */
async function createAndEmitNotifications(req, notifications) {
  if (!notifications.length) return;
  const inserted = await Notification.insertMany(notifications);

  const io = req.app.get("io");
  if (!io) return;
  inserted.forEach((n) => {
    io.to(`user:${String(n.personnel)}`).emit("notification:new", {
      _id: n._id,
      type: n.type,
      reference: n.reference,
      title: n.title,
      message: n.message,
      detailsUrl: n.detailsUrl,
      countIncrement: 1,
      createdAt: n.createdAt || new Date(),
    });
  });
}

async function notifier(req, destinataires, demande, title, message) {
  try {
    await createAndEmitNotifications(
      req,
      destinataires.map((id) => ({
        personnel: id,
        type: "Demande",
        reference: demande._id,
        title,
        message,
        detailsUrl: "/demandes",
      }))
    );
  } catch (err) {
    // La demande est enregistrée : une notification manquée ne doit pas l'annuler.
    console.warn("Notification de demande non envoyée :", err);
  }
}

const quoi = (demande) =>
  `${LIBELLE_TYPE[demande.typeDocument]} de ${demande.apercu.agent || "un agent"}`;

/** Station du chef de station connecté, ou null pour les autres rôles. */
async function stationDuChef(req) {
  const { role, id } = req.session.user || {};
  if (role !== CHEF) return null;
  const user = await Users.findById(id).select("occupiedStation").lean();
  return (user && user.occupiedStation) || "";
}

/**
 * Appelle un contrôleur existant (ici une route de suppression) et renvoie sa
 * réponse au lieu de l'écrire : { statut, body }.
 */
function executer(controleur, req, params) {
  return new Promise((resolve, reject) => {
    const fauxReq = Object.create(req);
    fauxReq.params = params;
    fauxReq.body = {};
    fauxReq.file = undefined;

    let statut = 200;
    let fini = false;
    const terminer = (body) => {
      if (fini) return;
      fini = true;
      resolve({ statut, body: body || {} });
    };
    const fauxRes = {
      status(code) {
        statut = code;
        return this;
      },
      json: terminer,
      send: terminer,
      end: () => terminer(),
    };

    Promise.resolve(controleur(fauxReq, fauxRes, reject))
      .then(() => {
        if (!fini) {
          statut = 500;
          terminer({ message: "La suppression n'a pas répondu." });
        }
      })
      .catch(reject);
  });
}

// POST /api/demandes — chef de station
exports.createDemande = async (req, res) => {
  try {
    const { typeDocument, documentId } = req.body || {};
    const motif = String((req.body && req.body.motif) || "").trim();

    const type = DOCUMENTS[typeDocument];
    if (!type) {
      return res.status(400).json({ message: "Type de document invalide." });
    }
    if (!motif) {
      return res.status(400).json({ message: "Indiquez le motif de l'annulation." });
    }
    if (motif.length > MOTIF_MAX) {
      return res
        .status(400)
        .json({ message: `Le motif ne peut pas dépasser ${MOTIF_MAX} caractères.` });
    }

    const doc = await type.charger(documentId).catch(() => null);
    if (!doc) {
      return res.status(404).json({ message: "Document introuvable." });
    }

    const personnel = type.personnel(doc);
    const station = (personnel && personnel.stationName) || doc.stationName || "";
    if (station !== (await stationDuChef(req))) {
      return res
        .status(403)
        .json({ message: "Ce document ne concerne pas un agent de votre station." });
    }

    const verrou = await verrouDocument(typeDocument, doc);
    if (verrou) {
      const date = formatDate(verrou.bordereau.createdAt);
      return res.status(423).json({
        code: "DOCUMENT_ENVOYE",
        message: verrou.parReprise
          ? `Cette absence est reprise dans un avis de reprise envoyé sur le bordereau du ${date}. Annulez ce bordereau depuis la page Envois avant de demander son annulation.`
          : `Ce document figure sur le bordereau d'envoi du ${date}. Annulez ce bordereau depuis la page Envois avant de demander son annulation.`,
      });
    }

    const enAttente = await DemandeAnnulation.exists({
      typeDocument,
      document: doc._id,
      statut: "en_attente",
    });
    if (enAttente) {
      return res
        .status(409)
        .json({ message: "Une demande d'annulation est déjà en attente pour ce document." });
    }

    const demande = await DemandeAnnulation.create({
      typeDocument,
      document: doc._id,
      stationName: station,
      apercu: {
        agent: personnel ? `${personnel.lastName} ${personnel.firstName}` : "",
        matricule: (personnel && personnel.matricule) || "",
        ...type.apercu(doc),
      },
      motif,
      demandeur: req.session.user.id,
    });

    const decideurs = await Users.find({ role: { $in: ROLES_DECIDEURS } })
      .select("_id")
      .lean();
    await notifier(
      req,
      decideurs.map((u) => u._id),
      demande,
      "Demande d'annulation",
      `${station} demande l'annulation de ${quoi(demande)} : « ${motif} »`
    );

    return res.status(201).json(demande);
  } catch (err) {
    if (err && err.code === 11000) {
      return res
        .status(409)
        .json({ message: "Une demande d'annulation est déjà en attente pour ce document." });
    }
    console.error("Erreur création demande d'annulation :", err);
    return res.status(500).json({ message: err.message || "Erreur lors de la demande" });
  }
};

// GET /api/demandes?statut=en_attente&typeDocument=Conge
exports.getDemandes = async (req, res) => {
  try {
    const query = {};
    const station = await stationDuChef(req);
    if (station !== null) query.stationName = station;
    if (STATUTS.includes(req.query.statut)) query.statut = req.query.statut;
    if (TYPES_DOCUMENT.includes(req.query.typeDocument)) {
      query.typeDocument = req.query.typeDocument;
    }

    const demandes = await DemandeAnnulation.find(query)
      .sort({ createdAt: -1 })
      .populate("demandeur", "username")
      .populate("decisionPar", "username role")
      .lean();
    return res.json(demandes);
  } catch (err) {
    console.error("Erreur liste des demandes :", err);
    return res.status(500).json({ message: err.message });
  }
};

// GET /api/demandes/resume — pastille du menu
exports.getResume = async (req, res) => {
  try {
    const query = { statut: "en_attente" };
    const station = await stationDuChef(req);
    if (station !== null) query.stationName = station;
    return res.json({ nbEnAttente: await DemandeAnnulation.countDocuments(query) });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

async function demandeEnAttente(req, res) {
  const demande = await DemandeAnnulation.findById(req.params.id).catch(() => null);
  if (!demande) {
    res.status(404).json({ message: "Demande introuvable." });
    return null;
  }
  if (demande.statut !== "en_attente") {
    res.status(409).json({ message: "Cette demande a déjà été traitée." });
    return null;
  }
  return demande;
}

/** Demande telle que la liste l'affiche (noms du demandeur et du décideur). */
const peupler = (demande) =>
  demande.populate([
    { path: "demandeur", select: "username" },
    { path: "decisionPar", select: "username role" },
  ]);

const lireCommentaire = (req) =>
  String((req.body && req.body.commentaire) || "").trim().slice(0, MOTIF_MAX);

// PATCH /api/demandes/:id/accepter — gestionnaire, administrateur
exports.accepterDemande = async (req, res) => {
  try {
    const demande = await demandeEnAttente(req, res);
    if (!demande) return;

    // Même suppression que le bouton Supprimer : verrou d'envoi compris.
    const resultat = await executer(DOCUMENTS[demande.typeDocument].supprimer, req, {
      id: String(demande.document),
    });
    if (resultat.statut >= 400) {
      return res.status(resultat.statut).json({
        ...resultat.body,
        message:
          resultat.statut === 404
            ? "Le document n'existe plus. Refusez cette demande pour la clôturer."
            : resultat.body.message || "La suppression du document a échoué.",
      });
    }

    demande.statut = "acceptee";
    demande.decisionPar = req.session.user.id;
    demande.decisionLe = new Date();
    demande.commentaire = lireCommentaire(req);
    await demande.save();

    await notifier(
      req,
      [demande.demandeur],
      demande,
      "Annulation acceptée",
      `Votre demande d'annulation de ${quoi(demande)} a été acceptée : le document a été supprimé.`
    );

    return res.json(await peupler(demande));
  } catch (err) {
    console.error("Erreur acceptation demande :", err);
    return res.status(500).json({ message: err.message });
  }
};

// PATCH /api/demandes/:id/refuser — gestionnaire, administrateur
exports.refuserDemande = async (req, res) => {
  try {
    const demande = await demandeEnAttente(req, res);
    if (!demande) return;

    demande.statut = "refusee";
    demande.decisionPar = req.session.user.id;
    demande.decisionLe = new Date();
    demande.commentaire = lireCommentaire(req);
    await demande.save();

    await notifier(
      req,
      [demande.demandeur],
      demande,
      "Annulation refusée",
      `Votre demande d'annulation de ${quoi(demande)} a été refusée${demande.commentaire ? ` : « ${demande.commentaire} »` : "."}`
    );

    return res.json(await peupler(demande));
  } catch (err) {
    console.error("Erreur refus demande :", err);
    return res.status(500).json({ message: err.message });
  }
};

// DELETE /api/demandes/:id — le chef de station retire une demande en attente
exports.retirerDemande = async (req, res) => {
  try {
    const demande = await demandeEnAttente(req, res);
    if (!demande) return;
    if (demande.stationName !== (await stationDuChef(req))) {
      return res.status(403).json({ message: "Cette demande ne concerne pas votre station." });
    }
    await demande.deleteOne();
    return res.json({ message: "Demande retirée." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/**
 * À placer sur les routes DELETE des documents : un document supprimé
 * directement par un gestionnaire clôt la demande d'annulation en attente.
 */
exports.cloreDemandesApresSuppression = (typeDocument) => (req, res, next) => {
  res.on("finish", async () => {
    if (res.statusCode >= 300) return;
    try {
      const demande = await DemandeAnnulation.findOneAndUpdate(
        { typeDocument, document: req.params.id, statut: "en_attente" },
        {
          statut: "acceptee",
          decisionPar: req.session?.user?.id || null,
          decisionLe: new Date(),
          commentaire: "Document supprimé directement.",
        },
        { new: true }
      );
      if (demande) {
        await notifier(
          req,
          [demande.demandeur],
          demande,
          "Annulation acceptée",
          `Le document de votre demande d'annulation (${quoi(demande)}) a été supprimé : la demande est clôturée.`
        );
      }
    } catch (err) {
      console.warn("Clôture des demandes après suppression :", err);
    }
  });
  next();
};
