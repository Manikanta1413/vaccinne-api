// routes/admin.routes.ts
import express, { RequestHandler } from "express";
import {
  adminLogin,
  getUsersWithFilters,
  getSlotSummaryByDate,
  getAllSlotDetails,
  getSlotDetailsByDate,
  getVaccinationSlotDetails,
  filterUsers,
  getSlotsByDate,
} from "../controllers/admin.controller";
import { isAdmin } from "../middlewares/adminAuth.middleware";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/users", isAdmin as RequestHandler, getUsersWithFilters);
router.get("/slot-summary", isAdmin as RequestHandler, getSlotSummaryByDate);
router.get("/api/slots/date/:date", getSlotDetailsByDate);
router.get("/slots/:date", isAdmin as RequestHandler, getVaccinationSlotDetails);
router.get("/users", isAdmin as RequestHandler, filterUsers);
router.get("/slots", isAdmin as RequestHandler, getSlotsByDate);

// GET /api/admin/slots
router.get("/slots", isAdmin as RequestHandler, getAllSlotDetails);

export default router;





