// middleware/upload.js
const multer = require("multer");

// Configure storage options
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure that the "uploads" directory exists.
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Create a unique file name
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Only accept PDF files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Le fichier doit être au format PDF"), false);
  }
};

// Set up the Multer middleware
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Maximum file size: 5 MB
});

module.exports = upload;
