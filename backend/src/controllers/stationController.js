const Station = require("../models/stationModel");

// Get all stations
const getStations = async (req, res) => {
  try {
    const stations = await Station.aggregate([
      {
        $lookup: {
          from: "personnels", // Collection name in MongoDB
          localField: "_id", // Station._id
          foreignField: "station", // employee.station_id
          as: "personnels",
        },
      },
    ]);
    res.status(200).json(stations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single station
const getStationById = async (req, res) => {
  try {
    console.log(req.params);
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: "Station not found" });
    res.status(200).json(station);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new station
const createStation = async (req, res) => {
  try {
    const newStation = new Station(req.body);
    console.log("newstation", newStation);
    const savedStation = await newStation.save();
    res.status(201).json(savedStation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a station
const updateStation = async (req, res) => {
  try {
    const updatedStation = await Station.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedStation)
      return res.status(404).json({ message: "Station not found" });
    res.status(200).json(updatedStation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a station
const deleteStation = async (req, res) => {
  try {
    const deletedStation = await Station.findByIdAndDelete(req.params.id);
    if (!deletedStation)
      return res.status(404).json({ message: "Station not found" });
    res.status(200).json({ message: "Station deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
};
