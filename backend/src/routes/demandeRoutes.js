const express = require("express");
const {
  createDemande,
  getDemandes,
  getResume,
  accepterDemande,
  refuserDemande,
  retirerDemande,
} = require("../controllers/demandeController");
const { ensureAuthenticated, exigerRoles } = require("../middleware/auth");

const router = express.Router();

const decideurs = exigerRoles("gestionnaire", "administrateur");
const chef = exigerRoles("chef station");

router.use(ensureAuthenticated);

router.get("/", getDemandes);
router.get("/resume", getResume);
router.post("/", chef, createDemande);
router.patch("/:id/accepter", decideurs, accepterDemande);
router.patch("/:id/refuser", decideurs, refuserDemande);
router.delete("/:id", chef, retirerDemande);

module.exports = router;
