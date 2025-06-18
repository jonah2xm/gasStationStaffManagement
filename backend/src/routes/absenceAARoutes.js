// routes/absenceAA.routes.js
const express = require("express");
const router = express.Router();
const {
  createAbsenceAA,
  getAbsencesAA,
  getAbsenceAAById,
  deleteAbsenceAA,
  updateAbsenceAA,
} = require("../controllers/absenceAAController");

// Import the upload middleware
const upload = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");
// POST route to create a new Absence AA record.
// The upload.single("document") middleware handles file uploads.
router.post("/", upload.single("document"), createAbsenceAA);
router.get("/", ensureAuthenticated, getAbsencesAA);
router.get("/:id", ensureAuthenticated, getAbsenceAAById);
router.delete("/:id", ensureAuthenticated, deleteAbsenceAA);
router.put(
  "/:id",
  upload.single("document"), // process a single file upload if provided
  updateAbsenceAA
);

module.exports = router;
