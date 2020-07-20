'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyUser,verifyNonBlockUser } = require("../../../../middlewares/verify_auth");

const ChatController = require("../../controllers/chat");

router.post("/", verifyUser,verifyNonBlockUser,ChatController.CreateChat);
router.get("/",verifyUser,ChatController.GetUserChat);
router.get("/message",verifyUser,ChatController.GetChatMessage);
module.exports = router;