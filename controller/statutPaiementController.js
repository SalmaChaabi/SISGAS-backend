const statutPaiementModel = require("../models/statutPaiementSchema");
const factureModel = require("../models/factureSchema");
const mongoose = require("mongoose");

// GET: Tous les statuts
module.exports.getAllStatutsPaiement = async (req, res) => {
  try {
    const statuts = await statutPaiementModel.find();
    res.status(200).json(statuts);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// GET: Un statut par ID
module.exports.getStatutPaiementById = async (req, res) => {
  try {
    const statut = await statutPaiementModel.findById(req.params.id);
    if (!statut) {
      return res.status(404).json({ message: "Statut non trouvé" });
    }
    res.status(200).json(statut);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// GET: Statut par ID de facture
module.exports.getStatutByFactureId = async (req, res) => {
  try {
    const { id: factureId } = req.params;

    const facture = await factureModel.findById(factureId).populate('statutpaiement');
    if (facture && facture.statutpaiement) {
      return res.status(200).json(facture.statutpaiement);
    }

    const statut = await statutPaiementModel.findOne({
      factures: new mongoose.Types.ObjectId(factureId),
    });

    if (statut) {
      return res.status(200).json(statut);
    }

    return res.status(404).json({ message: "Aucun statut trouvé pour cette facture" });
  } catch (error) {
    console.error("Erreur dans getStatutByFactureId:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// PUT: Mettre à jour un statut
module.exports.updateStatutPaiement = async (req, res) => {
  try {
    const updatedStatut = await statutPaiementModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStatut) {
      return res.status(404).json({ message: "Statut non trouvé" });
    }
    res.status(200).json(updatedStatut);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// DELETE: Supprimer un statut
module.exports.deleteStatutPaiement = async (req, res) => {
  try {
    const deleted = await statutPaiementModel.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Statut non trouvé" });
    }
    res.status(200).json({ message: "Statut supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// DELETE: Nettoyer les statuts sans nom
module.exports.cleanStatutsNullName = async (req, res) => {
  try {
    const result = await statutPaiementModel.deleteMany({ nom: null });
    res.status(200).json({
      message: `${result.deletedCount} statuts avec nom null supprimés.`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors du nettoyage des statuts",
      error,
    });
  }
};

  
