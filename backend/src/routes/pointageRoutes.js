const express = require("express");
const {
    recordPointage,
    getPointages,
    createPointage,
    updatePointage,
    deletePointage,
    getPointageById
} = require("../controllers/pointageController");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.post("/", recordPointage); // Public Tap
router.get("/", ensureAuthenticated, getPointages);
router.get("/:id", ensureAuthenticated, getPointageById);
router.post("/manual", ensureAuthenticated, createPointage);
router.put("/:id", ensureAuthenticated, updatePointage);
router.delete("/:id", ensureAuthenticated, deletePointage);

module.exports = router;
