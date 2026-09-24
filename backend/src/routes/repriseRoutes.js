// routes/repriseRoutes.js
const express = require("express");
const router = express.Router();

const {
  createReprise,
  getReprises,
  getRepriseById,
  updateReprise,
  deleteReprise,
  getEligibles,
} = require("../controllers/repriseController");

const { ensureAuthenticated, interdireChefStation } = require("../middleware/auth");
const { cloreDemandesApresSuppression } = require("../controllers/demandeController");

// Route fixe avant "/:id" pour ne pas être capturée par elle.
router.get("/eligibles", ensureAuthenticated, getEligibles);

router.post("/", ensureAuthenticated, createReprise);
router.get("/", ensureAuthenticated, getReprises);
router.get("/:id", ensureAuthenticated, getRepriseById);
router.put("/:id", ensureAuthenticated, updateReprise);
router.delete(
  "/:id",
  ensureAuthenticated,
  interdireChefStation,
  cloreDemandesApresSuppression("Reprise"),
  deleteReprise
);

module.exports = router;
