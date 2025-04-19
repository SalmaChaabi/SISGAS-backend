var express = require('express');
var router = express.Router();
const factureController = require('../controller/factureController');

router.get('/getAllFactures',factureController.getAllFactures);
router.get('/getFactureById/:id',factureController.getFactureById);
router.get('/getFactureByApprobationId/:id',factureController.getFactureByApprobationId);
router.get('/getFacturesByStatutId/:id',factureController.getFacturesByStatutId);
router.post('/createFacture',factureController.createFacture);
router.put('/verifierFacture/:id',factureController.verifierFacture);
router.put('/validerFacture/:id',factureController.validerFacture);
//router.put('/notifierTechnicien/:id',factureController.notifierTechnicien);


module.exports = router;     

