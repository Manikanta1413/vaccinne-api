import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/user.model"; // Adjust path if needed

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI as string);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Check if admin exists
    const existingAdmin = await User.findOne({
      phoneNumber: process.env.ADMIN_PHONE,
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD as string, 10);

      const admin = new User({
        name: "Admin",
        phoneNumber: "9999999999",
        password: hashedPassword,
        age: 30,
        pincode: "000000",
        aadharNumber: "999999999999",
        role: "admin", // make sure your schema supports this
      });

      await admin.save();
      console.log("✅ Admin user created");
    } else {
      console.log("ℹ️ Admin user already exists");
    }
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
