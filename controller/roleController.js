const roleModel = require('../models/roleSchema'); 
const userModel = require('../models/userShema')


exports.getAllRoles = async (req, res) => {
  try {
    const roles = await roleModel.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


exports.getRoleById = async (req, res) => {
  try {
    const role = await roleModel.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


exports.createRole = async (req, res) => {
    try {
      const { name, description } = req.body;
  
      // Créer le rôle
      const role = new roleModel({ name, description });
      await role.save();
  
      // Chercher les users qui ont ce rôle par son nom
      const usersWithRole = await userModel.find({}).populate("role");
      const matchedUsers = usersWithRole.filter(user => user.role?.name === name);
  
      // Lier les utilisateurs à ce rôle
      const userIds = matchedUsers.map(user => user._id);
      role.users = userIds;
      await role.save();
  
      res.status(201).json({
        message: "Rôle créé avec succès",
        role,
        users: matchedUsers
      });
    } catch (error) {
      res.status(500).json({ message: "Erreur création", error });
    }
  };
  


exports.updateRole = async (req, res) => {
    try {
      const { name, description } = req.body;
      const role = await Role.findByIdAndUpdate(
        req.params.id,
        { name, description },
        { new: true }
      );
      if (!role) return res.status(404).json({ message: "Rôle non trouvé." });
      res.status(200).json(role);
    } catch (error) {
      res.status(500).json({ message: "Erreur lors de la mise à jour.", error });
    }
  };


exports.deleteRole = async (req, res) => {
  try {
    const role = await roleModel.findByIdAndDelete(req.params.id);
    if (!role) {
      return res.status(404).json({ message: "Rôle non trouvé" });
    }

    // Optionnel : supprimer la relation chez les users
    await User.updateMany({ Role: role._id }, { $unset: { role: "" } });

    res.status(200).json({ message: "Rôle supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur suppression", error });
  }
};

//  Get all users of a specific role
//exports.getUsersByRole = async (req, res) => {
  //try {
    //const roleId = req.params.id;
   // const users = await userModel.find({ Role: roleId }).populate("role");
    //res.status(200).json(users);
 // } catch (error) {
   // res.status(500).json({ message: "Erreur récupération des utilisateurs", error });
  //}
//};










