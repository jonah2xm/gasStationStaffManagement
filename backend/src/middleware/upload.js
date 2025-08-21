// middleware/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// absolute uploads folder -> <project-root>/src/uploads
const uploadsDir = path.resolve(process.cwd(), "src", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("MULTER -> saving file to:", uploadsDir);
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    console.log("MULTER -> filename chosen:", filename);
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") cb(null, true);
  else cb(new Error("Le fichier doit être au format PDF"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
