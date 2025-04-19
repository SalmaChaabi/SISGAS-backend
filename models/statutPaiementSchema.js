const mongoose = require("mongoose");

const statutPaiementSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Empêche la duplication du même nom de statut
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  factures: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Facture"
    }
  ]
}, { timestamps: true }); // Pour createdAt et updatedAt automatiquement

module.exports = mongoose.model("StatutPaiement", statutPaiementSchema);

