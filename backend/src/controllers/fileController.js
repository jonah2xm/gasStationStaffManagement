const fs = require("fs");
const path = require("path");
const Recuperation = require("../models/recuperationModel"); // ↩️ swap this for Conge, AbsenceAA, etc. as needed

/**
 * Stream the PDF associated with a Recuperation by its record ID.
 * URL: GET /api/documents/recuperation/:id
 */
exports.streamRecuperationDocument = async (req, res, next) => {
  try {
    // 1) Find the record to get its stored file path
    const recup = await Recuperation.findById(req.params.id).lean();
    if (!recup || !recup.documentPath) {
      return res.status(404).json({ message: "Document introuvable" });
    }

    // 2) Resolve the full filesystem path
    const fullPath = path.resolve(recup.documentPath);
    if (!fs.existsSync(fullPath)) {
      return res
        .status(404)
        .json({ message: "Fichier manquant sur le serveur" });
    }

    // 3) Set the PDF content type and pipe the file
    res.type("application/pdf");
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    next(err);
  }
};
