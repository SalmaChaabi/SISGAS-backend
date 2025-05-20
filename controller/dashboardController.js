const reclamationModel = require("../models/reclamationShema");
const factureModel = require('../models/factureSchema');
const userModel = require('../models/userShema');
const approbationModel = require('../models/approbationSchema');
const actionCorrectiveModel = require("../models/actionCorrectiveSchema");
const statutPaiementModel = require("../models/statutPaiementSchema");
const statutReclamationModel = require("../models/statutReclamationSchema");

const getMonthName = (monthIndex) => {
    const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return months[monthIndex];
};

const getStatsParMois = async (Model) => {
    return Promise.all(
        [...Array(12)].map(async (_, i) => {
            const date = new Date();
            date.setMonth(date.getMonth() - (11 - i));
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

            const count = await Model.countDocuments({ createdAt: { $gte: start, $lt: end } });

            return { 
                mois: getMonthName(date.getMonth()), 
                annee: date.getFullYear(),
                count 
            };
        })
    );
};

const getNiveau = (points) => {
    if (points >= 300) return 'Platine';
    if (points >= 200) return 'Or';
    if (points >= 100) return 'Argent';
    return 'Bronze';
};

exports.getDashboardStats = async (req, res) => {
    try {
        const [statutsReclamation, statutsPaiement, users] = await Promise.all([
            statutReclamationModel.find(),
            statutPaiementModel.find(),
            userModel.find()
        ]);

        // Réclamations par statut
        const reclamationStats = {};
        for (const statut of statutsReclamation) {
            const count = await reclamationModel.countDocuments({ statut: statut._id });
            if (count > 0) reclamationStats[statut.nom] = count;
        }

        // Factures par statut de paiement
        const factureStats = {};
        for (const statut of statutsPaiement) {
            const count = await factureModel.countDocuments({ statutpaiement: statut._id });
            if (count > 0) factureStats[statut.name] = count;
        }

        // Factures sans statut paiement défini
        const undefinedFactureCount = await factureModel.countDocuments({
            $or: [
                { statutpaiement: null },
                { statutpaiement: { $exists: false } }
            ]
        });
        if (undefinedFactureCount > 0) {
            factureStats["Non défini"] = undefinedFactureCount;
        }

        // Stats par mois
        const [approbationsParMois, actionsCorrectivesParMois, facturesParMois] = await Promise.all([
            getStatsParMois(approbationModel),
            getStatsParMois(actionCorrectiveModel),
            getStatsParMois(factureModel)
        ]);

        const statsParMois = approbationsParMois.map((_, i) => {
            const approbations = approbationsParMois[i].count;
            const actionsCorrectives = actionsCorrectivesParMois[i].count;
            const factures = facturesParMois[i].count;

            if (approbations > 0 || actionsCorrectives > 0 || factures > 0) {
                return {
                    mois: `${approbationsParMois[i].mois} ${approbationsParMois[i].annee}`,
                    approbations,
                    actionsCorrectives,
                    factures
                };
            }
            return null;
        }).filter(item => item !== null);

        // Leaderboard et points utilisateurs
        const leaderboard = [];

        for (const user of users) {
            const [reclamationsCount, actionsCount, facturesCount] = await Promise.all([
                reclamationModel.countDocuments({ utilisateur: user._id }),
                actionCorrectiveModel.countDocuments({ utilisateur: user._id }),
                factureModel.countDocuments({ utilisateur: user._id })
            ]);

            const points = (reclamationsCount * 10) + (actionsCount * 20) + (facturesCount * 5);

            leaderboard.push({
                userId: user._id,
                nom: user.nom,
                email: user.email,
                reclamationsCount,
                actionsCorrectivesCount: actionsCount,
                facturesCount,
                points,
                niveau: getNiveau(points)
            });
        }

        // Trier le leaderboard par points décroissants
        leaderboard.sort((a, b) => b.points - a.points);

        // Réponse complète
        const stats = {
            totalReclamations: await reclamationModel.countDocuments(),
            totalFactures: await factureModel.countDocuments(),
            totalUsers: await userModel.countDocuments(),
            totalApprobations: await approbationModel.countDocuments(),
            totalActionsCorrectives: await actionCorrectiveModel.countDocuments(),
            reclamationsParStatut: reclamationStats,
            facturesParStatut: factureStats,
            statsParMois,
            leaderboard
        };

        res.json(stats);
    } catch (error) {
        console.error("Erreur dans getDashboardStats:", error);
        res.status(500).json({ message: 'Erreur lors du chargement des statistiques', error });
    }
};












