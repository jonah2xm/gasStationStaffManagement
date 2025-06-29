// controllers/affectationDefinitif.js
const AffectationDefinitif = require("../models/affectatoinDefinitifModel");
const Personnel = require("../models/personnelModel");
const Station = require("../models/stationModel");

exports.createAffectationDefinitif = async (req, res) => {
  try {
    const {
      personnelId,
      startDate,
      originStation,
      affectedStation,
      description,
    } = req.body;

    // 1) Required fields
    if (!personnelId || !startDate || !originStation || !affectedStation) {
      return res.status(400).json({
        message: "Champs requis manquants pour l’affectation définitive.",
      });
    }

    // 2) Parse and fetch station docs
    const parsedStart = new Date(startDate);
    const [originDoc, affectedDoc] = await Promise.all([
      Station.findById(originStation),
      Station.findById(affectedStation),
    ]);
    if (!originDoc || !affectedDoc) {
      return res
        .status(404)
        .json({ message: "Origine ou station cible introuvable." });
    }

    // 3) Load personnel & ensure "Actif" if today ≥ startDate
    const today = new Date();
    const perso = await Personnel.findById(personnelId);
    if (!perso) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }
    if (today >= parsedStart && perso.status !== "Actif") {
      return res.status(400).json({
        message:
          "L'employé n'est pas actif à la date de début de l’affectation.",
      });
    }

    // 4) Overlap check vs existing definitive assignments
    const lastOther = await AffectationDefinitif.findOne({
      personnel: personnelId,
    })
      .sort({ startDate: -1 })
      .lean();
    if (lastOther) {
      const oStart = new Date(lastOther.startDate);
      const overlaps = parsedStart >= oStart;
      if (overlaps) {
        return res.status(409).json({
          message:
            "Cet employé a déjà une affectation définitive à partir de cette date.",
        });
      }
    }

    // 5) Build & save
    const assignData = {
      personnel: personnelId,
      startDate: parsedStart,
      originStation: originDoc._id,
      affectedStation: affectedDoc._id,
      description: description || "",
    };
    if (req.file) {
      assignData.document = req.file.path.replace(/\\/g, "/");
    }

    const newAssign = new AffectationDefinitif(assignData);
    const savedAssign = await newAssign.save();

    // 6) Update only the station fields on Personnel
    await Personnel.findByIdAndUpdate(personnelId, {
      station: affectedDoc._id,
      stationName: affectedDoc.name,
    });

    // 7) Respond
    return res.status(201).json({
      message: "Affectation définitive créée avec succès.",
      data: savedAssign,
    });
  } catch (err) {
    console.error("Erreur création affectation définitive :", err);
    return res.status(500).json({
      message:
        err.message ||
        "Erreur interne lors de la création de l'affectation définitive.",
    });
  }
};

exports.getAllAffectationsDefinitif = async (req, res) => {
  try {
    const affectations = await AffectationDefinitif.find()
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "_id name")
      .populate("affectedStation", "_id name")
      .sort({ startDate: -1 });

    return res.status(200).json(affectations);
  } catch (error) {
    console.error("Erreur récupération des affectations définitives :", error);
    return res.status(500).json({
      message: "Erreur lors de la récupération des affectations définitives.",
    });
  }
};

exports.getAffectationDefinitifById = async (req, res) => {
  try {
    const { id } = req.params;
    const affectation = await AffectationDefinitif.findById(id)
      .populate("personnel", "firstName lastName matricule")
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    if (!affectation) {
      return res
        .status(404)
        .json({ message: "Affectation définitive introuvable." });
    }

    return res.status(200).json(affectation);
  } catch (err) {
    console.error("Erreur récupération affectation définitive par ID :", err);
    return res.status(500).json({
      message: "Erreur lors de la récupération de l'affectation définitive.",
    });
  }
};

exports.updateAffectationDefinitif = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      personnelId,
      startDate,
      originStation,
      affectedStation,
      description,
    } = req.body;

    // 1) Fetch existing assignment
    const existing = await AffectationDefinitif.findById(id).lean();
    if (!existing) {
      return res
        .status(404)
        .json({ message: "Affectation définitive introuvable." });
    }

    // 2) Determine new startDate (or fallback)
    const newStart = startDate
      ? new Date(startDate)
      : new Date(existing.startDate);
    const today = new Date();

    // 3) If today >= newStart, enforce personnel.status === "Actif"
    const persoId = personnelId || existing.personnel;
    const perso = await Personnel.findById(persoId);
    if (!perso) {
      return res.status(404).json({ message: "Personnel non trouvé." });
    }
    if (today >= newStart && perso.status !== "Actif") {
      return res.status(400).json({
        message:
          "L'employé n'est pas actif à la date de début de l’affectation.",
      });
    }

    // 4) Check overlap vs other definitive assignments
    const other = await AffectationDefinitif.findOne({
      _id: { $ne: id },
      personnel: persoId,
    })
      .sort({ startDate: -1 })
      .lean();
    if (other) {
      const oStart = new Date(other.startDate);
      // Since definitives have no endDate, just ensure newStart > oStart
      if (newStart <= oStart) {
        return res.status(409).json({
          message:
            "Cet employé a déjà une affectation définitive à partir du " +
            oStart.toISOString().slice(0, 10) +
            ".",
        });
      }
    }

    // 5) Build updates
    const updates = {};
    if (personnelId) updates.personnel = persoId;
    if (startDate) updates.startDate = newStart;
    if (originStation) updates.originStation = originStation;
    if (affectedStation) updates.affectedStation = affectedStation;
    if (description !== undefined) updates.description = description;
    if (req.file) {
      // delete old PDF
      if (existing.document) {
        fs.unlink(path.resolve(existing.document), () => {});
      }
      updates.document = req.file.path.replace(/\\/g, "/");
    }

    // 6) Apply update
    const updated = await AffectationDefinitif.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    )
      .populate("originStation", "name")
      .populate("affectedStation", "name");

    // 7) If station changed, update personnel.station
    if (updates.affectedStation) {
      await Personnel.findByIdAndUpdate(persoId, {
        station: updated.affectedStation._id,
        stationName: updated.affectedStation.name,
      });
    }

    return res.status(200).json({
      message: "Affectation définitive mise à jour avec succès.",
      data: updated,
    });
  } catch (err) {
    console.error("Erreur updateAffectationDefinitif:", err);
    return res.status(500).json({
      message:
        err.message ||
        "Erreur interne lors de la mise à jour de l'affectation définitive.",
    });
  }
};

exports.deleteAffectationDefinitif = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AffectationDefinitif.findByIdAndDelete(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ message: "Affectation définitive introuvable." });
    }
    const originDoc = await Station.findById(deleted.originStation).lean();
    if (originDoc) {
      // 5) Update Personnel back to originStation
      await Personnel.findByIdAndUpdate(deleted.personnel, {
        station: originDoc._id,
        stationName: originDoc.name,
      });
    }
    return res
      .status(200)
      .json({ message: "Affectation définitive supprimée avec succès." });
  } catch (err) {
    console.error("Erreur suppression affectation définitive :", err);
    return res.status(500).json({
      message: "Erreur lors de la suppression de l'affectation définitive.",
    });
  }
};
