const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const reclamationModel = require("../models/reclamationShema");
const statutReclamationModel = require("../models/statutReclamationSchema");
const roleModel = require('../models/roleSchema'); 
const userModel = require('../models/userShema');
const mongoose = require('mongoose');
const notificationController = require("../controller/notificationController");
const Notification = require("../models/notificationShema");




exports.createActionCorrective = async (req, res) => {
  try {
    const {
      description,
      dateAction,
      reclamation,
      statutReclamation,
      utilisateur,
      role
    } = req.body;

    if (!description || !reclamation || !statutReclamation || !utilisateur || !role) {
      return res.status(400).json({ message: "Champs requis manquants" });
    }

    const idsValid = [reclamation, statutReclamation, utilisateur, role].every(id =>
      mongoose.Types.ObjectId.isValid(id)
    );
    if (!idsValid) {
      return res.status(400).json({ message: "Un ou plusieurs IDs sont invalides" });
    }

    // ✅ Étape 1 : créer l'action corrective
    const newAction = await actionCorrectiveModel.create({
      description,
      dateAction: dateAction || Date.now(),
      reclamation,
      statutReclamation,
      utilisateur,
      role
    });

    // ✅ Étape 2 : mettre à jour les références
    await Promise.all([
      reclamationModel.findByIdAndUpdate(reclamation, {
        $push: { actionsCorrectives: newAction._id }
      }),
      statutReclamationModel.findByIdAndUpdate(statutReclamation, {
        $push: { actionsCorrectives: newAction._id }
      }),
      userModel.findByIdAndUpdate(utilisateur, {
        $push: { actionsCorrectives: newAction._id }
      }),
      roleModel.findByIdAndUpdate(role, {
        $push: { actionsCorrectives: newAction._id }
      })
    ]);

   

    // ✅ Étape 4 : récupérer la réclamation avec l'utilisateur
    const reclamationDoc = await reclamationModel.findById(reclamation).populate("utilisateur");
    if (!reclamationDoc) {
      return res.status(404).json({ message: "Réclamation non trouvée" });
    }

    // ✅ Étape 5 : créer notification
    const notification = await notificationController.createNotification({
      message: `Une nouvelle action corrective a été ajoutée à la réclamation : ${reclamationDoc.titre}`,
      utilisateur: reclamationDoc.utilisateur._id,
      reclamation: reclamationDoc._id,
      actionCorrective: newAction._id
    });

    // ✅ Étape 6 : enregistrer notification dans action corrective
    newAction.notification = notification._id;
    await newAction.save();

    // ✅ Étape 7 : ajouter notification aux utilisateurs concernés
    await Promise.all([
      userModel.findByIdAndUpdate(utilisateur, {
        $push: { notifications: notification._id }
      }),
      userModel.findByIdAndUpdate(reclamationDoc.utilisateur._id, {
        $push: { notifications: notification._id }
      })
    ]);

    // ✅ Étape 8 : réponse avec action corrective complète
    const actionCorrectivePopulated = await actionCorrectiveModel.findById(newAction._id)
      .populate("utilisateur")
      .populate("role")
      .populate("statutReclamation");

    res.status(201).json({
      success: true,
      message: "Action corrective créée avec succès et statut réclamation mis à jour",
      data: actionCorrectivePopulated,
      notificationId: notification._id
    });

  } catch (error) {
    console.error("Erreur lors de la création de l'action corrective :", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};




exports.getAllActionsCorrectives = async (req, res) => {
    try {
      const actions = await actionCorrectiveModel.find().populate("reclamation").populate("statutReclamation").populate('notification').populate('utilisateur').populate('role');
      res.status(200).json(actions);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  exports.getActionCorrectiveById = async (req, res) => {
    try {
      const action = await actionCorrectiveModel.findById(req.params.id).populate("reclamation").populate("statutReclamation").populate("notification").populate('utilisateur').populate('role');
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
          populate: [
            { path: "statut" },
            { path: "utilisateur", model: userModel },
            { path: "role", model: roleModel }
          ]
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
            .populate("notification")
            .populate("utilisateur")
            .populate("role")
      
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
            utilisateur: newUtilisateurId,
            role: newRoleId,
          } = req.body;
      
          const oldAction = await actionCorrectiveModel.findById(id);
          if (!oldAction) {
            return res.status(404).json({ message: "Action corrective non trouvée" });
          }
      
          const oldReclamationId = oldAction.reclamation?.toString();
          const oldStatutId = oldAction.statutReclamation?.toString();
          const oldUserId = oldAction.utilisateur?.toString();
          const oldRoleId = oldAction.role?.toString();
      
          // Mettre à jour l'action corrective
          const updatedAction = await actionCorrectiveModel.findByIdAndUpdate(
            id,
            {
              description,
              dateAction,
              reclamation: newReclamationId,
              statutReclamation: newStatutId,
              utilisateur: newUtilisateurId,
              role: newRoleId,
            },
            { new: true }
          );
      
          // Références Réclamation
          if (newReclamationId && newReclamationId !== oldReclamationId) {
            if (oldReclamationId) {
              await reclamationModel.findByIdAndUpdate(oldReclamationId, {
                $pull: { actionsCorrectives: id },
              });
            }
            await reclamationModel.findByIdAndUpdate(newReclamationId, {
              $addToSet: { actionsCorrectives: id },
            });
          }
      
          // Références Statut
          if (newStatutId && newStatutId !== oldStatutId) {
            if (oldStatutId) {
              await statutReclamationModel.findByIdAndUpdate(oldStatutId, {
                $pull: { actionsCorrectives: id },
              });
            }
            await statutReclamationModel.findByIdAndUpdate(newStatutId, {
              $addToSet: { actionsCorrectives: id },
            });
          }
      
          // Références Utilisateur
          if (newUtilisateurId && newUtilisateurId !== oldUserId) {
            if (oldUserId) {
              await userModel.findByIdAndUpdate(oldUserId, {
                $pull: { actionsCorrectives: id },
              });
            }
            await userModel.findByIdAndUpdate(newUtilisateurId, {
              $addToSet: { actionsCorrectives: id },
            });
          }
      
          // Références Role
          if (newRoleId && newRoleId !== oldRoleId) {
            if (oldRoleId) {
              await roleModel.findByIdAndUpdate(oldRoleId, {
                $pull: { actionsCorrectives: id },
              });
            }
            await roleModel.findByIdAndUpdate(newRoleId, {
              $addToSet: { actionsCorrectives: id },
            });
          }
      
          // Notification liée au statut
          const reclamationDoc = await reclamationModel
            .findById(newReclamationId || oldReclamationId)
            .populate("utilisateur");
      
          if (reclamationDoc?.utilisateur) {
            const notification = new Notification({
              message: `Le statut de l'action corrective "${description}" a été modifié.`,
              dateNotification: new Date(),
              lu: false,
              utilisateur: reclamationDoc.utilisateur._id,
              reclamation: reclamationDoc._id,
              actionCorrective: updatedAction._id,
            });
      
            await notification.save();
      
            await userModel.findByIdAndUpdate(reclamationDoc.utilisateur._id, {
              $push: { notifications: notification._id },
            });
          }
      
          res.status(200).json({
            success: true,
            message: "Action corrective mise à jour avec succès.",
            data: updatedAction,
          });
        } catch (error) {
          console.error("Erreur updateActionCorrective :", error);
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
      
          // Supprimer références dans tous les modèles liés
          if (action.reclamation) {
            await reclamationModel.findByIdAndUpdate(action.reclamation, {
              $pull: { actionsCorrectives: action._id },
            });
          }
      
          if (action.statutReclamation) {
            await statutReclamationModel.findByIdAndUpdate(action.statutReclamation, {
              $pull: { actionsCorrectives: action._id },
            });
          }
      
          if (action.utilisateur) {
            await userModel.findByIdAndUpdate(action.utilisateur, {
              $pull: { actionsCorrectives: action._id },
            });
          }
      
          if (action.role) {
            await roleModel.findByIdAndUpdate(action.role, {
              $pull: { actionsCorrectives: action._id },
            });
          }
      
          if (action.notification) {
            await Notification.findByIdAndDelete(action.notification);
          }
      
          res.status(200).json({
            success: true,
            message: "Action corrective supprimée avec succès.",
          });
        } catch (error) {
          console.error("Erreur deleteActionCorrective :", error);
          res.status(500).json({ message: "Erreur serveur", error: error.message });
        }
      };
      