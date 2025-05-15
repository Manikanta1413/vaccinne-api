import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const registerUser = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { name, phoneNumber, password, age, pincode, aadharNo } = req.body;

    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      phoneNumber,
      password: hashedPassword,
      age,
      pincode,
      aadharNo,
    });

    return res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (error) {
    return res.status(400).json({ message: "Registration failed", error });
  }
};

export const loginUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const { phoneNumber, password } = req.body;

    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET as string , {
      expiresIn: "2h",
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    return res.status(400).json({ message: "Login failed", error });
  }
};
