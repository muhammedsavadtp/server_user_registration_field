const User = require("../models/userSchema");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const express = require("express");
const routes = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateToken = require("../middleware/verifyToken");

routes.post("/register", upload.single("profileImage"), async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      profileImage: req.file ? req.file.path : null,
    });

    await newUser.save();

    // Generate JWT token with a 5-day expiration
    const token = jwt.sign({ email: newUser.email }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", newUser, token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

routes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT token with a 5-day expiration
    const token = jwt.sign({ email: user.email,id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "5d",
    });

    return res
      .status(200)
      .json({ message: "Login successful", user, token: token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

routes.put(
  "/upadateuser/:id",
  validateToken,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { firstName, lastName } = req.body;
      const _id = req.params.id;

      const updatedUser = {
        firstName,
        lastName,
        profileImage: req.file ? req.file.path : null,
      };
      await User.findByIdAndUpdate(_id, updatedUser);

      return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// API endpoint to get user details by ID
routes.get("/userdetails/:id", validateToken, async (req, res) => {
  const userId = req.params.id;

  try {
    // Connect to the database (assuming you have a function to establish the connection)

    // Fetch the user details from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user details as the API response
    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = routes;
