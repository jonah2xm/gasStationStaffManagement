// routes/absenceRoutes.js
const express = require("express");
const router = express.Router();

const {
  createAbsence,
  getAbsences,
  getAbsenceById,
  updateAbsence,
  deleteAbsence,
  getNonAutoriseesAfter48h,
  streamAbsenceDocument,
} = require("../controllers/absenceController");

const upload = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");

// Les routes fixes passent avant "/:id" pour ne pas être capturées par elle.
router.get("/non-autorisees-48h", ensureAuthenticated, getNonAutoriseesAfter48h);
router.get("/document/:id", ensureAuthenticated, streamAbsenceDocument);

router.post("/", ensureAuthenticated, upload.single("document"), createAbsence);
router.get("/", ensureAuthenticated, getAbsences);
router.get("/:id", ensureAuthenticated, getAbsenceById);
router.put("/:id", ensureAuthenticated, upload.single("document"), updateAbsence);
router.delete("/:id", ensureAuthenticated, deleteAbsence);

module.exports = router;
