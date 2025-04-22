const statutReclamationModel= require("../models/statutReclamationSchema");

exports.createStatutReclamation = async (req, res) => {
  try {
    const { nom, description } = req.body;
    const existing = await statutReclamationModel.findOne({ nom });
    if (existing) return res.status(400).json({ message: "Statut déjà existant." });

    const statut = await statutReclamationModel.create({ nom, description });
    res.status(201).json(statut);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.getAllStatutsReclamation = async (req, res) => {
  try {
    const statuts = await statutReclamationModel.find();
    res.status(200).json(statuts);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.getStatutReclamationById = async (req, res) => {
  try {
    const statut = await statutReclamationModel.findById(req.params.id);
    if (!statut) return res.status(404).json({ message: "Statut non trouvé." });
    res.status(200).json(statut);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.updateStatutReclamation = async (req, res) => {
  try {
    const statut = await statutReclamationModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(statut);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

exports.deleteStatutReclamation = async (req, res) => {
  try {
    await statutReclamationModel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Statut supprimé." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};
