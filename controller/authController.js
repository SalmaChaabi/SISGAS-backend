const userModel = require('../models/userShema')
const bcrypt = require('bcrypt')
const { query } = require('express')
const jwt = require('jsonwebtoken')
const roleModel = require("../models/roleSchema");

const maxTime = 24 *60 * 60 //24H
//const maxTime = 1 * 60 //1min
const createToken = (id) => {
    return jwt.sign({id},'net secret pfe', {expiresIn: maxTime })
}


module.exports.getAllUsers = async (req, res) => {
    try {
      // Populate sur 'role' pour avoir le nom du rôle directement
      const usersListe = await userModel.find()
        .populate('role') 
        .populate('approbations') // si tu veux les approbations aussi
        .populate('notifications');
  
      // On modifie le tableau pour retourner role.name au lieu de l'objet complet
      const usersWithRoleNames = usersListe.map(user => {
        return {
          ...user.toObject(),
          role: user.role ? user.role.name : null // remplacer l'objet role par son nom
        };
      });
  
      res.status(200).json({ usersListe: usersWithRoleNames });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  

module.exports.getUserByID = async (req, res) => {
    try {
      const { id } = req.params;
  
      // On récupère le user et on peuple (populate) directement le champ "role" avec tout l'objet Role
      const user = await userModel.findById(id)
        .populate('approbations') 
        .populate('role') // ceci remplace le besoin de roleModel.findById()
        .populate('notifications')
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      // Si tu veux retourner juste le nom du rôle, tu peux faire ça :
      const userWithRoleName = {
        ...user.toObject(), // convertir en objet normal
        role: user.role.name // remplacer l'objet role par juste son nom 
      };
  
      res.status(200).json(userWithRoleName);
  
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  module.exports.getUsersByRole = async (req, res) => {
    try {
      const { roleName } = req.params;
  
      // Trouver le rôle correspondant au nom
      const role = await roleModel.findOne({ name: roleName }).populate("users");
  
      if (!role) {
        return res.status(404).json({ message: `Rôle "${roleName}" introuvable.` });
      }
  
      // Retourner les utilisateurs liés à ce rôle
      const users = role.users.map(user => ({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: role.name
      }));
  
      res.status(200).json({ users });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  



  module.exports.addUser = async (req, res) => {
    try {
      const { firstName, lastName, email, password, role } = req.body;
  
      // Créer le nouvel utilisateur avec l'ID du rôle
      const user = new userModel({
        firstName,
        lastName,
        email,
        password,
        role,
      });
  
      const userAdded = await user.save();
  
     
  
      // Recharger l'utilisateur avec le rôle peuplé
      const userWithRole = await userModel.findById(userAdded._id).populate('role');
  
      // Modifier la réponse pour afficher seulement le nom du rôle
      const userData = {
        ...userWithRole.toObject(),
        role: userWithRole.role?.name || null, // juste le nom
      };
  
      res.status(201).json({
        message: "Utilisateur ajouté avec succès",
        user: userData,
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  

  module.exports.updateUser = async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, role } = req.body;
  
      // Trouver l'utilisateur existant
      const user = await userModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: "Utilisateur non trouvé" });
      }
  
      // Mise à jour des champs (sans validation stricte)
      await userModel.findByIdAndUpdate(
        id,
        {
          $set: {
            firstName,
            lastName,
            email,
            role,
          }
        },
        { 
          runValidators: false, // Désactive la validation
          new: true 
        }
      ).populate('role');
  
      const updatedUser = await userModel.findById(id).populate("role");
      const userData = {
        ...updatedUser.toObject(),
        role: updatedUser.role?.name || null, // juste le nom
      };
      res.status(200).json({
        message: "Utilisateur mis à jour avec succès",
        user: userData
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  

    module.exports.searchUsersByName = async (req, res) => { //?minAge=18&maxAge=80
        try {
      
            //const name = req.query.name
            console.log(req,query.firstName)
            const {firstName} = req.query
      
      
          const usersListe= await userModel.find({firstName : {$regex :firstName, $options : "i" }});
          if (usersListe.length === 0 && !usersListe) {
              throw new Error ("No users found");
          }
          res.status(200).json({usersListe});
        } catch (err) {
          res.status(500).json({ message: err.message });
        }
      };

      module.exports.deleteUser = async (req, res) => {
        try {
          const userId = req.params.id;
      
          // 1. Trouver l'utilisateur pour obtenir son rôle
          const user = await userModel.findById(userId);
          if (!user) {
            return res.status(404).json({ message: "Utilisateur introuvable" });
          }
      
          // 2. Si l'utilisateur a un rôle, retirer son ID du tableau "users" dans Role
          if (user.role) {
            await roleModel.findByIdAndUpdate(
              user.role,
              { $pull: { users: userId } }, // Retire l'ID du tableau
              { new: true }
            );
          }
      
          // 3. Supprimer l'utilisateur
          await userModel.findByIdAndDelete(userId);
      
          res.status(200).json({ message: "Utilisateur supprimé avec succès" });
      
        } catch (error) {
          res.status(500).json({ message: error.message });
        }
      };

module.exports.login= async (req,res) => {
    try {
        const { email , password } = req.body;
        const user = await userModel.login(email, password)
        const token = createToken(user._id)
        res.cookie("jwt_token_PFE", token, {httpOnly:false,maxAge:maxTime * 1000})
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}
module.exports.logout= async (req,res) => {
    try {
  
        res.cookie("jwt_token_PFE", "", {httpOnly:false,maxAge:1})
        res.status(200).json("logged")
    } catch (error) {
        res.status(500).json({message: error.message});   
    }
}  



 
