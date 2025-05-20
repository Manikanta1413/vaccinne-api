"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
// POST /api/auth/register  --  User Registration API
router.post("/register", auth_controller_1.registerUser);
// POST /api/auth/login  --  User Login API
router.post("/login", auth_controller_1.logInUser);
// POST /api/auth/logout  -- User LogOut API
router.post("/logout", auth_controller_1.logOut);
exports.default = router;
