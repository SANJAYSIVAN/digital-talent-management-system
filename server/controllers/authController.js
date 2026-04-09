const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

const getUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department || "",
  designation: user.designation || "",
  skills: user.skills || [],
  joinedDate: user.joinedDate || null,
});

const getFrontendUrl = () => {
  const value = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "";
  const firstUrl = value
    .split(",")
    .map((url) => url.trim())
    .find(Boolean);

  return firstUrl || "http://localhost:3000";
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, designation, skills, joinedDate } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please provide name, email, and password." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const adminExists = await User.exists({ role: "admin" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: adminExists ? "user" : "admin",
      department: department || "",
      designation: designation || "",
      skills: Array.isArray(skills) ? skills : [],
      joinedDate: joinedDate || undefined,
    });

    return res.status(201).json({
      message: "User registered successfully.",
      user: getUserPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during registration." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const adminExists = await User.exists({ role: "admin" });

    if (!adminExists && user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: "Login successful.",
      token,
      user: getUserPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error during login." });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Please provide your email address." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(200).json({
        message: "If an account exists for this email, a reset link has been prepared.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 15);
    await user.save();

    return res.status(200).json({
      message: "Password reset link generated successfully.",
      resetUrl: `${getFrontendUrl()}/reset-password?token=${rawToken}`,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while preparing password reset." });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and new password are required." });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters long." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset link is invalid or has expired." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Server error while resetting password." });
  }
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    message: "Current user fetched successfully.",
    user: req.user,
  });
};

const updateProfile = async (req, res) => {
  try {
    const { name, department, designation, skills, joinedDate } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.name = name?.trim() || user.name;
    user.department = department?.trim() ?? user.department;
    user.designation = designation?.trim() ?? user.designation;
    user.skills = Array.isArray(skills)
      ? skills
          .map((skill) => String(skill).trim())
          .filter(Boolean)
      : user.skills;
    user.joinedDate = joinedDate || user.joinedDate;

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: getUserPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating profile." });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updateProfile,
};
