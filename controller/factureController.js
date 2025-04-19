const mongoose = require('mongoose');
const factureModel = require('../models/factureSchema');
const statutPaiementModel = require('../models/statutPaiementSchema'); // Ajoutez cette lign
const statutPaiementSchema = require('../models/statutPaiementSchema');




module.exports.createFacture = async (req, res) => {
  try {
    const { montant, date_echeance, date_emission } = req.body;

    const nouvelleFacture = new factureModel ({
      montant,
      date_echeance,
      date_emission, // facultatif si tu veux forcer une date précise
      // statut_paiement sera défini par défaut ("En attente")
    });

    const factureSauvegardée = await nouvelleFacture.save();

    res.status(201).json({
      message: 'Facture créée avec succès',
      facture: factureSauvegardée
    });

  } catch (error) {
    res.status(500).json({ error: error.message }); 
  }
};

  module.exports.getAllFactures = async (req, res) => {
    try {
      const factures = await factureModel.find().populate('statutpaiement','name').sort({ date_emission: -1 });
      res.status(200).json({ factures });
    } catch (error) {
      console.error(error)
      res.status(500).json({ message: error.message }); 
    }
  };

  module.exports.getFactureById = async (req, res) => {
    try {
      const facture = await factureModel.findById(req.params.id.trim()); // Enlève les espaces/retours à la ligne (.trim())
      if (!facture) return res.status(404).json({ message: 'Facture introuvable' });
      res.json(facture);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  module.exports.getFactureByApprobationId = async (req, res) => {
    try {
      const { id } = req.params;
      const facture = await factureModel.findOne({ approbation: id });
      const status = await statutPaiementSchema.findOne({_id:facture.statutpaiement})
      const facturFinal = ({...facture.toObject(),statutpaiement:status.name})
      console.log(status,id)

      if (!facture) {
        return res.status(404).json({ message: 'Aucune facture trouvée pour cette approbation' });
      }
      res.status(200).json({ facture :facturFinal});
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }; 

 

 
  
  module.exports.getFacturesByStatutId = async (req, res) => {
      try {
          // 1. Récupérer l'ID depuis les paramètres
          const statutId = req.params.id;
  
          // 2. Vérifier que l'ID est valide
          if (!mongoose.isValidObjectId(statutId)) {
              return res.status(400).json({
                  success: false,
                  message: "ID de statut invalide",
                  receivedId: statutId
              });
          }
  
          // 3. Chercher les factures correspondantes
          const factures = await factureModel.find({ statutpaiement: statutId })
              .select('montant date_emission date_echeance') // Champs à retourner
              .sort({ date_emission: -1 }); // Tri par date
  
          // 4. Retourner le résultat
          if (factures.length === 0) {
              return res.status(404).json({
                  success: false,
                  message: "Aucune facture trouvée pour ce statut"
              });
          }
  
          res.status(200).json({
              success: true,
              count: factures.length,
              factures
          });
  
      } catch (error) {
          console.error("Erreur:", error);
          res.status(500).json({
              success: false,
              message: "Erreur serveur",
              error: error.message
          });
      }
  };


  module.exports. verifierFacture = async (req, res) => {
    try {
      const { id } = req.params;
  
      const facture = await factureModel.findById(id);
      if (!facture) {
        return res.status(404).json({ message: 'Facture non trouvée' });
      }
  
      facture.statut_paiement = 'Vérifiée';
      await facture.save();
  
      res.status(200).json({ message: 'Facture vérifiée avec succès', facture });
  
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  module.exports. validerFacture = async (req, res) => {//modifier le statut de la facture
    try {
      const facture = await factureModel.findById(req.params.id);
      if (!facture) return res.status(404).json({ message: 'Facture introuvable' });
      const status = await statutPaiementModel.findOne({name:'Validée'})
  
      facture.statutpaiement =status._id;
      await facture.save();
      res.json(facture);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };

  // module.exports. notifierTechnicien = async (req, res) => {
  //   // Option 1 : ajouter une collection "notifications"
  //   // Option 2 : changer le statut à "Erreur détectée"
  //   try {
  //     const facture = await factureModel.findById(req.params.id);
  //     if (!facture) return res.status(404).json({ message: 'Facture introuvable' });
  
  //     facture.statut_paiement = 'Erreur détectée';
  //     await facture.save();
  //     res.json({ message: 'Technicien notifié', facture });
  //   } catch (error) {
  //     res.status(500).json({ error: error.message }); 
  //   }
  // };



