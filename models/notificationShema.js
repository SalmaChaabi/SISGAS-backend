const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
  },
  dateNotification: {
    type: Date,
    default: Date.now,
  },

  lu: {
    type: Boolean,
    default: false,
  },

  utilisateur: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User",
    required: true,
  }, //(one): Many-to-One ==>(Une notification est liée à un seul utilisateur, mais un utilisateur peut avoir plusieurs notifications.)

  reclamation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reclamation",
    default: null,
  }, //one: One-to-One==>(Une notification peut être liée à une reclamation spécifique.)

  actionCorrective: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ActionCorrective",
  }, //one: 	One-to-One==>(Une notification peut être liée à une action corrective spécifique.)
});

module.exports = mongoose.model("Notification", notificationSchema);

