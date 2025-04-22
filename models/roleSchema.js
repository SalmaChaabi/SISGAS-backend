const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ], //many 
  reclamations: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reclamation",
    },
  ], // many (Many-to-One)
}, {
  timestamps: true,
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;
