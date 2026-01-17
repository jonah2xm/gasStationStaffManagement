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
const recuperationRoutes = require("./routes/recuperationRoutes");
const path = require("path");
const authRoutes = require("./routes/authRoutes");
const notificationRoutes = require("./routes/notificationRouter");
const fs = require("fs"); // <- needed by your debug endpoint below

// Socket.IO / http
const http = require("http");
const { Server } = require("socket.io");//tets

// 2. Load environment variables
dotenv.config();

// 3. Create an Express app
const app = express();
const allowedOrigin = [process.env.FRONTEND_URL,"http://10.34.6.33:3000", "http://localhost:3000"];

// 4. Middleware
app.use(cors({ credentials: true, origin: allowedOrigin }));
app.use(express.json());
app.use(morgan("dev"));
require("./cronjobs/statusCronjobs");

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
      secure: false, // Set to true if using HTTPS in production
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// 6. Connect to the database
connectDB();

const uploadsDir = path.resolve(process.cwd(), "src", "uploads");

// serve uploads at /uploads
app.use("/uploads", express.static(uploadsDir, {
  dotfiles: "deny",
  index: false,
}));

// debug endpoint (temporary)
app.get("/debug/list-uploads", (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ err: err.message, uploadsDir, cwd: process.cwd() });
    res.json({ uploadsDir, cwd: process.cwd(), files });
  });
});

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
app.use("/api/recuperations", recuperationRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);

// 9. Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 10. Create HTTP server and attach Socket.IO
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    credentials: true,
  },
});

// Simple socket handlers: allow clients to join per-user rooms
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Client should emit 'join' with their user id after authentication
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

// 11. Start server (use http server, not app.listen)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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
