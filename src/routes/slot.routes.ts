import { RequestHandler, Router } from "express";
import {
  getAvailableSlots,
  bookSlot,
  updateSlot,
  markUsersAsVaccinated,
} from "../controllers/slot.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAvailableSlots); // GET /api/slots
// router.get("/available", authenticate as RequestHandler, getAvailableSlots);
router.post("/book", authenticate as RequestHandler, bookSlot);
router.put("/change", authenticate as RequestHandler, updateSlot);
router.post("/mark-vaccinated", markUsersAsVaccinated);

export default router;

