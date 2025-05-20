"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/users/profile  --  Display User Details
router.get("/profile", auth_middleware_1.authenticate, user_controller_1.getUserProfile);
exports.default = router;
