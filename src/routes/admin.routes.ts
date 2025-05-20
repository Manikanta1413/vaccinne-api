import express, { RequestHandler } from "express";
import {
  adminLogin,
  getUsersWithFilters,
  getSlotSummaryByDate,
  getAllSlotDetails,
  getSlotDetailsByDate,
  getVaccinationSlotDetails,
  logOut
} from "../controllers/admin.controller";
import { isAdmin } from "../middlewares/adminAuth.middleware";

const router = express.Router();

//POST /api/admin/login --  Admin Login API
router.post("/login", adminLogin);

//GET /api/admin/users  --  Get all registered users with filters
router.get("/users", isAdmin as RequestHandler, getUsersWithFilters);

//GET /api/admin/slot-summary --  Get booking summary (first/second/total) for a day
router.get("/slot-summary", isAdmin as RequestHandler, getSlotSummaryByDate);

// GET /api/admin/slots  --  Get all slots
router.get("/slots", isAdmin as RequestHandler, getAllSlotDetails);

// GET /api/admin/slots/:date  --  Get slots by date
router.get("/slots/:date", getSlotDetailsByDate);

// GET /api/admin/slots/:date/:pinCode  --  Get slots by date and pinCode
router.get(
  "/slots/:date/:pinCode",
  isAdmin as RequestHandler,
  async (req, res) => {
    try {
      const { date, pinCode } = req.params;
      const data = await getVaccinationSlotDetails(date, pinCode);
      res.json(data);
    } catch (error:any) {
      console.error("Failed to fetch vaccination slot details due to : ", error);
      res.status(400).json({ message: "Failed to fetch vaccination slot details. ", error: error.message });
    }
  }
);

// POST /api/admin/logout  -- Admin LogOut API
router.post("/logout", logOut);

export default router;
