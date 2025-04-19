const express = require('express');
const router = express.Router();
const statutPaiementController = require('../controller/statutPaiementController');

router.get('/getAllStatutsPaiement',statutPaiementController.getAllStatutsPaiement );
router.get('/getStatutPaiementById/:id',statutPaiementController.getStatutPaiementById );
router.get('/getStatutByFactureId/:id',statutPaiementController.getStatutByFactureId );
//router.post('/createStatutPaiement',statutPaiementController.createStatutPaiement );
router.put('/updateStatutPaiement/:id',statutPaiementController.updateStatutPaiement );
router.delete('/deleteStatutPaiement/:id',statutPaiementController.deleteStatutPaiement );
//  Route temporaire pour nettoyer les statuts invalides
router.delete('/clean-null', statutPaiementController.cleanStatutsNullName);


module.exports = router;
