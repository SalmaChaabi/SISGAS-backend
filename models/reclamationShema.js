const mongoose = require("mongoose");

const ReclamationSchema = new mongoose.Schema({
  titre: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  statut: {
    type: String,
    enum: ["envoyée", "en cours", "résolue", "escaladée"],
    default: "envoyée",
  },
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  dateResolution: Date,
  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  actionsCorrectives: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActionCorrective",
    },
  ],
//   commentaireAdmin: {
//     type: String,
//   },
//   fournisseurIntervenu: {
//     type: Boolean,
//     default: false,
//   },
  // facultatif si tu veux avoir le lien direct avec le rôle de l'utilisateur
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  },
});

module.exports = mongoose.model("Reclamation", ReclamationSchema);
