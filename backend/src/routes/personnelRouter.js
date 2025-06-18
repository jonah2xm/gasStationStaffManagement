const express = require("express");
const {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  statusUpdate,
} = require("../controllers/personnelController");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.get("/", ensureAuthenticated, getPersonnel);
router.get("/:id", ensureAuthenticated, getPersonnelById);
router.post("/", ensureAuthenticated, createPersonnel);
router.put("/:id", ensureAuthenticated, updatePersonnel);
router.delete("/:id", ensureAuthenticated, deletePersonnel);
// Update status route (PATCH is often used for partial updates)
router.patch("/:id/status", ensureAuthenticated, statusUpdate);

module.exports = router;
