// api/index.js - Vercel serverless function
//for testing again
// 1. Import required modules
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./src/config/db");
const userRoutes = require("./src/routes/userRoutes");
const stationRoutes = require("./src/routes/stationRoutes");
const personnelRouter = require("./src/routes/personnelRouter");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const absenceAARoutes = require("./src/routes/absenceAARoutes");
const absenceAIRoutes = require("./src/routes/absenceAIRoutes");
const affectationTempRoutes = require("./src/routes/affectationTemporaireRoutes");
const affectatoinDefinitif = require("./src/routes/affectationDefinitifRoutes");
const congeRoutes = require("./src/routes/congeRoutes");
const recuperationRoutes = require("./src/routes/recuperationRoutes");
const path = require("path");
const authRoutes = require("./src/routes/authRoutes");
const notificationRoutes = require("./src/routes/notificationRouter");
const pointageRoutes = require("./src/routes/pointageRoutes");

const fs = require("fs");

// Socket.IO / http
const http = require("http");
const { Server } = require("socket.io");

// 2. Load environment variables
dotenv.config();

// 3. Create an Express app
const app = express();

// Define allowed origins
const allowedOrigins = [
  "http://10.34.6.33:3000",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
]

// 4. Manual CORS and Preflight Handling (More Reliable for Vercel)
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Define helper to check if origin is allowed
  const isAllowed = origin && (
    allowedOrigins.includes(origin.replace(/\/$/, "")) ||
    origin.endsWith(".vercel.app")
  );

  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(morgan("dev"));

require("./src/cronjobs/statusCronjobs");

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
      secure: process.env.NODE_ENV === 'production', // true for HTTPS (Vercel)
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Required for cross-origin
    },
  })
);

// 6. Connect to the database
connectDB();

const uploadsDir = path.resolve(process.cwd(), "src", "uploads");

// serve uploads at /uploads
app.use(
  "/uploads",
  express.static(uploadsDir, {
    dotfiles: "deny",
    index: false,
  })
);

// debug endpoint (temporary)
app.get("/debug/list-uploads", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err)
      return res
        .status(500)
        .json({ err: err.message, uploadsDir, cwd: process.cwd() });
    res.json({ uploadsDir, cwd: process.cwd(), files });
  });
});

// 7. Basic route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to the backend!",
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: allowedOrigins
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
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
app.use("/api/recuperations", recuperationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pointage", pointageRoutes);

// 9. Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!", error: err.message });
});

// 10. Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, "")) || origin.endsWith(".vercel.app")) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  },
});

// Simple socket handlers: allow clients to join per-user rooms
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    if (!userId) return;
    socket.join(`user:${userId}`);
    console.log(`Socket ${socket.id} joined room user:${userId}`);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

// make io accessible in request handlers/controllers
app.set("io", io);

// 11. For local development only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Close server properly on restart/exit
process.on("SIGINT", () => {
  console.log("SIGINT received — closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  console.log("SIGTERM received — terminating server...");
  server.close(() => {
    console.log("Server terminated");
    process.exit(0);
  });
});

// CRITICAL: Export app for Vercel serverless
module.exports = app;
