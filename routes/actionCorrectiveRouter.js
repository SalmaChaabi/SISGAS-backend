var express = require('express');
var router = express.Router();
const actionCorrectiveController = require('../controller/actionCorrectiveController');

router.post("/createActionCorrective", actionCorrectiveController.createActionCorrective);
router.get("/getAllActionsCorrectives", actionCorrectiveController.getAllActionsCorrectives);
router.get("/getActionCorrectiveById/:id", actionCorrectiveController.getActionCorrectiveById);
router.get("/getActionCorrectiveWithStatut/:id", actionCorrectiveController.getActionCorrectiveWithStatut);
router.put("/updateActionCorrective/:id", actionCorrectiveController.updateActionCorrective);
router.delete("/deleteActionCorrective/:id", actionCorrectiveController.deleteActionCorrective);


module.exports = router;
