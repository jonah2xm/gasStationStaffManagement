// routes/bordereauRoutes.js
const express = require("express");
const router = express.Router();

const {
  getEnAttente,
  createBordereau,
  getBordereaux,
  getBordereauById,
  annulerBordereau,
} = require("../controllers/bordereauController");

const { ensureAuthenticated } = require("../middleware/auth");

// Route fixe avant "/:id" pour ne pas être capturée par elle.
router.get("/en-attente", ensureAuthenticated, getEnAttente);

router.post("/", ensureAuthenticated, createBordereau);
router.get("/", ensureAuthenticated, getBordereaux);
router.get("/:id", ensureAuthenticated, getBordereauById);
router.delete("/:id", ensureAuthenticated, annulerBordereau);

module.exports = router;
