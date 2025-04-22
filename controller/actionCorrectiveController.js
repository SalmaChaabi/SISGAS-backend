const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const reclamationModel = require("../models/reclamationShema");
const statutReclamationModel = require("../models/statutReclamationSchema");
const mongoose = require('mongoose');


exports.createActionCorrective = async (req, res) => {
    try {
      const { description, dateAction, reclamation, statutReclamation } = req.body;
  
      // Vérifier que les champs obligatoires existent
      if (!description || !reclamation || !statutReclamation) {
        return res.status(400).json({ message: "Champs requis manquants" });
      }
  
      // Vérifier que les IDs sont valides
      if (!mongoose.Types.ObjectId.isValid(reclamation) || !mongoose.Types.ObjectId.isValid(statutReclamation)) {
        return res.status(400).json({ message: "ID réclamation ou statutReclamation invalide" });
      }
  
      // Créer l'action corrective avec $push
      const newAction = await actionCorrectiveModel.create({
        description,
        dateAction: dateAction || Date.now(),
        reclamation,
        statutReclamation
      });

      // Mettre à jour les références avec $push (optimisé)
      await Promise.all([
        reclamationModel.findByIdAndUpdate(
          reclamation,
          { $push: { actionsCorrectives: newAction._id } }
        ),
        statutReclamationModel.findByIdAndUpdate(
          statutReclamation,
          { $push: { actionsCorrectives: newAction._id } }
        )
      ]);
  
      res.status(201).json(newAction);
    } catch (error) {
      console.error("Erreur lors de la création de l'action corrective :", error.message);
      res.status(500).json({ message: "Erreur serveur", error: error.message });
    }
};
exports.getAllActionsCorrectives = async (req, res) => {
    try {
      const actions = await actionCorrectiveModel.find().populate("reclamation").populate("statutReclamation");
      res.status(200).json(actions);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  exports.getActionCorrectiveById = async (req, res) => {
    try {
      const action = await actionCorrectiveModel.findById(req.params.id).populate("reclamation").populate("statutReclamation");
      if (!action) return res.status(404).json({ message: "Action non trouvée." });
      res.status(200).json(action);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  exports.getActionCorrectiveWithStatut = async (req, res) => {
      try {
        const action = await actionCorrectiveModel.findById(req.params.id)
          .populate({
            path: "reclamation",
            populate: { path: "statut" }
          });
    
        if (!action) {
          return res.status(404).json({ message: "Action corrective non trouvée." });
        }
    
        res.status(200).json(action);
      } catch (error) {
        res.status(500).json({ message: "Erreur serveur", error });
      }
    };
  
  exports.updateActionCorrective = async (req, res) => {
      try {
        const { id } = req.params;
        const { description, dateAction, reclamation, statutReclamation } = req.body;
    
        const updatedAction = await actionCorrectiveModel.findByIdAndUpdate(
          id,
          { description, dateAction, reclamation, statutReclamation },
          { new: true }
        );
    
        if (!updatedAction) {
          return res.status(404).json({ message: "Action corrective non trouvée" });
        }
    
        res.status(200).json(updatedAction);
      } catch (error) {
        console.error("Erreur lors de la mise à jour :", error);
        res.status(500).json({ message: "Erreur serveur", error });
      }
    };
  
  exports.deleteActionCorrective = async (req, res) => {
      try {
        const { id } = req.params;
    
        const action = await actionCorrectiveModel.findByIdAndDelete(id);
        if (!action) {
          return res.status(404).json({ message: "Action corrective non trouvée" });
        }
    
        // Supprimer la référence de la réclamation
        await reclamationModel.findByIdAndUpdate(
          action.reclamation,
          { $pull: { actionsCorrectives: action._id } }
        );
    
        // Supprimer la référence du statut de réclamation
        await statutReclamationModel.findByIdAndUpdate(
          action.statutReclamation,
          { $pull: { actionsCorrectives: action._id } }
        );
    
        res.status(200).json({ message: "Action corrective supprimée avec succès" });
    
      } catch (error) {
        console.error("Erreur lors de la suppression :", error);
        res.status(500).json({ message: "Erreur serveur", error });
      }
    };