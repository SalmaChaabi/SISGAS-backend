
const mongoose = require("mongoose");

const statutReclamationSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true, // chaque nom de statut doit être unique
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
   reclamations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reclamation",
      },
    ], // many (One-to-Many:: un StatutReclamation peut être associé à plusieurs Reclamation, mais chaque Reclamation n’a qu’un seul StatutReclamation)


   //  Nouvelle relation : Liste des actions correctives liées à ce statut
   actionsCorrectives: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ActionCorrective",
    }
  ]


}, { timestamps: true });

module.exports = mongoose.model("StatutReclamation", statutReclamationSchema);