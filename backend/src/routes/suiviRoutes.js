// routes/suiviRoutes.js
const express = require("express");
const router = express.Router();

const {
  getSuivi,
  getResume,
  changerStatut,
  receptionnerBordereau,
  annulerReception,
} = require("../controllers/suiviController");

const { ensureAuthenticated } = require("../middleware/auth");

router.get("/", ensureAuthenticated, getSuivi);
router.get("/resume", ensureAuthenticated, getResume);
router.patch("/statut", ensureAuthenticated, changerStatut);
router.post("/bordereaux/:id/reception", ensureAuthenticated, receptionnerBordereau);
router.post("/bordereaux/:id/annulation-reception", ensureAuthenticated, annulerReception);

module.exports = router;
