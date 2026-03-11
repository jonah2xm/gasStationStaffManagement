const Personnel = require("../models/personnelModel");
const User = require("../models/userModel");

// Get all personnel
const getPersonnel = async (req, res) => {
  try {
    const { role, id } = req.session.user || {};
    let query = {};

    if (role === "chef station") {
      // Fetch latest station from DB to ensure immediate reflection of changes
      const user = await User.findById(id);
      query.stationName = user?.occupiedStation;
    }

    const personnels = await Personnel.find(query);
    res.status(200).json(personnels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single personnel by ID
const getPersonnelById = async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    if (!personnel)
      return res.status(404).json({ message: "Personnel not found" });
    res.status(200).json(personnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new personnel
const createPersonnel = async (req, res) => {
  try {
    const newPersonnel = new Personnel(req.body);
    console.log(newPersonnel);
    const savedPersonnel = await newPersonnel.save();
    res.status(201).json(savedPersonnel);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing personnel
const updatePersonnel = async (req, res) => {
  try {
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedPersonnel)
      return res.status(404).json({ message: "Personnel not found" });
    res.status(200).json(updatedPersonnel);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete a personnel record
const deletePersonnel = async (req, res) => {
  try {
    const deletedPersonnel = await Personnel.findByIdAndDelete(req.params.id);
    if (!deletedPersonnel)
      return res.status(404).json({ message: "Personnel not found" });
    res.status(200).json({ message: "Personnel deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update the status of a personnel record
const statusUpdate = async (req, res) => {
  try {
    const { status } = req.body;
    const updatedPersonnel = await Personnel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updatedPersonnel)
      return res.status(404).json({ message: "Personnel not found" });
    res.status(200).json(updatedPersonnel);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPersonnel,
  getPersonnelById,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  statusUpdate,
};
