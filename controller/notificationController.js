const Notification = require("../models/notificationShema");

//  Créer une notification
exports.createNotification = async ({ message, utilisateur, reclamation = null, actionCorrective = null }) => {
  try {
    const newNotif = new Notification({ message, utilisateur, reclamation, actionCorrective });
    await newNotif.save();
    console.log(" Notification envoyée !");
    return newNotif;
  } catch (error) {
    console.error(" Erreur lors de la création de la notification :", error);
    throw error;
  }
};

//  Récupérer toutes les notifications
exports.getAllNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find()
      .populate("utilisateur", "firstName lastName")
      .populate("reclamation")
      .populate("actionCorrective")
      .sort({ dateNotification: -1 });
    res.status(200).json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  Récupérer les notifications d’un utilisateur
exports.getNotificationsByUser = async (req, res) => {
  try {
    const notifs = await Notification.find({ utilisateur: req.params.userId })
      .populate("reclamation")
      .populate("actionCorrective")
      .sort({ dateNotification: -1 });
    res.status(200).json(notifs);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

//  Marquer une notification comme lue
exports.markAsRead = async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(req.params.id, { lu: true }, { new: true });
    res.status(200).json(notif);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



//Supprimer une notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Notification.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: " Notification non trouvée." });
    }

    res.status(200).json({ message: "✅ Notification supprimée avec succès." });
  } catch (error) {
    res.status(500).json({
      message: " Erreur lors de la suppression de la notification.",
      error,
    });
  }
};

//Supprimer toutes les notifications
exports.deleteAllByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await Notification.deleteMany({ utilisateur: userId });

    res.status(200).json({
      message: ` ${result.deletedCount} notification(s) supprimée(s) pour l'utilisateur.`,
    });
  } catch (error) {
    res.status(500).json({ message: " Erreur lors de la suppression des notifications.", error });
  }
};

