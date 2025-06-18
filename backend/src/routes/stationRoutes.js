const express = require("express");
const {
  getStations,
  getStationById,
  createStation,
  updateStation,
  deleteStation,
} = require("../controllers/stationController");

const router = express.Router();

router.get("/", getStations);
router.get("/:id", getStationById);
router.post("/", createStation);
router.put("/:id", updateStation);
router.delete("/:id", deleteStation);

module.exports = router;
