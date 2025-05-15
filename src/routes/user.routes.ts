import { RequestHandler, Router } from "express";
import { getUserProfile } from "../controllers/user.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/profile", authenticate as RequestHandler, getUserProfile);

export default router;
