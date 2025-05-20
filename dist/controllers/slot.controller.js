"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.markUsersAsVaccinated = exports.updateSlot = exports.bookSlot = exports.getAvailableSlots = void 0;
const slot_model_1 = __importDefault(require("../models/slot.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
// GET /api/slots/available
const getAvailableSlots = async (req, res) => {
    const { date, pinCode, doseType } = req.query;
    if (!date || !pinCode || !doseType) {
        return res.status(400).json({ message: "Date, pinCode and doseType are required" });
    }
    try {
        const slots = await slot_model_1.default.find({ date, pinCode, doseType });
        const availableSlots = slots.filter((slot) => slot.bookedUsers.length < slot.capacity);
        return res.status(200).json({ availableSlots: availableSlots });
    }
    catch (error) {
        console.error("Failed to fetch slots due to : ", error);
        return res.status(400).json({ message: "Failed to fetch slots", error: error.message });
    }
};
exports.getAvailableSlots = getAvailableSlots;
// POST /api/slots/book
const bookSlot = async (req, res) => {
    const userId = req.user.userId;
    const { slotId, doseType } = req.body;
    if (!slotId || !doseType) {
        return res.status(400).json({ message: "Slot ID and dose type are required" });
    }
    if (!["first", "second"].includes(doseType)) {
        return res.status(400).json({ message: "Invalid dose type" });
    }
    try {
        const user = await user_model_1.default.findById(userId);
        const slot = await slot_model_1.default.findById(slotId);
        if (!user || !slot) {
            return res.status(404).json({ message: "User or Slot not found" });
        }
        if (slot.doseType !== doseType) {
            return res.status(400).json({ message: "Slot dose type mismatch" });
        }
        if (slot.bookedUsers.length >= slot.capacity) {
            return res.status(400).json({ message: "Slot is fully booked" });
        }
        if (doseType === "first" && user.vaccinationStatus.firstDose.slotId) {
            return res.status(400).json({ message: "First dose already booked" });
        }
        if (doseType === "second") {
            if (!user.vaccinationStatus.firstDose.vaccinated) {
                return res.status(400).json({ message: "First dose must be completed first" });
            }
            if (user.vaccinationStatus.secondDose.slotId) {
                return res.status(400).json({ message: "Second dose already booked" });
            }
        }
        // Book user into slot
        slot.bookedUsers.push(user.id);
        await slot.save();
        // Update user's vaccinationStatus
        if (doseType === "first") {
            user.vaccinationStatus.firstDose.slotId = slot.id;
        }
        else {
            user.vaccinationStatus.secondDose.slotId = slot.id;
        }
        await user.save();
        console.log("Slot booked successfully for the user");
        return res.status(200).json({ message: "Slot booked successfully" });
    }
    catch (error) {
        console.error("Error booking slot due to : ", error);
        return res.status(400).json({ message: "Error booking slot", error: error.message });
    }
};
exports.bookSlot = bookSlot;
// PUT /api/slots/change
const updateSlot = async (req, res) => {
    try {
        const { userId, newSlotId, doseType } = req.body;
        if (!userId || !newSlotId || !doseType) {
            return res.status(400).json({ message: "userId, newSlotId, and doseType are required" });
        }
        const user = await user_model_1.default.findById(userId);
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const currentSlotId = doseType === "first" ? user.vaccinationStatus.firstDose.slotId : user.vaccinationStatus.secondDose.slotId;
        if (!currentSlotId) {
            return res.status(400).json({ message: `User hasn't booked ${doseType} dose slot yet` });
        }
        const currentSlot = await slot_model_1.default.findById(currentSlotId);
        const newSlot = await slot_model_1.default.findById(newSlotId);
        if (!currentSlot || !newSlot) {
            return res.status(404).json({ message: "Old or new slot not found" });
        }
        // Check if the user is allowed to change slot (must be 24 hours before old slot time)
        const currentTime = new Date();
        const slotTime = new Date(currentSlot.date);
        const timeDiff = (slotTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60); // in hours
        if (timeDiff < 24) {
            return res.status(400).json({ message: "Cannot change slot within 24 hours of scheduled time" });
        }
        // Remove user from old slot
        currentSlot.bookedUsers = currentSlot.bookedUsers.filter((id) => id.toString() !== user.id.toString());
        await currentSlot.save();
        // Add user to new slot
        if (newSlot.bookedUsers.length >= newSlot.capacity) {
            return res.status(400).json({ message: "Selected slot is already full" });
        }
        newSlot.bookedUsers.push(user.id);
        await newSlot.save();
        // Update user's booked slot
        if (doseType === "first") {
            user.vaccinationStatus.firstDose.slotId = newSlot.id;
        }
        else {
            user.vaccinationStatus.secondDose.slotId = newSlot.id;
        }
        await user.save();
        return res.status(200).json({ message: "Slot updated successfully" });
    }
    catch (error) {
        console.error("Update Slot Error due to :", error);
        return res.status(400).json({ message: "Internal Server Error", error: error.message });
    }
};
exports.updateSlot = updateSlot;
// POST /api/slots/mark-vaccinated  
const markUsersAsVaccinated = async (req, res) => {
    var _a, _b;
    try {
        const now = new Date();
        // Find all slots whose time has passed
        const expiredSlots = await slot_model_1.default.find({ dateTime: { $lt: now } });
        for (const slot of expiredSlots) {
            const users = await user_model_1.default.find({
                _id: { $in: slot.bookedUsers },
            });
            for (const user of users) {
                // Check if this user was booked for first or second dose
                if (((_a = user.vaccinationStatus.firstDose.slotId) === null || _a === void 0 ? void 0 : _a.toString()) ===
                    slot.id.toString() &&
                    !user.vaccinationStatus.firstDose.vaccinated) {
                    user.vaccinationStatus.firstDose.vaccinated = true;
                }
                if (((_b = user.vaccinationStatus.secondDose.slotId) === null || _b === void 0 ? void 0 : _b.toString()) ===
                    slot.id.toString() &&
                    !user.vaccinationStatus.secondDose.vaccinated) {
                    user.vaccinationStatus.secondDose.vaccinated = true;
                }
                await user.save();
            }
        }
        return res.status(200).json({ message: "Vaccination status updated for expired slots" });
    }
    catch (error) {
        console.error("Error in markUsersAsVaccinated due to : ", error);
        return res.status(400).json({ message: "Failed to update vaccination statuses", error: error.message });
    }
};
exports.markUsersAsVaccinated = markUsersAsVaccinated;
