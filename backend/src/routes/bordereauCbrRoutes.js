// routes/bordereauCbrRoutes.js
const express = require("express");
const router = express.Router();

const {
  getEnAttente,
  createBordereauCbr,
  getBordereauxCbr,
  getBordereauCbrById,
  annulerBordereauCbr,
  delivrerBordereauCbr,
} = require("../controllers/bordereauCbrController");

const { ensureAuthenticated } = require("../middleware/auth");

// Route fixe avant "/:id" pour ne pas être capturée par elle.
router.get("/en-attente", ensureAuthenticated, getEnAttente);

router.post("/", ensureAuthenticated, createBordereauCbr);
router.get("/", ensureAuthenticated, getBordereauxCbr);
router.get("/:id", ensureAuthenticated, getBordereauCbrById);
router.post("/:id/delivrer", ensureAuthenticated, delivrerBordereauCbr);
router.delete("/:id", ensureAuthenticated, annulerBordereauCbr);

module.exports = router;
