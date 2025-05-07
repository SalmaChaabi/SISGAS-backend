const express = require("express");
const router = express.Router();
const notificationController = require('../controller/notificationController');

router.post("/createNotification", notificationController.createNotification);
router.get("/getNotificationsByUser/:userId", notificationController.getNotificationsByUser);
router.get("/getAllNotifications", notificationController.getAllNotifications);
router.put("/mark-read/:id", notificationController.markAsRead);
router.delete("/deleteNotification/:id", notificationController.deleteNotification);
router.delete("/deleteAllByUser/:userId", notificationController.deleteAllByUser);

module.exports = router;

