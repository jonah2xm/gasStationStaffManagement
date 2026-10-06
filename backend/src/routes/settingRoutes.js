const express = require("express");
const { getContact, updateContact } = require("../controllers/settingController");
const { ensureAuthenticated, exigerRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/contact", getContact);
router.put("/contact", ensureAuthenticated, exigerRoles("administrateur"), updateContact);

module.exports = router;
