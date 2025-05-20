"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_controller_1 = require("../controllers/admin.controller");
const adminAuth_middleware_1 = require("../middlewares/adminAuth.middleware");
const router = express_1.default.Router();
//POST /api/admin/login --  Admin Login API
router.post("/login", admin_controller_1.adminLogin);
//GET /api/admin/users  --  Get all registered users with filters
router.get("/users", adminAuth_middleware_1.isAdmin, admin_controller_1.getUsersWithFilters);
//GET /api/admin/slot-summary --  Get booking summary (first/second/total) for a day
router.get("/slot-summary", adminAuth_middleware_1.isAdmin, admin_controller_1.getSlotSummaryByDate);
// GET /api/admin/slots  --  Get all slots
router.get("/slots", adminAuth_middleware_1.isAdmin, admin_controller_1.getAllSlotDetails);
// GET /api/admin/slots/:date  --  Get slots by date
router.get("/slots/:date", admin_controller_1.getSlotDetailsByDate);
// GET /api/admin/slots/:date/:pinCode  --  Get slots by date and pinCode
router.get("/slots/:date/:pinCode", adminAuth_middleware_1.isAdmin, async (req, res) => {
    try {
        const { date, pinCode } = req.params;
        const data = await (0, admin_controller_1.getVaccinationSlotDetails)(date, pinCode);
        res.json(data);
    }
    catch (error) {
        console.error("Failed to fetch vaccination slot details due to : ", error);
        res.status(400).json({ message: "Failed to fetch vaccination slot details. ", error: error.message });
    }
});
// POST /api/admin/logout  -- Admin LogOut API
router.post("/logout", admin_controller_1.logOut);
exports.default = router;
