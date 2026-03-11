const Pointage = require("../models/pointageModel");
const User = require("../models/userModel");
const Personnel = require("../models/personnelModel");

/**
 * @desc    Record pointage for a personnel worker (Public Tap)
 * @route   POST /api/pointage
 * @access  Public (Credentials verified manually)
 */
exports.recordPointage = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Identifiant et mot de passe requis" });
        }

        const user = await User.findOne({ username });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: "Identifiant ou mot de passe incorrect" });
        }

        if (user.role !== "personnel") {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const personnel = await Personnel.findOne({ matricule: username });
        if (!personnel) {
            return res.status(404).json({ message: "Personnel non trouvé" });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let pointage = await Pointage.findOne({ userId: user._id, date: today });
        let message = "";

        if (!pointage) {
            pointage = await Pointage.create({
                userId: user._id,
                matricule: user.username,
                firstName: personnel.firstName,
                lastName: personnel.lastName,
                stationName: personnel.stationName,
                date: today,
                entryTime: new Date(),
            });
            message = "Pointage d'entrée enregistré";
        } else {
            pointage.exitTime = new Date();
            await pointage.save();
            message = "Pointage de sortie enregistré";
        }

        res.status(201).json({
            message,
            pointage: {
                timestamp: pointage.exitTime || pointage.entryTime,
                name: `${personnel.firstName} ${personnel.lastName}`,
                station: personnel.stationName,
                type: pointage.exitTime ? "sortie" : "entrée"
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get all pointages (filtered by role/station)
 * @route   GET /api/pointage
 * @access  Private
 */
exports.getPointages = async (req, res) => {
    try {
        const { role, id } = req.session.user;
        let query = {};

        if (role === "chef station") {
            // Fetch latest station from DB to ensure immediate reflection of changes
            const user = await User.findById(id);
            query.stationName = user?.occupiedStation;
        }

        const pointages = await Pointage.find(query).sort({ date: -1 });
        res.json(pointages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Add pointage record manually
 * @route   POST /api/pointage/manual
 * @access  Private (Admin/Manager)
 */
exports.createPointage = async (req, res) => {
    try {
        const { matricule, date, entryTime, exitTime } = req.body;

        const personnel = await Personnel.findOne({ matricule });
        if (!personnel) return res.status(404).json({ message: "Personnel introuvable" });

        const user = await User.findOne({ username: matricule });
        if (!user) return res.status(404).json({ message: "Compte utilisateur introuvable" });

        const normalizedDate = new Date(date);
        normalizedDate.setHours(0, 0, 0, 0);

        const existing = await Pointage.findOne({ userId: user._id, date: normalizedDate });
        if (existing) return res.status(400).json({ message: "Un pointage existe déjà pour ce jour" });

        const pointage = await Pointage.create({
            userId: user._id,
            matricule,
            firstName: personnel.firstName,
            lastName: personnel.lastName,
            stationName: personnel.stationName,
            date: normalizedDate,
            entryTime: entryTime ? new Date(entryTime) : undefined,
            exitTime: exitTime ? new Date(exitTime) : undefined,
        });

        res.status(201).json(pointage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update pointage record
 * @route   PUT /api/pointage/:id
 */
exports.updatePointage = async (req, res) => {
    try {
        const { entryTime, exitTime, date } = req.body;
        const pointage = await Pointage.findById(req.params.id);
        if (!pointage) return res.status(404).json({ message: "Pointage non trouvé" });

        if (date) {
            const normalizedDate = new Date(date);
            normalizedDate.setHours(0, 0, 0, 0);
            pointage.date = normalizedDate;
        }
        if (entryTime) pointage.entryTime = new Date(entryTime);
        if (exitTime) pointage.exitTime = new Date(exitTime);

        await pointage.save();
        res.json(pointage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Delete pointage record
 * @route   DELETE /api/pointage/:id
 */
exports.deletePointage = async (req, res) => {
    try {
        const pointage = await Pointage.findById(req.params.id);
        if (!pointage) return res.status(404).json({ message: "Pointage non trouvé" });
        await pointage.deleteOne();
        res.json({ message: "Pointage supprimé" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Get single pointage record
 * @route   GET /api/pointage/:id
 */
exports.getPointageById = async (req, res) => {
    try {
        const pointage = await Pointage.findById(req.params.id);
        if (!pointage) return res.status(404).json({ message: "Pointage non trouvé" });
        res.json(pointage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
