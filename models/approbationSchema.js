const mongoose = require("mongoose");


const approbationSchema = new mongoose.Schema({
  date_approbation: {
    type: Date,
    required: true,
  },
  nom_antenne: {
    type: String,
    required: true,
    trim: true
  },
  puissance_antenne: {
    type: Number,
    required: true,
  },
  couple_frequence: {
    type: String,
    required: true,
    trim: true
  },
  type_equipement: {
    type: String,
    required: true,
    trim: true
  },
  position_GPS: {
    type: String,
    required: true,
    trim: true
  },




  technicienradio: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, //one
  //techniciensId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], exemple : many
  facture:{ type: mongoose.Schema.Types.ObjectId, ref: 'Facture'}, //one
  




}, {
  timestamps: true
});

module.exports = mongoose.model("Approbation", approbationSchema);