// routes/absenceAA.routes.js
const express = require("express");
const router = express.Router();
const {
  createAffectation,
  getAbsenceTemp,
  getAffectationTemporaireById,
  updateAffectationTemporaire,
} = require("../controllers/affectationTemporaire");
const upload = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/", upload.single("document"), createAffectation);
router.get("/", getAbsenceTemp);
router.get("/:id", getAffectationTemporaireById);
router.put("/:id", upload.single("document"), updateAffectationTemporaire);
module.exports = router;
