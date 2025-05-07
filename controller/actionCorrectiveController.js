const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const reclamationModel = require("../models/reclamationShema");
const statutReclamationModel = require("../models/statutReclamationSchema");
const mongoose = require('mongoose');
const notificationController = require("../controller/notificationController");
const Notification = require("../models/notificationShema");




exports.createActionCorrective = async (req, res) => {
  try {
    const { description, dateAction, reclamation, statutReclamation } = req.body;

    if (!description || !reclamation || !statutReclamation) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    if (
      !mongoose.Types.ObjectId.isValid(reclamation) ||
      !mongoose.Types.ObjectId.isValid(statutReclamation)
    ) {
      return res.status(400).json({ message: "ID réclamation ou statut invalide" });
    }

    // Étape 1 : créer l'action corrective SANS notification
    let newAction = await actionCorrectiveModel.create({
      description,
      dateAction: dateAction || Date.now(),
      reclamation,
      statutReclamation
    });

    // Étape 2 : mettre à jour les références
    await Promise.all([
      reclamationModel.findByIdAndUpdate(reclamation, {
        $push: { actionsCorrectives: newAction._id }
      }),
      statutReclamationModel.findByIdAndUpdate(statutReclamation, {
        $push: { actionsCorrectives: newAction._id }
      })
    ]);

    // Étape 3 : récupérer la réclamation avec l'utilisateur
    const reclamationDoc = await reclamationModel.findById(reclamation).populate("utilisateur");
    if (!reclamationDoc) {
      return res.status(404).json({ message: "Réclamation non trouvée" });
    }

    // Étape 4 : créer la notification
    const notification = await notificationController.createNotification({
      message: `Une nouvelle action corrective a été ajoutée à la réclamation : ${reclamationDoc.titre}`,
      utilisateur: reclamationDoc.utilisateur._id,
      reclamation: reclamationDoc._id,
      actionCorrective: newAction._id
    });

    // Étape 5 : mettre à jour l'action corrective avec l'ID de la notification
    newAction.notification = notification._id;
    await newAction.save(); // très important pour que le champ soit bien enregistré

    // Étape 6 : réponse avec l'action corrective mise à jour
    res.status(201).json({
      success: true,
      message: "Action corrective créée avec succès",
      data: newAction,
      notificationId: notification._id
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'action corrective :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};


exports.getAllActionsCorrectives = async (req, res) => {
    try {
      const actions = await actionCorrectiveModel.find().populate("reclamation").populate("statutReclamation").populate('notification');
      res.status(200).json(actions);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  exports.getActionCorrectiveById = async (req, res) => {
    try {
      const action = await actionCorrectiveModel.findById(req.params.id).populate("reclamation").populate("statutReclamation").populate("notification");
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
    exports.getActionsCorrectivesByReclamation = async (req, res) => {
        try {
          const { id } = req.params;
      
          if (!mongoose.Types.ObjectId.isValid(id)) {
            console.warn("⚠️ ID de réclamation invalide reçu :", id);
            return res.status(400).json({ message: "ID de réclamation invalide" });
          }
      
          const actions = await actionCorrectiveModel.find({ reclamation: id })
            .populate("reclamation")
            .populate("statutReclamation")
            .populate("notification");
      
          if (actions.length === 0) {
            return res.status(200).json({
              message: "Aucune action corrective trouvée pour cette réclamation.",
              data: []
            });
          }
      
          res.status(200).json(actions);
      
        } catch (error) {
          console.error("Erreur lors de la récupération des actions :", error.message);
          res.status(500).json({ message: "Erreur serveur", error: error.message });
        }
      };
      
      
      
  

      exports.updateActionCorrective = async (req, res) => {
        try {
          const { id } = req.params;
          const {
            description,
            dateAction,
            reclamation: newReclamationId,
            statutReclamation: newStatutId,
          } = req.body;
      
          // 1. Récupérer l'ancienne action corrective
          const oldAction = await actionCorrectiveModel.findById(id);
          if (!oldAction) {
            return res.status(404).json({ message: "Action corrective non trouvée" });
          }
      
          const oldReclamationId = oldAction.reclamation?.toString();
          const oldStatutId = oldAction.statutReclamation?.toString();
      
          // 2. Mettre à jour l'action corrective
          const updatedAction = await actionCorrectiveModel.findByIdAndUpdate(
            id,
            {
              description,
              dateAction,
              reclamation: newReclamationId,
              statutReclamation: newStatutId,
            },
            { new: true }
          );
      
          // 3. Mise à jour des références de réclamation
          if (newReclamationId && newReclamationId !== oldReclamationId) {
            if (oldReclamationId) {
              await reclamationModel.findByIdAndUpdate(oldReclamationId, {
                $pull: { actionsCorrectives: id },
              });
            }
      
            await reclamationModel.findByIdAndUpdate(newReclamationId, {
              $addToSet: { actionsCorrectives: id },
            });
          } else if (newReclamationId) {
            await reclamationModel.findByIdAndUpdate(newReclamationId, {
              $addToSet: { actionsCorrectives: id },
            });
          }
      
          // 4. Mise à jour du statut de réclamation + Notification
          if (newStatutId && newStatutId !== oldStatutId) {
            if (oldStatutId) {
              await statutReclamationModel.findByIdAndUpdate(oldStatutId, {
                $pull: { actionsCorrectives: id },
              });
            }
      
            await statutReclamationModel.findByIdAndUpdate(newStatutId, {
              $addToSet: { actionsCorrectives: id },
            });
      
            // 🔔 Créer la notification liée à l'utilisateur de la réclamation
            const reclamationDoc = await reclamationModel
              .findById(newReclamationId || oldReclamationId)
              .populate("utilisateur");
      
            if (reclamationDoc && reclamationDoc.utilisateur) {
              const notification = new Notification({
                message: `Le statut de l'action corrective "${description}" a été modifié.`,
                dateNotification: new Date(),
                lu: false,
                utilisateur: reclamationDoc.utilisateur._id,
                reclamation: reclamationDoc._id,
                actionCorrective: updatedAction._id,
              });
      
              await notification.save();
              console.log("✅ Notification créée");
            } else {
              console.warn("⚠️ Impossible de créer la notification : utilisateur non trouvé");
            }
          }
      
          res.status(200).json(updatedAction);
        } catch (error) {
          console.error("Erreur lors de la mise à jour :", error);
          res.status(500).json({ message: "Erreur serveur", error: error.message });
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