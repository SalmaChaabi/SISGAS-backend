const reclamationModel = require("../models/reclamationShema");
const statutReclamationModel= require("../models/statutReclamationSchema");
const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const userModel = require("../models/userShema");
const roleModel = require("../models/roleSchema");
const Notification = require("../models/notificationShema");
const { createNotification } = require("./notificationController"); // 🔁 adapte le chemin si besoin


exports.createReclamation = async (req, res) => {
  try {
    const {
      titre,
      description,
      statut,
      utilisateur,
      role,
      actionsCorrectives,
      Commentaireutilisateur,
      fournisseurIntervenu,
      dateResolution,
    } = req.body;

    // Vérification des références
    const statutExiste = await statutReclamationModel.findById(statut);
    if (!statutExiste)
      return res.status(400).json({ success: false, message: "Statut non trouvé" });

    const utilisateurExiste = await userModel.findById(utilisateur);
    if (!utilisateurExiste)
      return res.status(400).json({ success: false, message: "Utilisateur non trouvé" });

    let roleExiste;
    if (role) {
      roleExiste = await roleModel.findById(role);
      if (!roleExiste)
        return res.status(400).json({ success: false, message: "Rôle non trouvé" });
    }

    if (actionsCorrectives && actionsCorrectives.length > 0) {
      for (let id of actionsCorrectives) {
        const actionExiste = await actionCorrectiveModel.findById(id);
        if (!actionExiste)
          return res.status(400).json({
            success: false,
            message: `Action corrective non trouvée : ${id}`,
          });
      }
    }

    // Création de la réclamation sans notification pour le moment
    const nouvelleReclamation = new reclamationModel({
      titre,
      description,
      statut,
      utilisateur: utilisateurExiste._id,
      role,
      actionsCorrectives,
      Commentaireutilisateur,
      fournisseurIntervenu,
      dateResolution,
    });

    const savedReclamation = await nouvelleReclamation.save();

    // Créer une notification liée à cette réclamation
    const nouvelleNotification = await createNotification({
      message: `Nouvelle réclamation créée : ${titre}`,
      utilisateur,
      reclamation: savedReclamation._id,
    });

    // Ajouter l'ID de la notification dans l'utilisateur principal
    utilisateurExiste.notifications = utilisateurExiste.notifications || [];
    utilisateurExiste.notifications.push(nouvelleNotification._id);

    // Ajouter aussi la réclamation dans le champ user.reclamations
    utilisateurExiste.reclamations = utilisateurExiste.reclamations || [];
    utilisateurExiste.reclamations.push(savedReclamation._id);

    await utilisateurExiste.save();

    // Ajouter l'ID de la notification dans la réclamation
    savedReclamation.notification = nouvelleNotification._id;
    await savedReclamation.save();

    // Mise à jour du statut
    statutExiste.reclamations = statutExiste.reclamations || [];
    statutExiste.reclamations.push(savedReclamation._id);
    await statutExiste.save();

    // Mise à jour du rôle
    if (roleExiste) {
      roleExiste.reclamations = roleExiste.reclamations || [];
      roleExiste.reclamations.push(savedReclamation._id);
      await roleExiste.save();
    }

    // 🔁 Mise à jour des actions correctives et notifications pour chaque utilisateur associé
    if (actionsCorrectives && actionsCorrectives.length > 0) {
      for (let id of actionsCorrectives) {
        const action = await actionCorrectiveModel.findById(id).populate("utilisateur");

        // Lier la réclamation à l'action corrective
        action.reclamations = action.reclamations || [];
        if (!action.reclamations.includes(savedReclamation._id)) {
          action.reclamations.push(savedReclamation._id);
          await action.save();
        }

        // Ajouter la même notification dans le champ utilisateur.notifications
        const utilisateurAction = action.utilisateur;
        if (utilisateurAction) {
          utilisateurAction.notifications = utilisateurAction.notifications || [];
          if (!utilisateurAction.notifications.includes(nouvelleNotification._id)) {
            utilisateurAction.notifications.push(nouvelleNotification._id);
            await utilisateurAction.save();
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Réclamation créée avec succès.",
      data: savedReclamation,
    });

  } catch (error) {
    console.error("Erreur lors de la création de la réclamation :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

  //  Récupérer toutes les réclamations
  exports.getAllReclamations = async (req, res) => {
    try {
      const reclamations = await reclamationModel
        .find()
        .populate("utilisateur","firstName lastName")
        .populate("statut","nom")
        .populate("actionsCorrectives")
        .populate("role","name")
        .populate("notification")
  
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
        .populate("role")
        .populate("notification");
  
      if (!reclamation)
        return res.status(404).json({ message: "Réclamation non trouvée." });
  
      res.status(200).json(reclamation);
    } catch (error) {
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };
  
  //  Mettre à jour une réclamation

exports.updateReclamation = async (req, res) => {
  try {
    // 1. Récupérer l'ancienne réclamation
    const reclamation = await reclamationModel.findById(req.params.id).populate('statut utilisateur');
    if (!reclamation) {
      return res.status(404).json({ message: "Réclamation non trouvée." });
    }

    // 2. Extraire les données du body
    const {
      titre,
      description,
      statut,
      utilisateur,
      role,
      actionsCorrectives,
      Commentaireutilisateur,
      fournisseurIntervenu,
      dateResolution,
    } = req.body;

    // 3. Vérification des références
    let statutExiste = null;
    if (statut) {
      statutExiste = await statutReclamationModel.findById(statut);
      if (!statutExiste) {
        return res.status(400).json({ message: "Statut non trouvé" });
      }
    }

    if (utilisateur) {
      const utilisateurExiste = await userModel.findById(utilisateur);
      if (!utilisateurExiste) {
        return res.status(400).json({ message: "Utilisateur non trouvé" });
      }
    }

    if (role) {
      const roleExiste = await roleModel.findById(role);
      if (!roleExiste) {
        return res.status(400).json({ message: "Rôle non trouvé" });
      }
    }

    if (actionsCorrectives && actionsCorrectives.length > 0) {
      for (let id of actionsCorrectives) {
        const actionExiste = await actionCorrectiveModel.findById(id);
        if (!actionExiste) {
          return res.status(400).json({ message: `Action corrective non trouvée : ${id}` });
        }
      }
    }

    // 4. Vérifier si le statut a changé
    const statutChange = statut && statut !== String(reclamation.statut?._id);

    // 5. Mise à jour de la réclamation
    const updatedReclamation = await reclamationModel.findByIdAndUpdate(
      req.params.id,
      {
        titre,
        description,
        statut,
        utilisateur,
        role,
        actionsCorrectives,
        Commentaireutilisateur,
        fournisseurIntervenu,
        dateResolution,
      },
      { new: true, runValidators: true }
    );

    // 6. Créer une notification si le statut a changé
    if (statutChange && statutExiste) {
      const notification = new Notification({
        message: `Le statut de votre réclamation "${reclamation.titre}" a été mis à jour : ${statutExiste.nom}`,
        utilisateur: reclamation.utilisateur._id,
        reclamation: updatedReclamation._id,
        date: new Date(),
        lu: false,
      });

      await notification.save();
    }

    // 7. Répondre avec succès
    res.status(200).json({
      message: "Réclamation mise à jour avec succès.",
      reclamation: updatedReclamation,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la réclamation :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

  
  //  Supprimer une réclamation
  exports.deleteReclamation = async (req, res) => {
    try {
      const reclamationId = req.params.id;
  
      // 1. Vérifier si la réclamation existe
      const reclamation = await reclamationModel.findById(reclamationId);
      if (!reclamation) {
        return res.status(404).json({ message: "Réclamation non trouvée." });
      }
  
      const { utilisateur, statut, role, actionsCorrectives } = reclamation;
  
      // 2. Supprimer l'ID de la réclamation des autres collections
  
      // User
      if (utilisateur) {
        await userModel.findByIdAndUpdate(utilisateur, {
          $pull: { reclamations: reclamationId },
        });
      }
  
      // Statut
      if (statut) {
        await statutReclamationModel.findByIdAndUpdate(statut, {
          $pull: { reclamations: reclamationId },
        });
      }
  
      // Rôle
      if (role) {
        await roleModel.findByIdAndUpdate(role, {
          $pull: { reclamations: reclamationId },
        });
      }
  
      // 3. Supprimer la référence à la réclamation dans les actions correctives
      if (actionsCorrectives && actionsCorrectives.length > 0) {
        await actionCorrectiveModel.updateMany(
          { _id: { $in: actionsCorrectives } },
          { $unset: { reclamation: "" } } // ou $pull si tableau
        );
      }
  
      // 4. Supprimer les notifications liées à cette réclamation
      await Notification.deleteMany({ reclamation: reclamationId });
  
      // 5. Supprimer la réclamation elle-même
      await reclamationModel.findByIdAndDelete(reclamationId);
  
      res.status(200).json({ message: "Réclamation et ses dépendances supprimées avec succès." });
  
    } catch (error) {
      console.error("Erreur lors de la suppression de la réclamation :", error);
      res.status(500).json({ message: "Erreur serveur", error });
    }
  };