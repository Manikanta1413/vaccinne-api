"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logOut = exports.getVaccinationSlotDetails = exports.getSlotDetailsByDate = exports.getAllSlotDetails = exports.getSlotSummaryByDate = exports.getUsersWithFilters = exports.adminLogin = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const slot_model_1 = __importDefault(require("../models/slot.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// POST /api/admin/login
const adminLogin = async (req, res) => {
    const { phoneNumber, password } = req.body;
    if (!phoneNumber || !password) {
        return res.status(400).json({ message: "Phone number and password required" });
    }
    try {
        const admin = await user_model_1.default.findOne({ phoneNumber, role: "admin" });
        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }
        const isMatch = await bcryptjs_1.default.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }
        const token = jsonwebtoken_1.default.sign({ userId: admin._id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: "2h" });
        return res.status(200).json({ message: "Login successful", token,
            admin: {
                name: admin.name,
                phoneNumber: admin.phoneNumber,
                role: admin.role,
            },
        });
    }
    catch (error) {
        console.error("Login failed for admin user due to : ", error);
        return res.status(400).json({ message: "Login failed", error: error.message });
    }
};
exports.adminLogin = adminLogin;
// GET /api/admin/users?age=XX&pinCode=YYYY&vaccinationStatus=none|firstDose|all
const getUsersWithFilters = async (req, res) => {
    try {
        const { age, pinCode, vaccinationStatus } = req.query;
        const query = { role: "user" };
        if (age)
            query.age = age;
        if (pinCode)
            query.pinCode = pinCode;
        if (vaccinationStatus) {
            if (vaccinationStatus === "none") {
                query["vaccinationStatus.firstDose.vaccinated"] = false;
            }
            else if (vaccinationStatus === "firstDose") {
                query["vaccinationStatus.firstDose.vaccinated"] = true;
                query["vaccinationStatus.secondDose.vaccinated"] = false;
            }
            else if (vaccinationStatus === "all") {
                query["vaccinationStatus.secondDose.vaccinated"] = true;
            }
        }
        const users = await user_model_1.default.find(query).select("-password");
        res.status(200).json({ users });
    }
    catch (error) {
        console.error("Failed to fetch users due to :", error);
        res.status(400).json({ message: "Error fetching users", error: error.message });
    }
};
exports.getUsersWithFilters = getUsersWithFilters;
// GET /api/admin/slot-summary?date=YYYY-MM-DD
const getSlotSummaryByDate = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: "Date is required" });
    }
    try {
        const parsedDate = new Date(date);
        const isoDate = parsedDate.toISOString().split("T")[0]; // YYYY-MM-DD
        const users = await user_model_1.default.find({
            $or: [
                { "vaccinationStatus.firstDose.slotId": { $ne: null } },
                { "vaccinationStatus.secondDose.slotId": { $ne: null } },
            ],
        }).populate([
            { path: "vaccinationStatus.firstDose.slotId", model: "Slot" },
            { path: "vaccinationStatus.secondDose.slotId", model: "Slot" },
        ]);
        let firstDoseCount = 0;
        let secondDoseCount = 0;
        users.forEach((user) => {
            const firstSlot = user.vaccinationStatus.firstDose.slotId;
            const secondSlot = user.vaccinationStatus.secondDose.slotId;
            if (firstSlot && firstSlot.date === isoDate) {
                firstDoseCount++;
            }
            if (secondSlot && secondSlot.date === isoDate) {
                secondDoseCount++;
            }
        });
        const total = firstDoseCount + secondDoseCount;
        return res.status(200).json({
            date: isoDate,
            firstDoseCount,
            secondDoseCount,
            total,
        });
    }
    catch (error) {
        console.error("Error fetching slot summary:", error);
        return res.status(400).json({ message: "Internal Server Error", error: error.message });
    }
};
exports.getSlotSummaryByDate = getSlotSummaryByDate;
// GET /api/admin/slots
const getAllSlotDetails = async (_req, res) => {
    try {
        const slots = await slot_model_1.default.find({
            date: { $gte: "2025-11-01", $lte: "2025-11-30" },
        }).sort({ date: 1, startTime: 1 });
        const formattedSlots = slots.map((slot) => ({
            date: slot.date,
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookedCount: slot.bookedUsers.length,
            remainingCapacity: 10 - slot.bookedUsers.length,
        }));
        return res.status(200).json({ slots: formattedSlots });
    }
    catch (error) {
        console.error("Error fetching slots due to :", error);
        return res.status(400).json({ message: "Error fetching slots ", error: error.message });
    }
};
exports.getAllSlotDetails = getAllSlotDetails;
// GET /api/admin/slots/:date
const getSlotDetailsByDate = async (req, res) => {
    const { date } = req.params; // Date format: YYYY-MM-DD
    try {
        // Fetch slots for the given date
        const slots = await slot_model_1.default.find({ date })
            .sort({ startTime: 1 });
        if (slots.length === 0) {
            return res.status(404).json({ message: "No slots found for the given date" });
        }
        // Format the slot details to include required info
        const formattedSlots = slots.map((slot) => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            bookedCount: slot.bookedUsers.length,
            remainingCapacity: slot.capacity - slot.bookedUsers.length,
        }));
        return res.status(200).json({ slots: formattedSlots });
    }
    catch (error) {
        console.error("Error fetching slot details due to :", error);
        return res.status(400).json({ message: "Error fetching slot details due to : ", error: error.message });
    }
};
exports.getSlotDetailsByDate = getSlotDetailsByDate;
// GET /api/admin/slots/:date/:pinCode
const getVaccinationSlotDetails = async (date, pinCode) => {
    try {
        // Fetch the slots for the given date and pinCode, and populate bookedUsers with full user data
        const slots = await slot_model_1.default.find({ date, pinCode }).populate("bookedUsers");
        let firstDoseSlots = 0;
        let secondDoseSlots = 0;
        let totalRegisteredSlots = 0;
        slots.forEach((slot) => {
            slot.bookedUsers.forEach((user) => {
                const bookedUser = user;
                if (bookedUser.vaccinationStatus.firstDose.vaccinated) {
                    firstDoseSlots += 1;
                }
                if (bookedUser.vaccinationStatus.secondDose.vaccinated) {
                    secondDoseSlots += 1;
                }
            });
            totalRegisteredSlots += slot.bookedUsers.length;
        });
        return {
            firstDoseSlots,
            secondDoseSlots,
            totalRegisteredSlots,
        };
    }
    catch (error) {
        console.error("Error fetching vaccination slot details due:", error);
        throw new Error("Failed to fetch vaccination slot details.");
    }
};
exports.getVaccinationSlotDetails = getVaccinationSlotDetails;
// POST /api/admin/logout
const logOut = async (_req, res) => {
    res.clearCookie("token").status(200).json({ message: "Logged out successfully" });
    console.log("👋 User logged out");
};
exports.logOut = logOut;
