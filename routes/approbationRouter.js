var express = require('express');
var router = express.Router();
const approbationController = require('../controller/approbationController');
const authMiddleware = require("../middlewares/authMiddleware"); // Importer l'auth middleware



router.get('/getAllApprobations',approbationController.getAllApprobations);
router.get('/getApprobation/:id',approbationController.getApprobationById);
router.put('/updateApprobation/:id',approbationController.updateApprobation );
router.post('/createApprobation',approbationController.createApprobation);
router.delete('/deleteApprobation/:id', approbationController.deleteApprobation);


module.exports = router;