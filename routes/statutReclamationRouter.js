var express = require('express');
var router = express.Router();
const statutReclamationController = require('../controller/statutReclamationController');

router.get("/getAllStatutsReclamation",statutReclamationController.getAllStatutsReclamation);
router.get("/getStatutReclamationById/:id", statutReclamationController.getStatutReclamationById);
router.post("/createStatutReclamation",statutReclamationController .createStatutReclamation);
router.put("/updateStatutReclamation/:id", statutReclamationController.updateStatutReclamation);
router.delete("/deleteStatutReclamation/:id", statutReclamationController.deleteStatutReclamation);



module.exports = router;
