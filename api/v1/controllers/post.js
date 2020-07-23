var User = require('../../../models/users');
var UserFollowers = require("../../../models/followers")
var Post = require("../../../models/post")
var LivePost=require("../../../models/live_post")
var NotificationController=require("./notification");
var Upload = require("../../../models/uploads")
var PostComment = require("../../../models/post_comments")
var ObjectID = require('mongoose').Types.ObjectId;
const { randomNumber, formatPhoneNumber, addLeadingZeros, getUserDetails, getTimeWindow, getNextScheduleDate, getNextSchedulePayment } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const status = require("http-status");
var moment = require('moment')
const config = require("../../../config/index")
const request = require('request-promise')
const validatePostCreation = require("../../../validations/validate_create_post")
const validateLivePostCreation = require("../../../validations/validate_create_live")

const validatePostCommentCreation = require("../../../validations/validate_create_post_comment")
const cloudinary = require('cloudinary').v2;
const socket = require("../../../services/Socket")
var firebase_admin = require("firebase-admin");

const convertToBase64 = require("base64-arraybuffer")
exports.uploadViaSocket = async (details) => {
    try {
        console.log(details, "details")
        let file = await uploadFile(details.name, details.video, details.mode)
        let url = await file.file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
        })
        console.log("processing upload via socket", details)
        console.log("file uploaded", url)
        let video = url[0]
        let name = details.name
        let user = details.user_id
        if (details.mode === "video") {
            let public_id = `video_posts/${user}/${name}`
            let video_upload = await cloudinary.uploader.upload_large(video, {
                resource_type: "video",
                public_id: public_id, format: "mp4",
                secure: true,
                //     eager_async:true, 
                //     eager_notification_url:"https://nubyt-api.herokuapp.com/post/user/upload/notification",
                //     eager:[{
                //         fetch_format:"auto",
                //         duration:60,
                //         start_offset:0,
                //         end_offset:60,
                //         effect:"progressbar:bar:yellow:30"
                //     },{
                //         quality:"auto",
                //         dpr: "2.0",
                //         gravity: "auto",
                //         aspect_ratio: "1:1",
                //     }, 
                //    {streaming_profile: "sd", format: "m3u8"}]
            })


            if (video_upload) {
                socket.emitEvent("upload_video_done", details.user_id, { data: video_upload, success: true, message: "Upload Done" })
                return { message: "Media Uploaded Successfully", body: { data: video_upload }, error: null };
            }
        }
        else {
            let public_id = `music_posts/${user}/${name}`
            let music_upload = await cloudinary.uploader.upload_large(video, {
                resource_type: "video",
                public_id: public_id,
                // eager_async:true, 
                // eager_notification_url:"https://nubyt-api.herokuapp.com/post/user/upload/notification",
                // eager:[{
                //     fetch_format:"auto",
                //     duration:60,
                //     start_offset:0,
                //     end_offset:60,
                // }],
            })

            if (music_upload) {
                // let music=cloudinary.video(details.video_id, {overlay: `video:${public_id}`, start_offset: "0", end_offset: "60",})
                socket.emitEvent("upload_music_done", details.user_id, { music: music_upload, success: true, message: "Upload Done" })
                return { message: "Media Uploaded Successfully", body: { data: music_upload }, error: null };
            }
        }

    } catch (error) {
        console.log(error)
        return { error: error, success: false, message: error.message }
    }
}
exports.uploadFinishedCloudinary = async (req, res, next) => {
    try {
        let uploadData = req.body
        console.log(uploadData.public_id, "data")
        let upload_found = await Upload.findOne({ public_id: uploadData.public_id }).lean()
        if (upload_found.mode === "music") {
            let music = cloudinary.video(upload_found.video_id, { overlay: `video:${uploadData.public_id}`, start_offset: "0", end_offset: "60", })
            socket.emitEvent("upload_music_done", upload_found.user_id, { music: music, success: true, message: "Upload Done" })
        }
        else if (upload_found.mode === "video") {
            socket.emitEvent("upload_video_done", upload_found.user_id, { data: uploadData, success: true, message: "Upload Done" })
        }
        else {
            socket.emitEvent("upload_error", upload_found.user_id, { data: uploadData, success: false, message: `Failed to upload data` })
        }
        return res.send("done").status(200)
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.UploadVideoCloundinary = async (req, res, next) => {
    try {
        let details = req.body
        let file = await uploadFile(details.name, details.video, details.mode)
        let url = await file.file.getSignedUrl({
            action: 'read',
            expires: '03-09-2491'
        })
        console.log("processing upload via socket", details)
        console.log("file uploaded", url)
        let video = url[0]
        let name = details.name
        let user = details.user_id
        if (details.mode === "video") {
            let public_id = `video_posts/${user}/${name}_${new Date(Date.now())}`
            let video_upload = await cloudinary.uploader.upload_large(video, {
                resource_type: "video",
                public_id: public_id, format: "mp4",
                eager_async: true,
                eager_notification_url: "https://nubyt-api.herokuapp.com/post/user/upload/notification",
                eager: [{
                    fetch_format: "auto",
                    duration: 60,
                    start_offset: 0,
                    end_offset: 60,
                    effect: "progressbar:bar:FFD534:30"
                }, {
                    quality: "auto",
                    dpr: "2.0",
                    gravity: "auto",
                    aspect_ratio: "1:1",
                },
                { streaming_profile: "full_hd", format: "m3u8" }]
            })
            let upload = await Upload.create({
                user_id: details.user_id,
                public_id: public_id,
                time: new Date(Date.now()),
                mode: details.mode,
            })
            if (video_upload) {
                return response.sendSuccess({ res, message: "Media Uploaded Successfully", body: { data: video_upload } });
            }
        }
        else {
            let public_id = `music_posts/${user}/${name}_${new Date(Date.now())}`
            let music_upload = await cloudinary.uploader.upload_large(video, {
                resource_type: "video",
                public_id: public_id,
                eager_async: true,
                eager_notification_url: "https://nubyt-api.herokuapp.com/post/user/upload/notification",
                eager: [{
                    fetch_format: "auto",
                    duration: 60,
                    start_offset: 0,
                    end_offset: 60,
                }],
            })
            let upload = await Upload.create({
                user_id: details.user_id,
                public_id: public_id,
                time: new Date(Date.now()),
                mode: details.mode,
                video_id: details.video_id
            })
            if (music_upload) {
                return response.sendSuccess({ res, message: "Media Uploaded Successfully", body: { data: music_upload } });
            }
        }
        return response.sendError({ res, message: "Media Uploaded Failed" });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.CreatePost = async (req, res, next) => {
    try {
        let user = req.user_details
        const { error } = validatePostCreation({ ...req.body, user_id: user.user_id });
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });
        let poster_image = cloudinary.image(`${req.body.media_id}.jpg`, { secure: true, resource_type: "video" })
        let myRegex = /<img[^>]+src='?([^"\s]+)'?\s*\/>/g;
        let image = myRegex.exec(poster_image)
        let post_created = await Post.create({
            ...req.body,
            user_id:user.user_id,
            poster_image: `${image[1].slice(0, image[1].length - 1)}`,
        })
        if (post_created) {
            return response.sendSuccess({ res, message: "Post Created Successfully", body: { post: post_created } });
        }
        return response.sendError({
            res,
            message: "Unable to create Post"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.CreateLivePost = async (req, res, next) => {
    try {
        let user = req.user_details
        const { error } = validateLivePostCreation({ ...req.body, user_id: user.user_id });
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });
        let poster_image = cloudinary.image(`${req.body.media_id}.jpg`, { secure: true, resource_type: "video" })
        let myRegex = /<img[^>]+src='?([^"\s]+)'?\s*\/>/g;
        let image = myRegex.exec(poster_image)
        //create socket id for chatroom
        let post_created = await LivePost.create({
            ...req.body,
            user_id:user.user_id,
            start_time:new Date(Date.now()),
            poster_image: `${image[1].slice(0, image[1].length - 1)}`,
        })
        //send notification to user followers
        if (post_created) {
            let namespace= socket.emitEvent(`/live/${post_created.user_id}`)
            namespace.emit("live_started",user)
            return response.sendSuccess({ res, message: "Live Post Created Successfully", body: { post: post_created } });
        }
        return response.sendError({
            res,
            message: "Unable to create Live Post"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.endLivePost=async (req, res, next) => {
    try {
        let user = req.user_details
        let post_id=req.body.post_id
        console.log(post_id,"post id")
        let post_ended = await LivePost.findByIdAndUpdate(post_id,{
            ended:true,
            end_time:new Date(Date.now())
        },{new:true,})
        console.log(post_ended,"post ended")
        if (post_ended) {
            let namespace= socket.emitEvent(`/live/${post_ended.user_id}`)
            namespace.emit("live_ended",true)
            return response.sendSuccess({ res, message: "Live Post Ended Successfully", body: { post: post_ended } });
        }
        return response.sendError({
            res,
            message: "Unable to end Live Post"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.JoinLivePost = async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let user = req.user_details
        let post_joined = await LivePost.findByIdAndUpdate(post_id, {
            $push: {
                watching: {
                    user_id: user.user_id,
                    image:user.profilePic || null,
                    username: user.username,
                    time: new Date(Date.now())
                }
            },
            $inc: {
                views: 1
            }
        }, { new: true, upsert: true }).lean()       
        if (post_joined) {
            let namespace= socket.emitEvent(`/live/${post_joined.user_id}`)
            namespace.emit("user_joined",user)
            let user_posting = await User.findById(post_joined.user_id).lean()
            return response.sendSuccess({ res, message: "Live Joined", body: { ...post_joined, user: user_posting} });
        }
        return response.sendError({ res, message: "Unabled to join post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.LeaveLivePost=async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let user = req.user_details
        let post_leave = await LivePost.findByIdAndUpdate(post_id, {
            $pull: {
                watching: {
                    user_id: user.user_id,
                }
            },
            $inc: {
                likes: -1
            }
        }, { new: true, upsert: true }).lean()
        if (post_leave) {
            let namespace= socket.emitEvent(`/live/${post_leave.user_id}`)
            namespace.emit("user_left",user)
            let user_posting = await User.findById(post_leave.user_id).lean()
            return response.sendSuccess({ res, message: "Live Posts left", body: { ...post_leave, user: user_posting } });
        }
        return response.sendError({ res, message: "Unabled to leave live post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetUserLivePost=async(req,res,next)=>{
    try {
        let user = req.user_details
        let user_id=req.query.user_id
        console.log("working")
        const post = await LivePost.findOne({
            flagged_count: { $lt: 20 },
            ended:false,
            user_id:user_id,
        }).lean()
        console.log(post,"post")
        if (post) {
            let user = await User.findById(post.user_id).lean()
            return response.sendSuccess({
                res,
                message: "Post record found",
                body: { data: { ...post, user: user } }
            });
        }
        return response.sendError({
            res,
            message: "Post not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetLivePosts = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        console.log(user, "user")
        let user_following = await UserFollowers.find({ follower_id: user.user_id }).lean()
        console.log(user_following, "user following")
        if (!user_following) {
            return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
        }
        let following = []
        for (let f of user_following) {
            let user_data = await User.findById(f.user_id).lean()
            console.log(user_data, "user")
            if (user_data.blacklist && user_data.blacklist.length > 0) {
                let user_blocked = user_data.blacklist.find(x => x === user.user_id)
                if (!user_blocked) {
                    following.push(f.user_id)
                }
                continue
            }
            following.push(f.user_id)

        }
        following.push(user.user_id)
        console.log(following, "following users")
        const totalposts = await LivePost.find({
            flagged_count: { $lt: 20 },
            ended:false,
             $and: [{user_id:{$in: following }},{user_id:{$nin:user.blacklist}}]
        }).countDocuments();
        const posts = await LivePost.find({
            flagged_count: { $lt: 20 },
            ended:false,
            $and: [{user_id:{$in: following }},{user_id:{$nin:user.blacklist}}]
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage).lean();
        const totalPages = Math.ceil(totalposts / postPerPage);
        let post_data = []
        for (let p of posts) {
            let user = await User.findById(p.user_id).lean()
            post_data.push({ ...p, user: user, })
        }
        if (post_data && post_data.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: post_data
            }
            return response.sendSuccess({ res, message: "Live Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Live Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.ReportPost = async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let post_flagged = await Post.findByIdAndUpdate(post_id, {
            $push: {
                flagged_reasons: req.body.reason
            },
            $inc: {
                flagged_count: 1
            }
        }, { new: true }).lean()
        if (post_flagged) {
            let user = await User.findById(post_flagged.user_id).lean()
            let comment_count = await PostComment.countDocuments({ post_id: post_flagged._id }) || 0
            return response.sendSuccess({ res, message: "Posts reported successfully", body: { ...post_unliked, user: user, comment_count: comment_count } });
        }
        return response.sendError({ res, message: "Unabled to report Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.viewPost = async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let post_viewed = await Post.findByIdAndUpdate(post_id, {
            $inc: {
                views: 1
            }
        }, { new: true, upsert: true }).lean()
        if (post_viewed) {
            let user = await User.findById(post_viewed.user_id).lean()
            let comment_count = await PostComment.countDocuments({ post_id: post_viewed._id })
            return response.sendSuccess({ res, message: "Posts viewed successfully", body: { ...post_viewed, user: user, comment_count: comment_count } });
        }
        return response.sendError({ res, message: "Unabled to report viewing Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.CreatePostComment = async (req, res, next) => {
    try {
        let user=req.user_details
        const { error } = validatePostCommentCreation(req.body);
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });

        let post_found = await Post.findById(req.body.post_id).lean()
        let user_found = await User.findById(post_found.user_id).lean()
        let user_blocked = user_found.blacklist.find(x => x === req.user_details.user_id)
        console.log(user_blocked)
        if (user_blocked) {
            return response.sendError({
                res,
                message: "You cant perform this action",
                statusCode: status.FORBIDDEN
            });
        }
        if (!post_found) {
            return response.sendError({
                res,
                message: "Unable to create Post Comment,Post not found",
                statusCode: status.NOT_FOUND
            });
        }
        if (post_found.comment_disabled) {
            return response.sendError({
                res,
                message: "Post Comment disabled",
                statusCode: status.NOT_FOUND
            });
        }
        let post_comment_created = await PostComment.create({
            ...req.body,
            time: new Date(Date.now())
        })
        if (post_comment_created) {
            let time= new Date(Date.now())
            let data={
                user_id:req.user_details.user_id,
                recipient_id:post_found.user_id,
                post_id:post_found._id,
                message:`${user.username}commented ${post_comment_created.description} on your post ${moment(time).toNow()}`   ,
                time:time,
                notification_type:"chat"
            }
            NotificationController.saveNotification(data)
            return response.sendSuccess({ res, message: "Post Comment Created Successfully", body: { post: post_comment_created } });
        }
        return response.sendError({
            res,
            message: "Unable to create Post Comment"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetUsersPost = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        const totalposts = await Post.find({
            user_id: user.user_id,
            flagged_count: { $lt: 20 }
        }).countDocuments();
        const posts = await Post.find({
            user_id: user.user_id,
            flagged_count: { $lt: 20 }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if (posts && posts.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: posts
            }
            return response.sendSuccess({ res, message: "Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetPostComments = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        const totalposts = await PostComment.find({
            post_id: req.params.post_id
        }).countDocuments();
        const post_comments = await PostComment.find({
            post_id: req.params.post_id
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage).lean();
        const totalPages = Math.ceil(totalposts / postPerPage);
        let comment_data = []
        for (let c of post_comments) {
            let user = await User.findById(c.user_id).lean()
            comment_data.push({ ...c, user: user })
        }
        if (comment_data && comment_data.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: comment_data
            }
            return response.sendSuccess({ res, message: "Posts Comments  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post Comments found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetPostCommentsReplies = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        const totalposts = await PostComment.find({
            post_id: req.params.post_id,
            comment_id: req.params.comment_id,
            comment_type: "reply"
        }).countDocuments();
        const post_comments = await PostComment.find({
            post_id: req.params.post_id,
            comment_id: req.params.comment_id,
            comment_type: "reply"
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if (post_comments && post_comments.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: post_comments
            }
            return response.sendSuccess({ res, message: "Posts Comments  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post Comments found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetAUserPost = async (req, res, next) => {
    try {
        let user = req.params.user_id
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        const totalposts = await Post.find({
            user_id: user,
            flagged_count: { $lt: 20 }
        }).countDocuments();
        const posts = await Post.find({
            user_id: user,
            flagged_count: { $lt: 20 }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if (posts && posts.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: posts
            }
            return response.sendSuccess({ res, message: "Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetUsersFollowingPost = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;
        console.log(user, "user")
        let user_following = await UserFollowers.find({ follower_id: user.user_id }).lean()
        console.log(user_following, "user following")
        if (!user_following) {
            return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
        }
        let following = []
        for (let f of user_following) {
            let user_data = await User.findById(f.user_id).lean()
            console.log(user_data, "user")
            if (user_data.blacklist && user_data.blacklist.length > 0) {
                let user_blocked = user_data.blacklist.find(x => x === user.user_id)
                if (!user_blocked) {
                    following.push(f.user_id)
                }
                continue
            }
            following.push(f.user_id)

        }
        following.push(user.user_id)
        console.log(following, "following users")
        const totalposts = await Post.find({
            flagged_count: { $lt: 20 },
             $and: [{user_id:{$in: following }},{user_id:{$nin:user.blacklist}}]
        }).countDocuments();
        const posts = await Post.find({
            flagged_count: { $lt: 20 },
            $and: [{user_id:{$in: following }},{user_id:{$nin:user.blacklist}}]
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage).lean();
        const totalPages = Math.ceil(totalposts / postPerPage);
        let post_data = []
        for (let p of posts) {
            let user = await User.findById(p.user_id).lean()
            let comment_count = await PostComment.countDocuments({ post_id: p._id }) || 0
            post_data.push({ ...p, user: user, comment_count: comment_count })
        }
        if (post_data && post_data.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: post_data
            }
            return response.sendSuccess({ res, message: "Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetTrendingTagPost = async (req, res, next) => {
    try {
        let user = req.user_details
     let post_found= await Post.aggregate([
            {
                $sort: { "createdAt": -1 }    
            },
            {
                $match:{flagged_count: { $lt: 20 },visibility:"public",user_id:{$nin:user.blacklist || []}}
            },
            {
                $unwind: { path: "$tags" }
              },
              {
                $group : { _id : "$tags", data: { $push: "$$ROOT" }, count: { $sum: 1 }, },
              },  
              {
                $sort: { "count": -1 }
              },
              {
                $limit:5
              },
        ])
        if (post_found && post_found.length) {
            return response.sendSuccess({
                res,
                message: "Post Tags found",
                body: { data: post_found }
            });
        }
        return response.sendError({
            res,
            message: "Post trending tags not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetPostByTag = async (req, res, next) => {
    try {
        let user = req.user_details
        let tag= req.params.tag
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;

        const totalposts = await Post.find({
            flagged_count: { $lt: 20 },visibility:"public",user_id:{$nin:user.blacklist || []},tags:{$in:[tag]}
        }).countDocuments();
        const posts = await Post.find({
            flagged_count: { $lt: 20 },visibility:"public",user_id:{$nin:user.blacklist || []},tags:{$in:[tag]}
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage).lean();
        let post_data = []
        for (let p of posts) {
            let user_following = await UserFollowers.find({ user_id: p.user_id }).lean()
            console.log(user_following, "user following")
            let user_data = await User.findById(p.user_id).lean()
            console.log(user_data, "user")
            if (user_data.blacklist && user_data.blacklist.length > 0) {
                let user_blocked = user_data.blacklist.find(x => x === user.user_id)
                if (!user_blocked) {
                    let comment_count = await PostComment.countDocuments({ post_id: p._id }) || 0
                    post_data.push({
                        ...p, user: user_data,
                        followers: user_following,
                        comment_count: comment_count
                    })
                    continue
                }
                continue
            }
            let comment_count = await PostComment.countDocuments({ post_id: p._id }) || 0
            post_data.push({
                ...p, user: user_data,
                followers: user_following,
                comment_count: comment_count
            })
        }
        const totalPages = Math.ceil(totalposts / postPerPage);
        if (post_data && post_data.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: post_data
            }
            return response.sendSuccess({ res, message: "Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetRelatedUsersPost = async (req, res, next) => {
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * postPerPage;

        const totalposts = await Post.find({
            flagged_count: { $lt: 20 },visibility:"public",user_id:{$nin:user.blacklist}
        }).countDocuments();
        const posts = await Post.find({
            flagged_count: { $lt: 20 },visibility:"public",user_id:{$nin:user.blacklist}
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage).lean();
        let post_data = []
        for (let p of posts) {
            let user_following = await UserFollowers.find({ user_id: p.user_id }).lean()
            console.log(user_following, "user following")
            let user_data = await User.findById(p.user_id).lean()
            console.log(user_data, "user")
            if (user_data.blacklist && user_data.blacklist.length > 0) {
                let user_blocked = user_data.blacklist.find(x => x === user.user_id)
                if (!user_blocked) {
                    let comment_count = await PostComment.countDocuments({ post_id: p._id }) || 0
                    post_data.push({
                        ...p, user: user_data,
                        followers: user_following,
                        comment_count: comment_count
                    })
                    continue
                }
                continue
            }
            let comment_count = await PostComment.countDocuments({ post_id: p._id }) || 0
            post_data.push({
                ...p, user: user_data,
                followers: user_following,
                comment_count: comment_count
            })
        }
        const totalPages = Math.ceil(totalposts / postPerPage);
        if (post_data && post_data.length) {
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": postPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: post_data
            }
            return response.sendSuccess({ res, message: "Posts  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetSinglePost = async (req, res, next) => {
    try {
        let user = req.user_details
        if (!req.params.post_id) {
            return response.sendError({ res, message: "No post id found" });
        }

        const post = await Post.findOne({ _id: ObjectID(req.params.post_id), flagged_count: { $lt: 20 }}).lean()
        let user_data = await User.findById(post.user_id).lean()
        console.log(user_data, "user")
        if (user_data.blacklist && user_data.blacklist.length > 0) {
            let user_blocked = user_data.blacklist.find(x => x === user.user_id)
            if (user_blocked) {
                return response.sendError({
                    res,
                    message: "Not allowed to view this Post",
                    statusCode: status.FORBIDDEN
                });
            }
        }
        if (post) {
            let user = await User.findById(post.user_id).lean()
            let comment_count = await PostComment.count({post_id:post._id})
            return response.sendSuccess({
                res,
                message: "User record found",
                body: { data: { ...post, user: user, comment_count: comment_count } }
            });
        }
        return response.sendError({
            res,
            message: "Post not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.LikePost = async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let user = req.user_details
        let post_liked = await Post.findByIdAndUpdate(post_id, {
            $push: {
                user_likes: {
                    user_id: user.user_id,
                    username: user.username,
                    time: new Date(Date.now())
                }
            },
            $inc: {
                likes: 1
            }
        }, { new: true, upsert: true }).lean()
        if (post_liked) {
            let user = await User.findById(post_liked.user_id).lean()
            let comment_count = await PostComment.countDocuments({ post_id: post_liked._id })
            let time=new Date(Date.now())
            let data={
                user_id:req.user_details.user_id,
                recipient_id:post_liked.user_id,
                post_id:post_liked._id.toString(),
                message:`${req.user_details.username}liked your post ${moment(time).toNow()}`   ,
                time:time,
                notification_type:"like"
            }
            NotificationController.saveNotification(data)
            return response.sendSuccess({ res, message: "Posts liked", body: { ...post_liked, user: user, comment_count: comment_count } });
        }
        return response.sendError({ res, message: "Unabled to like Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.UnLikePost = async (req, res, next) => {
    try {
        let post_id = req.body.post_id
        let user = req.user_details
        let post_unliked = await Post.findByIdAndUpdate(post_id, {
            $pull: {
                user_likes: {
                    user_id: user.user_id,
                }
            },
            $inc: {
                likes: -1
            }
        }, { new: true, upsert: true }).lean()
        if (post_unliked) {
            let user = await User.findById(post_unliked.user_id).lean()
            let comment_count = await PostComment.countDocuments({ post_id: post_unliked._id })
            return response.sendSuccess({ res, message: "Posts unliked", body: { ...post_unliked, user: user, comment_count: comment_count } });
        }
        return response.sendError({ res, message: "Unabled to unlike Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.deleteUserPost = async (req, res, next) => {
    try {
        let user = req.user_details
        let post_id = req.params.post_id
        let post_delete = Post.findOneAndDelete({ _id: ObjectID(post_id), user_id: user.user_id })
        if (post_delete) {
            return response.sendSuccess({ res, message: "Posts deleted", body: post_delete });
        }
        return response.sendError({ res, message: "Could not delete Post" });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.deleteUserPostComment = async (req, res, next) => {
    try {
        let user = req.user_details
        let post_id = req.params.post_comment_id
        let post_delete = PostComment.findOneAndDelete({ _id: ObjectID(post_id), user_id: user.user_id })
        if (post_delete) {
            return response.sendSuccess({ res, message: "Post comment deleted", body: post_delete });
        }
        return response.sendError({ res, message: "Could not delete Post comment" });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
function uploadFile(filename, image, type = "video") {
    return new Promise((resolve) => {
        let bucket = firebase_admin.storage().bucket();
        const file = bucket.file(filename);
        file.save(image, {
            metadata: { contentType: type === "video" ? "video/mp4" : "audio/mp3" },
            public: true,
            validation: 'md5'
        }, function (error) {

            if (error) {
                console.log('Unable to upload the image.', error);
                resolve({ success: true, error: error, file: null })
            }

            resolve({ success: true, error: null, file: file })
        });
    }, (error) => {
        resolve({ success: false, error: error, file: null })
    })
}