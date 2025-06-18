// routes/congeRoutes.js
const express = require("express");
const multer = require("multer");
const {
  addConge,
  getAllConges,
  getCongeById,
  deleteConge,
} = require("../controllers/congeController");

const router = express.Router();

// configure multer to store uploads in /uploads
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Seuls les PDF sont autorisés"));
    }
    cb(null, true);
  },
});

router.post("/", upload.single("document"), addConge);
router.get("/", getAllConges);
router.get("/:id", getCongeById);
router.delete("/:id", deleteConge);

module.exports = router;
