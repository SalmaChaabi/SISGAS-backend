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
 
  dateCreation: {
    type: Date,
    default: Date.now,
  },
  dateResolution: Date,

  commentaireAdmin: {
    type: String,
  },
  fournisseurIntervenu: {
    type: Boolean,
    default: false,
  },

  statut: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StatutReclamation", 
    required: true,
  }, //one (One-to-Many) (Plusieurs réclamations peuvent avoir le même statut (ex: "envoyée")

  utilisateur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  }, //one (Many to One) (Reclamation → User : relation Many to One (un utilisateur peut avoir plusieurs réclamations)
  actionsCorrectives: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActionCorrective",
    },
  ], //many (One-to-Many) (Reclamation → ActionCorrective : une réclamation peut avoir plusieurs actions correctives)


  // facultatif si tu veux avoir le lien direct avec le rôle de l'utilisateur
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Role",
  }, // one (Many-to-One)
});



module.exports = mongoose.model("Reclamation", ReclamationSchema);

