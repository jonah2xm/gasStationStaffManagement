// routes/congeRoutes.js
const express = require("express");
const multer = require("multer");
const {
  createRecuperation,
  getAllRecuperations,
  getRecuperationById,
  deleteRecuperation,
  updateRecuperation,
} = require("../controllers/recuperationController");
const { ensureAuthenticated } = require("../middleware/auth");

const router = express.Router();

// Multer setup: only PDF, max 5MB, stored in /uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Seuls les PDF sont autorisés"));
    }
    cb(null, true);
  },
});

// CREATE a new congé (with PDF upload)
router.post(
  "/",
  ensureAuthenticated,
  upload.single("document"), // field name must match your form
  createRecuperation
);

// READ all congés
router.get("/", ensureAuthenticated, getAllRecuperations);

// READ one congé by ID
router.get("/:id", ensureAuthenticated, getRecuperationById);

// UPDATE a congé (optionally replace the PDF)
router.put(
  "/:id",
  ensureAuthenticated,
  upload.single("document"),
  updateRecuperation
);

// DELETE a congé
router.delete("/:id", ensureAuthenticated, deleteRecuperation);

module.exports = router;
