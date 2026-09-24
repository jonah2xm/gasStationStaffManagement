// routes/congeRoutes.js
const express = require("express");
const multer = require("multer");
const {
  addConge,
  getAllConges,
  getCongeById,
  deleteConge,
  updateConge,
} = require("../controllers/congeController");

const { ensureAuthenticated, interdireChefStation } = require("../middleware/auth");
const { cloreDemandesApresSuppression } = require("../controllers/demandeController");

const router = express.Router();

// configure multer to store uploads in /uploads
const upload = require("../middleware/upload");

router.post("/", ensureAuthenticated, upload.single("document"), addConge);
router.get("/", ensureAuthenticated, getAllConges);
router.get("/:id", ensureAuthenticated, getCongeById);
router.delete(
  "/:id",
  ensureAuthenticated,
  interdireChefStation,
  cloreDemandesApresSuppression("Conge"),
  deleteConge
);
router.put("/:id", ensureAuthenticated, upload.single("document"), updateConge); // Reuse addConge for update

module.exports = router;
