var express = require('express');
var router = express.Router();
const authController = require('../controller/authController');
const uploadfile = require('../middlewares/uploadFile');


/* GET users listing. */
router.get('/getAllUsers',authController.getAllUsers );
router.get('/getUserById/:id',authController.getUserByID );
router.get('/getUsersByRole/:roleName',authController.getUsersByRole );
router.post('/addUser',authController.addUser );
router.get('/searchUsersByName',authController.searchUsersByName );
router.put('/updateUser/:id',authController.updateUser);
router.delete('/deleteUser/:id',authController.deleteUser );
router.post('/addUserWithImage',uploadfile.single("image_user"), authController.addUserWithImage);
router.post('/login',authController.login); 
router.post('/logout',authController.logout);     



module.exports = router;