// server.js

// 1. Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const stationRoutes = require("./routes/stationRoutes");
const personnelRouter = require("./routes/personnelRouter");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const absenceAARoutes = require("./routes/absenceAARoutes");
const absenceAIRoutes = require("./routes/absenceAIRoutes");
const affectationTempRoutes = require("./routes/affectationTemporaireRoutes");
const affectatoinDefinitif = require("./routes/affectationDefinitifRoutes");
const congeRoutes = require("./routes/congeRoutes");
// 2. Load environment variables
dotenv.config();

// 3. Create an Express app
const app = express();
const allowedOrigin = ["http://10.34.6.42:3000", "http://localhost:3000"];
// 4. Middleware
app.use(cors({ credentials: true, origin: allowedOrigin })); // Adjust frontend origin
app.use(express.json());
app.use(morgan("dev"));

// 5. Session middleware (must come before routes)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      httpOnly: true,
      secure: false, // Set to true if using HTTPS
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// 6. Connect to the database
connectDB();

// 7. Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the backend!");
});

// 8. Routes
app.use("/api/users", userRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/personnel", personnelRouter);
app.use("/api/absencesAA", absenceAARoutes);
app.use("/api/absencesAI", absenceAIRoutes);
app.use("/api/affectationTemp", affectationTempRoutes);
app.use("/api/affectationDef", affectatoinDefinitif);
app.use("/api/conges", congeRoutes);

// 9. Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 10. Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
