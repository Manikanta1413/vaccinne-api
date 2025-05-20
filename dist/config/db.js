"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const user_model_1 = __importDefault(require("../models/user.model"));
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGODB_URI);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        // Check if admin exists
        const existingAdmin = await user_model_1.default.findOne({
            phoneNumber: process.env.ADMIN_PHONE,
        });
        if (!existingAdmin) {
            const hashedPassword = await bcryptjs_1.default.hash(process.env.ADMIN_PASSWORD, 10);
            const admin = new user_model_1.default({
                name: "Admin",
                phoneNumber: process.env.ADMIN_PHONE,
                password: hashedPassword,
                age: 30,
                pinCode: "500000",
                aadharNumber: "999999999999",
                role: "admin",
            });
            await admin.save();
            console.log("✅ Admin user created");
        }
        else {
            console.log("ℹ️ Admin user already exists");
        }
    }
    catch (error) {
        console.error("❌ MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
