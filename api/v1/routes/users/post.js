'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyUser,verifyNonBlockUser } = require("../../../../middlewares/verify_auth");

const PostController = require("../../controllers/post");
router.post("/", verifyUser,PostController.CreatePost);
router.post("/comment", verifyUser,PostController.CreatePostComment);
router.post("/report", verifyUser,PostController.ReportPost);
router.post("/like", verifyUser,PostController.LikePost);
router.post("/unlike", verifyUser,PostController.UnLikePost);
router.get("/",verifyUser,PostController.GetUsersPost)
router.get("/following",verifyUser,PostController.GetUsersFollowingPost)
router.get("/related",verifyUser,PostController.GetRelatedUsersPost)
router.get("/comment/:post_id",verifyUser,PostController.GetPostComments)
router.get("/comment/replies/:post_id/:comment_id",verifyUser,PostController.GetPostCommentsReplies)
router.get("/:user_id",verifyUser,verifyNonBlockUser,PostController.GetAUserPost)
router.get("/:post_id",verifyUser,PostController.GetSinglePost);
router.delete("/:post_id",verifyUser,PostController.deleteUserPost)
router.delete("/:post_comment_id",verifyUser,PostController.deleteUserPostComment)



