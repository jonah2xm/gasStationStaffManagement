const mongoose = require("mongoose");
require("dotenv").config();
const User = require("./models/userModel"); // adjust path if needed

const MONGO_URI = process.env.MONGO_URI;
console.log("MONGO_URI:", MONGO_URI);
async function createUser() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    // Check if user already exists
    const existingUser = await User.findOne({ username: "younes.oubelaid" });
    if (existingUser) {
      console.log("User already exists");
      process.exit(0);
    }

    const user = new User({
      username: "younes.oubelaid",
      email: "younes.oubelaid@naftal.dz", // REQUIRED by schema
      password: "Younes2000", // will be hashed automatically
      role: "administrateur",
    });

    await user.save();
    console.log("✅ User created successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating user:", error.message);
    process.exit(1);
  }
}

createUser();
