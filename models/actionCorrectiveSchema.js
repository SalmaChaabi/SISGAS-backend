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
  }

 
});

module.exports = mongoose.model("ActionCorrective", actionCorrectiveSchema);
