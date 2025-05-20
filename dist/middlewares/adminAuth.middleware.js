"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAdmin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user.model"));
const isAdmin = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(" ")[1];
        if (!token)
            return res.status(401).json({ message: "Unauthorized" });
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await user_model_1.default.findById(decoded.userId);
        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Access denied: Admins only" });
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Authentication failed for admin due to : ", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.isAdmin = isAdmin;
