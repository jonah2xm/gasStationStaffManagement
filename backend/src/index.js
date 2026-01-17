// api/index.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("../config/db");
const userRoutes = require("../routes/userRoutes");
const stationRoutes = require("../routes/stationRoutes");
const personnelRouter = require("../routes/personnelRouter");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const absenceAARoutes = require("../routes/absenceAARoutes");
const absenceAIRoutes = require("../routes/absenceAIRoutes");
const affectationTempRoutes = require("../routes/affectationTemporaireRoutes");
const affectatoinDefinitif = require("../routes/affectationDefinitifRoutes");
const congeRoutes = require("../routes/congeRoutes");
const recuperationRoutes = require("../routes/recuperationRoutes");
const path = require("path");
const authRoutes = require("../routes/authRoutes");
const notificationRoutes = require("../routes/notificationRouter");
const fs = require("fs");

dotenv.config();

const app = express();

const allowedOrigin = [
  process.env.FRONTEND_URL,
  "http://10.34.6.33:3000", 
  "http://localhost:3000"
];

// Middleware
app.use(cors({ 
  credentials: true, 
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(morgan("dev"));

// ❌ REMOVED: Cron jobs don't work on Vercel
// require("../cronjobs/statusCronjobs");

console.log('allowed origins:', allowedOrigin);

// Session middleware
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
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Connect to database
connectDB();

const uploadsDir = path.resolve(process.cwd(), "src", "uploads");
app.use("/uploads", express.static(uploadsDir, {
  dotfiles: "deny",
  index: false,
}));

app.get("/debug/list-uploads", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ err: err.message, uploadsDir, cwd: process.cwd() });
    res.json({ uploadsDir, cwd: process.cwd(), files });
  });
});

// Routes
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the backend!", status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/stations", stationRoutes);
app.use("/api/personnel", personnelRouter);
app.use("/api/absencesAA", absenceAARoutes);
app.use("/api/absencesAI", absenceAIRoutes);
app.use("/api/affectationTemp", affectationTempRoutes);
app.use("/api/affectationDef", affectatoinDefinitif);
app.use("/api/conges", congeRoutes);
app.use("/api/recuperations", recuperationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// ✅ Export for Vercel (NO server.listen!)
module.exports = app;