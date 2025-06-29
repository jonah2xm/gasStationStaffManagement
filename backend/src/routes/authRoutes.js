const express = require("express");
const { getMe } = require("../controllers/authController.js");
const router = express.Router();

router.get("/me", getMe);

module.exports = router;
