'use strict';
require("dotenv").config();
const express = require("express");
const router = express.Router();

// middleware
const { verifyUser,verifyNonBlockUser } = require("../../../../middlewares/verify_auth");

const PostController = require("../../controllers/post");
router.post("/", verifyUser,PostController.CreatePost);
router.post("/live", verifyUser,PostController.CreateLivePost);
router.post("/live/join", verifyUser,PostController.JoinLivePost);
router.post("/live/leave", verifyUser,PostController.LeaveLivePost);
router.post("/live/end", verifyUser,PostController.endLivePost);
router.post("/upload", verifyUser,PostController.UploadVideoCloundinary);
router.post("/upload/notification",PostController.uploadFinishedCloudinary);
router.post("/comment", verifyUser,PostController.CreatePostComment);
router.post("/report", verifyUser,PostController.ReportPost);
router.post("/view",PostController.viewPost);
router.post("/like", verifyUser,PostController.LikePost);
router.post("/unlike", verifyUser,PostController.UnLikePost);
router.get("/",verifyUser,PostController.GetUsersPost)
router.get("/live",verifyUser,PostController.GetLivePosts)
router.get("/live/user",verifyUser,PostController.GetUserLivePost)
router.get("/following",verifyUser,PostController.GetUsersFollowingPost)
router.get("/related",verifyUser,PostController.GetRelatedUsersPost)
router.get("/trending",verifyUser,PostController.GetTrendingTagPost)
router.get("/tags/:tag",verifyUser,PostController.GetPostByTag)
router.get("/comment/:post_id",verifyUser,PostController.GetPostComments)
router.get("/comment/replies/:post_id/:comment_id",verifyUser,PostController.GetPostCommentsReplies)
router.get("/user-post/:user_id",verifyUser,verifyNonBlockUser,PostController.GetAUserPost)
router.get("/:post_id",verifyUser,PostController.GetSinglePost);
router.delete("/:post_id",verifyUser,PostController.deleteUserPost)
router.delete("/comment/:post_comment_id",verifyUser,PostController.deleteUserPostComment)

module.exports = router;

