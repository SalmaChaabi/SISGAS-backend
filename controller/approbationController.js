const approbationModel = require('../models/approbationSchema');
const userModel = require('../models/userShema');
const factureModel = require('../models/factureSchema');
const statutPaiementModel = require("../models/statutPaiementSchema");
const mongoose = require("mongoose");

//  Get all approbations with relations
module.exports.getAllApprobations = async (req, res) => {
    try {
      const approbations = await approbationModel.find()
        .populate('technicienradio')
        .populate({
          path: 'facture',
          populate: { path: 'statutpaiement', model: 'StatutPaiement' }
        });
      res.status(200).json(approbations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

//  Get approbation by ID
module.exports.getApprobationById = async (req, res) => {
    try {
        const id = req.params.id.trim();
        const approbation = await approbationModel.findById(id)
            .populate('technicienradio')
            .populate({
                path: 'facture',
                populate: { path: 'statutpaiement' }
            });

        if (!approbation) {
            return res.status(404).json({ message: "Approbation non trouvée" });
        }

        res.status(200).json(approbation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.createApprobation = async (req, res) => {
    try {
      const {
        date_approbation,
        nom_antenne,
        puissance_antenne,
        couple_frequence,
        type_equipement,
        position_GPS,
        technicienId,
        paye = false,
        validee = false,
        verifiee = false,
        date_echeance
      } = req.body;
  
      // Vérification puissance
      if (!puissance_antenne || puissance_antenne <= 0) {
        return res.status(400).json({ message: "La puissance doit être supérieure à zéro." });
      }
  
      const montant = puissance_antenne * 10;
      const now = new Date();
      const echeance = date_echeance ? new Date(date_echeance) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
      // Déterminer le statut
      let statutName = "En attente";
      let statutDescription = "La facture n'est pas encore payée mais toujours dans les délais.";
  
      if (montant <= 0) {
        statutName = "Erreur détectée";
        statutDescription = "Une incohérence a été détectée dans la facture.";
      } else if (paye) {
        statutName = "Payée";
        statutDescription = "La facture a été entièrement réglée dans les délais.";
      } else if (validee) {
        statutName = "Validée";
        statutDescription = "La facture a été validée par un responsable.";
      } else if (verifiee) {
        statutName = "Vérifiée";
        statutDescription = "La facture a été vérifiée et en attente de validation.";
      } else if (now > echeance) {
        statutName = "En retard";
        statutDescription = "La facture est en retard de paiement.";
      }
  
      // Nettoyage du champ name
      statutName = typeof statutName === "string" ? statutName.trim() : "Statut inconnu";
      if (!statutName) statutName = "Statut inconnu";
  
      // Vérifie si ce statut existe déjà
      let statut = await statutPaiementModel.findOne({ name: statutName });
  
      if (!statut) {
        statut = await statutPaiementModel.create({
          name: statutName,
          description: statutDescription,
          factures: []
        });
      }
  
      // Créer la facture
      const facture = await factureModel.create({
        montant,
        date_emission: now,
        date_echeance: echeance,
        paye,
        validee,
        verifiee,
        statutpaiement: statut._id
      });
  
      // Lier facture au statut
      statut.factures.push(facture._id);
      await statut.save();
  
      // Créer l'approbation
      const approbation = await approbationModel.create({
        date_approbation,
        nom_antenne,
        puissance_antenne,
        couple_frequence,
        type_equipement,
        position_GPS,
        technicienradio: technicienId,
        facture: facture._id
      });
  
      // Lier facture à l'approbation
      facture.approbation = approbation._id;
      await facture.save();
  
      // Lier approbation au technicien
      await userModel.findByIdAndUpdate(technicienId, {
        $push: { approbations: approbation._id }
      });
  
      res.status(201).json({
        message: "Approbation créée avec succès",
        approbation: {
          ...approbation.toObject(),
          facture: facture._id,
          technicienradio: technicienId,
          statutPaiement: statut._id
        }
      });
  
    } catch (error) {
      console.error("Erreur createApprobation:", error);
      res.status(500).json({ message: "Erreur lors de la création", error });
    }
  };
  
  
//  Update approbation
module.exports.updateApprobation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            date_approbation,
            nom_antenne,
            puissance_antenne,
            couple_frequence,
            type_equipement,
            position_GPS,
            technicienId
        } = req.body;

        const existing = await approbationModel.findById(id);
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Approbation non trouvée' });
        }

        if (puissance_antenne && puissance_antenne <= 0) {
            return res.status(400).json({ success: false, message: 'La puissance doit être positive' });
        }

        const updated = await approbationModel.findByIdAndUpdate(
            id,
            {
                date_approbation,
                nom_antenne,
                puissance_antenne,
                couple_frequence,
                type_equipement,
                position_GPS,
                technicienradio: technicienId
            },
            { new: true }
        );

        if (puissance_antenne) {
            const newMontant = puissance_antenne * 10;
            await factureModel.findOneAndUpdate(
                { approbation: id },
                { $set: { montant: newMontant } },
                { new: true }
            );
        }

        res.json({
            success: true,
            message: 'Approbation mise à jour avec succès',
            data: updated
        });
    } catch (error) {
        console.error('Erreur mise à jour approbation:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur lors de la mise à jour', error: error.message });
    }
};

module.exports.deleteApprobation = async (req, res) => {
    try {
      const { id } = req.params;
  
      //  Vérifier que l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "ID invalide" });
      }
  
      //  Récupérer l’approbation
      const approbation = await approbationModel.findById(id).populate({
        path: 'facture',
        populate: { path: 'statutpaiement' }
      });
  
      if (!approbation) {
        return res.status(404).json({ success: false, message: "Approbation non trouvée" });
      }
  
      const facture = approbation.facture;
      const statutPaiementId = facture?.statutpaiement?._id;
  
      //  Supprimer la facture
      if (facture) {
        await factureModel.findByIdAndDelete(facture._id);
  
        //  Retirer la facture de son statutPaiement
        if (statutPaiementId) {
          await statutPaiementModel.findByIdAndUpdate(statutPaiementId, {
            $pull: { factures: facture._id }
          });
        }
      }
  
      //  Retirer l’approbation du technicien
      await userModel.findByIdAndUpdate(approbation.technicienradio, {
        $pull: { approbations: id }
      });
  
      //  Supprimer l’approbation
      await approbationModel.findByIdAndDelete(id);
  
      res.status(200).json({
        success: true,
        message: "Approbation et éléments associés supprimés avec succès",
        deletedId: id
      });
  
    } catch (error) {
      console.error("Erreur suppression approbation:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression",
        error: error.message
      });
    }
  };
  

