var express = require('express');
var router = express.Router();
const reclamationController = require('../controller/reclamationController');

router.post("/createReclamation", reclamationController.createReclamation);
router.get("/getAllReclamations", reclamationController.getAllReclamations);
router.get("/getReclamationById/:id", reclamationController.getReclamationById);
router.put("/updateReclamation/:id", reclamationController.updateReclamation);
router.delete("/deleteReclamation/:id", reclamationController.deleteReclamation);




module.exports = router;

