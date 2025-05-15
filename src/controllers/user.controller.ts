import { Request, Response } from "express";
import User from "../models/user.model";

interface AuthRequest extends Request {
  user?: any;
}

export const getUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<any> => {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ message: "Failed to get profile", error });
  }
};
