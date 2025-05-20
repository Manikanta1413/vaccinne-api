"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserProfile = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
//  GET /api/users/profile
const getUserProfile = async (req, res) => {
    try {
        const user = await user_model_1.default.findById(req.user.userId).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    }
    catch (error) {
        console.error("Failed to get user profile due to : ", error);
        return res.status(400).json({ message: "Failed to get user profile", error });
    }
};
exports.getUserProfile = getUserProfile;
