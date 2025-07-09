const Notification = require("../models/notificationModel");

// Create a new notification
exports.createNotification = async (req, res) => {
  try {
    const notif = await Notification.create(req.body);
    res.status(201).json({ success: true, data: notif });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all notifications (optionally filter by personnel)
exports.getNotifications = async (req, res) => {
  const filter = {};
  if (req.query.personnel) filter.personnel = req.query.personnel;

  try {
    const notifs = await Notification.find(filter)
      .sort("-createdAt")
      .populate("personnel", "name status");
    res.status(200).json({ success: true, data: notifs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Mark a notification as read
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: notif });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(204).json({ success: true, data: null });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * @desc    Get notifications overview for the current user
 *          (total count and unread count)
 * @route   GET /api/notifications/overview
 * @access  Private
 */
exports.getNotificationsOverview = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // total notifications
    const total = await Notification.countDocuments({ personnel: userId });

    // unread notifications
    const unread = await Notification.countDocuments({
      personnel: userId,
      seen: false,
    });

    return res.status(200).json({
      success: true,
      data: { total, unread },
    });
  } catch (err) {
    console.error("Error in getNotificationsOverview:", err);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

/**
 * @desc    Fetch the last 3 notifications for the current user
 *          and mark those 3 as read
 * @route   GET /api/notifications/latest
 * @access  Private
 */
exports.getAndMarkLatestNotifications = async (req, res) => {
  try {
    const userId = req.session.user.id;

    // 1. Fetch the last 3 notifications (newest first)
    //    .lean() so we can map IDs easily
    const latest = await Notification.find({ personnel: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    if (latest.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // 2. Mark those as read
    const ids = latest.map((n) => n._id);
    await Notification.updateMany(
      { _id: { $in: ids } },
      { $set: { seen: true, seenAt: new Date() } }
    );

    // 3. Re-fetch the updated docs so `seen: true` shows up
    const updated = await Notification.find({ _id: { $in: ids } }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (err) {
    console.error("Error in getAndMarkLatestNotifications:", err);
    return res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

exports.listNotifications = async (req, res) => {
  try {
    const userId = req.session.user.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "Utilisateur non authentifié" });
    }

    // pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const skip = (page - 1) * limit;

    // base filter
    const filter = { personnel: userId };

    // search
    if (req.query.search) {
      filter.message = { $regex: req.query.search, $options: "i" };
    }
    // types filter
    if (req.query.types) {
      filter.type = { $in: req.query.types.split(",") };
    }
    // read/unread filter
    if (req.query.status === "read") filter.seen = true;
    if (req.query.status === "unread") filter.seen = false;

    // sort
    const sortKey = req.query.sortKey || "createdAt";
    const sortDir = req.query.sortDir === "asc" ? 1 : -1;
    const sortObj = { [sortKey]: sortDir };

    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: {
        notifications,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Error in listNotifications:", err);
    res.status(500).json({ success: false, error: "Erreur serveur" });
  }
};
