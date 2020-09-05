'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyUser,verifyNonBlockUser } = require("../../../../middlewares/verify_auth");

const UserController = require("../../controllers/user");


router.put("/token", verifyUser,UserController.updateUserDeviceToken);
router.post("/follow", verifyUser,verifyNonBlockUser,UserController.followerUser);
router.get("/:user_id",verifyUser,verifyNonBlockUser,UserController.getSingleUser);
router.get("/token/:user_id",UserController.getTokenValue);
router.post("/following",verifyUser,UserController.getIsUserFollowing);
router.post("/unfollow",verifyUser,UserController.UnfollowerUser);
router.post("/block",verifyUser,UserController.updateUserBlockList);
router.post("/unblock",verifyUser,UserController.unBlockUser);
router.get("/search",verifyUser,UserController.searchAllUser)
module.exports = router;