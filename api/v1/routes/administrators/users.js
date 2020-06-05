'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyAdmin } = require("../../../../middlewares/verify_auth");


const UserController = require("../../../v1/controllers/user");

router.get("/",verifyAdmin,UserController.getAllUser);
router.get("/search",verifyAdmin,UserController.searchUsers);
router.get("/filter",verifyAdmin,UserController.filterAllUser);
router.get("/:user_id",verifyAdmin,UserController.getSpecificUser);
router.post("/",verifyAdmin,UserController.createUserAdmin);
router.post("/deactivate",verifyAdmin,UserController.deactivateUser);
router.post("/activate",verifyAdmin,UserController.activateUser);
router.put("/:user_id",verifyAdmin,UserController.updateUserAdmin);
router.delete("/:user_id",verifyAdmin,UserController.deleteAnyUser);

module.exports = router;