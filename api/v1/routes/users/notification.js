'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyUser,verifyNonBlockUser } = require("../../../../middlewares/verify_auth");

const NotificationController = require("../../controllers/notification");


router.get("/",verifyUser,NotificationController.getNotification);
module.exports = router;