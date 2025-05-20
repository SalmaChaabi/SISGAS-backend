// routes/dashboard.routes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controller/dashboardController');


// Route pour récupérer les statistiques des actions correctives
router.get('/getDashboardStats', dashboardController.getDashboardStats);


module.exports = router; 
 