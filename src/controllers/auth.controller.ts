import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


// POST /api/auth/register
export const registerUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Payload is required" });
    }
    const { name, phoneNumber, password, age, pinCode, aadharNumber } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
      age,
      pinCode,
      aadharNumber,
    });

    return res.status(201).json({ message: "User registered successfully", user });
  } catch (error: any) {
    console.error("User registration failed due to : ", error);
    return res.status(400).json({ message: "Registration failed due to : ", error: error.message });
  }
};

// POST /api/auth/login
export const logInUser = async (req: Request, res: Response): Promise<any> => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Payload is required" });
    }
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "2h",
      }
    );
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
  } catch (error:any) {
    console.error("Login failed due to : ", error);
    return res.status(400).json({ message: "Login failed", error: error.message });
  }
};

// POST /api/auth/logout
export const logOut = async (_req: Request, res: Response): Promise<any> => {
  res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
  console.log("👋 User logged out");
};