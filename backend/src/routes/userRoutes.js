const express = require("express");
const {
  registerUser,
  loginUser,
  resetPassword,
  deleteUser,
  updatePassword,
} = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.delete("/:id", deleteUser);
router.put("/updatePassword", ensureAuthenticated, updatePassword);

module.exports = router;
