const mongoose = require("mongoose");

const actionCorrectiveSchema = new mongoose.Schema({
  description: String,
  dateAction: {
    type: Date,
    default: Date.now,
  },
  reclamation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Reclamation",
  },//one(One-to-Many)


  statutReclamation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StatutReclamation",
    required: true
  }, // One-to-Many : un statut peut être associé à plusieurs actions correctives

  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
    default: null
  },

  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  }, // one   // // Utilisateur lié à la réclamation

   role: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role",
      },//one   //// Rôle lié à la réclamation

}, { timestamps: true });

module.exports = mongoose.model("ActionCorrective", actionCorrectiveSchema);
