const User = require("../models/userSchema");
const express = require("express");
const routes = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validateToken = require("../middleware/verifyToken");
const path = require("path");
const multer = require("multer");

// Define the upload middleware
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/png" || file.mimetype === "image/jpeg") {
      cb(null, true);
    } else {
      console.log("Only JPG and PNG formats are supported.");
      cb(null, false);
    }
  },
  // limits: {
  //   fileSize: 1024 * 1024 * 2, // 2MB
  // },
});


// API endpoint to register user
routes.post("/register", upload.single("image"), async (req, res) => {
  // console.log(req);
  console.log(req.body);
  // console.log(req.file);
  const { firstName, lastName, email, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
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
    });
    if (req.file) {
      newUser.profileImage = req.file.path;
    }

    await newUser.save();

    const token = jwt.sign(
      { email: newUser.email, id: newUser._id },
      process.env.SECRET_KEY,
      { expiresIn: "5d" }
    );

    return res.status(201).json({
      message: "User registered successfully",
      newUser,
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// API endpoint to login user
routes.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = jwt.sign(
      { email: user.email, id: user._id },
      process.env.SECRET_KEY,
      { expiresIn: "5d" }
    );

    return res.status(200).json({ message: "Login successful", user, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});
// API endpoint to update user
routes.put(
  "/updateuserdata/:id",
  validateToken,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        oldPassword,
        newPassword,
        confirmPassword,
      } = req.body;

      const _id = req.params.id;

      const updatedUser = {};

      // Check if any field is provided and update the corresponding property
      if (firstName) {
        updatedUser.firstName = firstName;
      }
      if (lastName) {
        updatedUser.lastName = lastName;
      }
      if (email) {
        updatedUser.email = email;
      }

      const user = await User.findById(_id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if the old password matches the database password
      if (oldPassword || newPassword || confirmPassword) {
        if (!oldPassword || !newPassword || !confirmPassword) {
          return res
            .status(400)
            .json({ message: "Password fields are required" });
        }
        const isPasswordValid = await bcrypt.compare(
          oldPassword,
          user.password
        );
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: "old Password is incorrect " });
        }

        // Check if the new password and confirm password match
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: "Passwords do not match" });
        }

        // Update the password if the new password is provided
        if (newPassword) {
          updatedUser.password = await bcrypt.hash(newPassword, 10);
        }
      }

      if (req.file) {
        updatedUser.profileImage = req.file.path;
      }

      const updatedUserData = await User.findByIdAndUpdate(_id, updatedUser);
      if (!updatedUserData) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json({ message: "User updated successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);



// API endpoint to get user details by ID
routes.get("/userdetails/:id", validateToken, async (req, res) => {
  const { id } = jwt.verify(req.params.id, process.env.SECRET_KEY);
  const userId = id;

  try {
    // Connect to the database (assuming you have a function to establish the connection)

    // Fetch the user details from the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Return the user details as the API response
    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = routes;
