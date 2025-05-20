import { RequestHandler, Router } from "express";
import {
  getAvailableSlots,
  bookSlot,
  updateSlot,
  markUsersAsVaccinated,
} from "../controllers/slot.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// GET /api/slots/available --  Displays all the available slots
router.get("/available", getAvailableSlots); 

// POST /api/slots/book  --  Books the slot selected by the user
router.post("/book", authenticate as RequestHandler, bookSlot);

// PUT /api/slots/change  --  Updates User slot details
router.put("/change", authenticate as RequestHandler, updateSlot);

// POST /api/slots/mark-vaccinated  
router.post("/mark-vaccinated", markUsersAsVaccinated);

export default router;

