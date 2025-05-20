"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOut = exports.logInUser = exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Payload is required" });
        }
        const { name, phoneNumber, password, age, pinCode, aadharNumber } = req.body;
        const existingUser = await user_model_1.default.findOne({ phoneNumber });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const user = await user_model_1.default.create({
            name,
            phoneNumber,
            password: hashedPassword,
            age,
            pinCode,
            aadharNumber,
        });
        return res.status(201).json({ message: "User registered successfully", user });
    }
    catch (error) {
        console.error("User registration failed due to : ", error);
        return res.status(400).json({ message: "Registration failed due to : ", error: error.message });
    }
};
exports.registerUser = registerUser;
// POST /api/auth/login
const logInUser = async (req, res) => {
    try {
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ message: "Payload is required" });
        }
        const { phoneNumber, password } = req.body;
        const user = await user_model_1.default.findOne({ phoneNumber });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "2h",
        });
        return res.status(200).cookie("token", token, { httpOnly: true }).json({
            message: "Login successful",
            user: {
                token,
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error("Login failed due to : ", error);
        return res.status(400).json({ message: "Login failed", error: error.message });
    }
};
exports.logInUser = logInUser;
// POST /api/auth/logout
const logOut = async (_req, res) => {
    res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
    console.log("👋 User logged out");
};
exports.logOut = logOut;
