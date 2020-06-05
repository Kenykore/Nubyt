'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyAdmin } = require("../../../../middlewares/verify_auth");

// Administrator Controller
const AdministratorController = require("../../controllers/admin");


router.post("/", AdministratorController.CreateAdmin);
router.post("/password/reset",AdministratorController.resetPassword)
router.post("/password/forget",AdministratorController.forgotPassword)
router.post("/login",AdministratorController.LoginAdmin)

module.exports = router;