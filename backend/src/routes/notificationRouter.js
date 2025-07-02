const express = require("express");
const router = express.Router();
const {
  createNotification,
  getAndMarkLatestNotifications,
  getNotificationsOverview,
} = require("../controllers/notificationController");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/", createNotification);

router.get("/overview", ensureAuthenticated, getNotificationsOverview);

// On button click, get last 3 & mark them read
router.get("/latest", ensureAuthenticated, getAndMarkLatestNotifications);
module.exports = router;
