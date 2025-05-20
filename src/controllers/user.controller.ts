import { Request, Response } from "express";
import User from "../models/user.model";

interface AuthRequest extends Request {
  user?: any;
}

//  GET /api/user/profile
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
    console.error("Failed to get user profile due to : ", error);
    return res.status(400).json({ message: "Failed to get user profile", error });
  }
};
