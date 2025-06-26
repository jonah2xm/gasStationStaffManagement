// routes/absenceAA.routes.js
const express = require("express");
const router = express.Router();
const {
  createAffectation,
  getAbsenceTemp,
  getAffectationTemporaireById,
  updateAffectationTemporaire,
  deleteAffectationTemporaire,
} = require("../controllers/affectationTemporaire");
const upload = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/", upload.single("document"), createAffectation);
router.get("/", ensureAuthenticated, getAbsenceTemp);
router.get("/:id", getAffectationTemporaireById);
router.put("/:id", upload.single("document"), updateAffectationTemporaire);
router.delete("/:id", deleteAffectationTemporaire);
module.exports = router;
