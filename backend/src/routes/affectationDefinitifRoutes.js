// routes/affectationDefinitif.routes.js
const express = require("express");
const router = express.Router();
const {
  createAffectationDefinitif,
  getAllAffectationsDefinitif,
  getAffectationDefinitifById,
  updateAffectationDefinitif,
  deleteAffectationDefinitif,
} = require("../controllers/affectationDefinitifController");
const upload = require("../middleware/upload");
const { ensureAuthenticated } = require("../middleware/auth");

// POST   /api/affectation-def
// Creates a new affectation définitive
router.post(
  "/",
  ensureAuthenticated,
  upload.single("document"),
  createAffectationDefinitif
);

// GET    /api/affectation-def
// Returns all affectations définitives
router.get("/", ensureAuthenticated, getAllAffectationsDefinitif);

// GET    /api/affectation-def/:id
// Returns a single affectation définitive by ID
router.get("/:id", ensureAuthenticated, getAffectationDefinitifById);

// PUT    /api/affectation-def/:id
// Updates an existing affectation définitive
router.put(
  "/:id",
  ensureAuthenticated,
  upload.single("document"),
  updateAffectationDefinitif
);

// DELETE /api/affectation-def/:id
// Deletes an affectation définitive
router.delete("/:id", ensureAuthenticated, deleteAffectationDefinitif);

module.exports = router;
