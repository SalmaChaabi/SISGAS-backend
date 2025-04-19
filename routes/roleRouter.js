const express = require('express');
const router = express.Router();
const roleController = require('../controller/roleController');

//  Get all roles
router.get('/getAllRoles', roleController.getAllRoles);

//  Get one role by ID
router.get('/getRole/:id', roleController.getRoleById);

//  Create a new role
router.post('/createRole', roleController.createRole);

//  Update role by ID
router.put('/updateRole/:id', roleController.updateRole);

//  Delete role by ID
router.delete('/deleteRole/:id', roleController.deleteRole);

//  Get all users who have a specific role
//router.get('/getUsersByRole/:id',roleController.getUsersByRole);

module.exports = router;
