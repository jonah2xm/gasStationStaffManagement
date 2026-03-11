const express = require("express");
const {
  registerNewUser,
  loginUser,
  resetPassword,
  deleteUser,
  updatePassword,
  getUsers,
  getAvailablePersonnel,
  createPersonnelAccount,
  updateUser
} = require("../controllers/userController");
const { ensureAuthenticated } = require("../middleware/auth");
const router = express.Router();


router.post("/login", loginUser);
router.patch("/reset-password/:id", resetPassword);
router.delete("/:id", deleteUser);
router.put("/updatePassword", ensureAuthenticated, updatePassword);
router.put("/:id", ensureAuthenticated, updateUser);
router.get('/', ensureAuthenticated, getUsers)
router.get("/available-personnel", ensureAuthenticated, getAvailablePersonnel);
router.post("/create-personnel-account", ensureAuthenticated, createPersonnelAccount);
router.post("/register", registerNewUser);

module.exports = router;
