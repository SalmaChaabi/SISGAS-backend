const mongoose = require('mongoose');

const factureSchema = new mongoose.Schema({
  montant: {
    type: Number,
    required: true,
  },
  date_emission: {
    type: Date,
    required: true,
  },
  date_echeance: {
    type: Date,
    required: true,
  },

  statutpaiement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StatutPaiement', 
    required: true,
  },//one

  approbation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Approbation',
    required: false,
  },//one
}, { timestamps: true });

const Facture = mongoose.model("Facture", factureSchema);
module.exports = Facture;
