const express = require("express");
const {
  registerNewUser,
  loginUser,
  resetPassword,
  deleteUser,
  updatePassword,
  getUsers
} = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();


router.post("/login", loginUser);
router.patch("/reset-password/:id", resetPassword);
router.delete("/:id", deleteUser);
router.put("/updatePassword", ensureAuthenticated, updatePassword);
router.get('/',ensureAuthenticated,getUsers)
router.post("/register", registerNewUser);

module.exports = router;
