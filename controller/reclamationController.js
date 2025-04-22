const reclamationModel = require("../models/reclamationShema");
const statutReclamationModel= require("../models/statutReclamationSchema");
const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const userModel = require("../models/userShema");
const roleModel = require("../models/roleSchema");

exports.createReclamation = async (req, res) => {
    try {
      const {
        titre,
        description,
        statut,
        utilisateur,
        role,
        actionsCorrectives,
        commentaireAdmin,
        fournisseurIntervenu,
        dateResolution,
      } = req.body;
  
      // Vérification des références
      const statutExiste = await statutReclamationModel.findById(statut);
      if (!statutExiste)
        return res.status(400).json({ message: "Statut non trouvé" });
  
      const utilisateurExiste = await userModel.findById(utilisateur);
      if (!utilisateurExiste)
        return res.status(400).json({ message: "Utilisateur non trouvé" });
  
      let roleExiste;
      if (role) {
        roleExiste = await roleModel.findById(role);
        if (!roleExiste)
          return res.status(400).json({ message: "Rôle non trouvé" });
      }
  
      if (actionsCorrectives && actionsCorrectives.length > 0) {
        for (let id of actionsCorrectives) {
          const actionExiste = await actionCorrectiveModel.findById(id);
          if (!actionExiste)
            return res
              .status(400)
              .json({ message: `Action corrective non trouvée : ${id}` });
        }
      }
  
      // Création de la réclamation
      const nouvelleReclamation = new reclamationModel({
        titre,
        description,
        statut,
        utilisateur,
        role,
        actionsCorrectives,
        commentaireAdmin,
        fournisseurIntervenu,
        dateResolution,
      });
  
      const savedReclamation = await nouvelleReclamation.save();
  
      //  Mise à jour des autres collections
  
      // Push fi user
      utilisateurExiste.reclamations = utilisateurExiste.reclamations || [];
      utilisateurExiste.reclamations.push(savedReclamation._id);
      await utilisateurExiste.save();
  
      // Push fi statut
      statutExiste.reclamations = statutExiste.reclamations || [];
      statutExiste.reclamations.push(savedReclamation._id);
      await statutExiste.save();
  
      // Push fi rôle (si fourni)
      if (roleExiste) {
        roleExiste.reclamations = roleExiste.reclamations || [];
        roleExiste.reclamations.push(savedReclamation._id);
        await roleExiste.save();
      }
  
      // Push fi actions correctives
      if (actionsCorrectives && actionsCorrectives.length > 0) {
        for (let id of actionsCorrectives) {
          const action = await actionCorrectiveModel.findById(id);
          action.reclamations = action.reclamations || [];
          action.reclamations.push(savedReclamation._id);
          await action.save();
        }
      }
  
      res.status(201).json({
        message: "Réclamation créée avec succès.",
        reclamation: savedReclamation,
      });
  
    } catch (error) {
      console.error("Erreur lors de la création de la réclamation :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // ✅ Récupérer toutes les réclamations
  exports.getAllReclamations = async (req, res) => {
    try {
      const reclamations = await reclamationModel
        .find()
        .populate("utilisateur")
        .populate("statut")
        .populate("actionsCorrectives")
        .populate("role");
  
      res.status(200).json(reclamations);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // ✅ Récupérer une seule réclamation par ID
  exports.getReclamationById = async (req, res) => {
    try {
      const reclamation = await reclamationModel
        .findById(req.params.id)
        .populate("utilisateur")
        .populate("statut")
        .populate("actionsCorrectives")
        .populate("role");
  
      if (!reclamation)
        return res.status(404).json({ message: "Réclamation non trouvée." });
  
      res.status(200).json(reclamation);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // ✅ Mettre à jour une réclamation
  exports.updateReclamation = async (req, res) => {
    try {
      // 1. Récupérer l'ID de la réclamation à mettre à jour
      const reclamation = await reclamationModel.findById(req.params.id);
      if (!reclamation) {
        return res.status(404).json({ message: "Réclamation non trouvée." });
      }
  
      // 2. Récupérer les données envoyées dans le body
      const {
        titre,
        description,
        statut,
        utilisateur,
        role,
        actionsCorrectives,
        commentaireAdmin,
        fournisseurIntervenu,
        dateResolution,
      } = req.body;
  
      // 3. Vérification des données de référence :
      // Vérification du statut
      if (statut) {
        const statutExiste = await statutReclamationModel.findById(statut);
        if (!statutExiste) {
          return res.status(400).json({ message: "Statut non trouvé" });
        }
      }
  
      // Vérification de l'utilisateur
      if (utilisateur) {
        const utilisateurExiste = await userModel.findById(utilisateur);
        if (!utilisateurExiste) {
          return res.status(400).json({ message: "Utilisateur non trouvé" });
        }
      }
  
      // Vérification du rôle si fourni
      if (role) {
        const roleExiste = await roleModel.findById(role);
        if (!roleExiste) {
          return res.status(400).json({ message: "Rôle non trouvé" });
        }
      }
  
      // Vérification des actions correctives si fournies
      if (actionsCorrectives && actionsCorrectives.length > 0) {
        for (let id of actionsCorrectives) {
          const actionExiste = await actionCorrectiveModel.findById(id);
          if (!actionExiste) {
            return res.status(400).json({ message: `Action corrective non trouvée : ${id}` });
          }
        }
      }
  
      // 4. Mise à jour de la réclamation avec les nouvelles données
      const updatedReclamation = await reclamationModel.findByIdAndUpdate(
        req.params.id,
        {
          titre,
          description,
          statut,
          utilisateur,
          role,
          actionsCorrectives,
          commentaireAdmin,
          fournisseurIntervenu,
          dateResolution,
        },
        { new: true, runValidators: true }
      );
  
      // 5. Retourner la réponse avec la réclamation mise à jour
      res.status(200).json({
        message: "Réclamation mise à jour avec succès.",
        reclamation: updatedReclamation,
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la réclamation :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  // ✅ Supprimer une réclamation
  exports.deleteReclamation = async (req, res) => {
    try {
      const reclamation = await reclamationModel.findById(req.params.id);
      if (!reclamation) {
        return res.status(404).json({ message: "Réclamation non trouvée." });
      }
  
      const { utilisateur, statut, role, actionsCorrectives } = reclamation;
  
      // Supprimer l'ID de la réclamation des autres collections
      if (utilisateur) {
        await userModel.findByIdAndUpdate(utilisateur, {
          $pull: { reclamations: reclamation._id },
        });
      }
  
      if (statut) {
        await statutReclamationModel.findByIdAndUpdate(statut, {
          $pull: { reclamations: reclamation._id },
        });
      }
  
      if (role) {
        await roleModel.findByIdAndUpdate(role, {
          $pull: { reclamations: reclamation._id },
        });
      }
  
      if (actionsCorrectives && actionsCorrectives.length > 0) {
        for (let actionId of actionsCorrectives) {
          await actionCorrectiveModel.findByIdAndUpdate(actionId, {
            $pull: { reclamations: reclamation._id },
          });
        }
      }
  
      //  Supprimer la réclamation elle-même
      await reclamationModel.findByIdAndDelete(req.params.id);
  
      res.status(200).json({ message: "Réclamation supprimée avec succès." });
    } catch (error) {
      console.error("Erreur suppression :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  




