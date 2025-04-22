const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Veuillez entrer une adresse email valide."],
    },
    password: {
      type: String,
      required: true,
      minLength: 8,
      validate: {
        validator: function (value) {
          // ✅ Valide uniquement si le mot de passe est modifié (non hashé)
          if (!this.isModified("password")) return true;
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(value);
        },
        message:
          "Le mot de passe doit contenir au moins 8 caractères, une lettre majuscule, une lettre minuscule, un chiffre et un caractère spécial.",
      },
    },
    user_image: {
      type: String,
      default: "utilisateur.png",
    },
    etat: {
      type: Boolean,
      default: true,
    },

    approbations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Approbation",
      },
    ],

    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },

    reclamations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Reclamation",
      },
    ],
  },
  { timestamps: true }
);

// 🔐 Hasher le mot de passe avant enregistrement
userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("password")) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// 🗣 Message après enregistrement
userSchema.post("save", function () {
  console.log("✅ Nouvel utilisateur enregistré avec succès.");
});

// 🔐 Méthode de connexion statique
userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) return user;
    throw new Error("Mot de passe incorrect.");
  }
  throw new Error("Email introuvable.");
};

const User = mongoose.model("User", userSchema);
module.exports = User;


