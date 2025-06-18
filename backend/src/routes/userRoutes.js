const express = require("express");
const {
  registerUser,
  loginUser,
  resetPassword,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/reset-password", resetPassword);
router.delete("/:id", deleteUser);

module.exports = router;
