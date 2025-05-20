"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const slot_controller_1 = require("../controllers/slot.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/slots/available --  Displays all the available slots
router.get("/available", slot_controller_1.getAvailableSlots);
// POST /api/slots/book  --  Books the slot selected by the user
router.post("/book", auth_middleware_1.authenticate, slot_controller_1.bookSlot);
// PUT /api/slots/change  --  Updates User slot details
router.put("/change", auth_middleware_1.authenticate, slot_controller_1.updateSlot);
// POST /api/slots/mark-vaccinated  
router.post("/mark-vaccinated", slot_controller_1.markUsersAsVaccinated);
exports.default = router;
