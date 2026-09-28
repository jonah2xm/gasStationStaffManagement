const express = require("express");
const router = express.Router();
const {
  createNotification,
  getAndMarkLatestNotifications,
  getNotificationsOverview,
  listNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notificationController");
const { ensureAuthenticated } = require("../middleware/auth");

router.post("/", createNotification);

router.get("/overview", ensureAuthenticated, getNotificationsOverview);

// On button click, get last 3 & mark them read
router.get("/latest", ensureAuthenticated, getAndMarkLatestNotifications);

router.get("/list-notifications", ensureAuthenticated, listNotifications);

router.patch("/mark-all-read", ensureAuthenticated, markAllAsRead);
router.patch("/:id/mark-read", ensureAuthenticated, markAsRead);
module.exports = router;
