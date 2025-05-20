import { Router } from "express";
import { registerUser, logInUser, logOut } from "../controllers/auth.controller";

const router = Router();
// POST /api/auth/register  --  User Registration API
router.post("/register", registerUser);

// POST /api/auth/login  --  User Login API
router.post("/login", logInUser);

// POST /api/auth/logout  -- User LogOut API
router.post("/logout", logOut);

export default router;
