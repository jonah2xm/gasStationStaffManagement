const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); // multer middleware
const {
  createAbsenceAI,
  getAllAbsenceAI,
  getAbsenceAIById,
  deleteAbsenceAI,
  updateEndDate,
  getAIAfter48h,
  getAvisAbsence
} = require("../controllers/absenceAIController");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/", upload.single("document"), createAbsenceAI);
router.get("/getAI-48h", ensureAuthenticated, getAIAfter48h);
router.get("/getAI-only", getAvisAbsence);
router.get("/", ensureAuthenticated, getAllAbsenceAI);
router.get("/:id", ensureAuthenticated, getAbsenceAIById);
router.delete("/:id", ensureAuthenticated, deleteAbsenceAI);
router.patch("/:id", ensureAuthenticated, updateEndDate);

module.exports = router;
