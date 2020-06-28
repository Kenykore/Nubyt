var User = require('../../../models/users');
var UserFollowers=require("../../../models/followers")
var Post= require("../../../models/post")
var PostComment= require("../../../models/post_comments")
var ObjectID = require('mongoose').Types.ObjectId;
const { randomNumber, formatPhoneNumber, addLeadingZeros, getUserDetails, getTimeWindow, getNextScheduleDate, getNextSchedulePayment } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const status = require("http-status");
var moment = require('moment')
const config = require("../../../config/index")
const request = require('request-promise')
const validatePostCreation= require("../../../validations/validate_create_post")
const validatePostCommentCreation= require("../../../validations/validate_create_post_comment")
const cloudinary = require('cloudinary').v2;
exports.UploadVideoCloundinary= async (req,res,next)=>{
    try {
        let video= req.body.video
        let name= req.body.name
        let user = req.user_details
        let video_upload=await cloudinary.uploader.upload_large(video,{resource_type: "video", 
        public_id: `video_posts/${user.user_id}/${name}_${new Date(Date.now())}`,format:"mp4",
        transformation:{effect:"progressbar:bar:FFD534:10",quality:"auto:good",duration:60,start_offset: "auto"}})
        if(video_upload){
            return response.sendSuccess({ res, message: "Media Uploaded Successfully", body: { data:video_upload } });
        }
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.CreatePost= async(req,res,next)=>{
    try {
        let user = req.user_details
        const { error } = validatePostCreation({...req.body,user_id:user.user_id});
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });
    let post_created= await Post.create({
        ...req.body,
        time:new Date(Date.now())
    })
    if(post_created){
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
exports.ReportPost=async(req,res,next)=>{
    try {
       let post_id= req.body.post_id
       let post_flagged= await Post.findByIdAndUpdate(post_id,{
           $push:{
            flagged_reasons:req.body.reason
           },
           $inc:{
            flagged_count :1
           }
       }) 
       if(post_flagged){
        return response.sendSuccess({ res, message: "Posts reported successfully", body: post_unliked });
       }
       return response.sendError({ res, message: "Unabled to report Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.CreatePostComment= async(req,res,next)=>{
    try {
        const { error } = validatePostCommentCreation(req.body);
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });
        
        let post_found=await Post.findById(req.body.post_id).lean()
        let user_found= await User.findById(post_found.user_id).lean()
        let user_blocked= user_found. blacklist.find(x=>x===req.user_details.user_id) || {}
        if(user_blocked){
            return response.sendError({
                res,
                message: "You cant perform this action",
                statusCode:status.FORBIDDEN
            });
        }
        if(!post_found){
            return response.sendError({
                res,
                message: "Unable to create Post Comment,Post not found",
                statusCode:status.NOT_FOUND
            });  
        }
        if(post_found.comment_disabled){
            return response.sendError({
                res,
                message: "Post Comment disabled",
                statusCode:status.NOT_FOUND
            });  
        }
    let post_comment_created= await PostComment.create({
        ...req.body,
        time:new Date(Date.now())
    })
    if(post_comment_created){
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
exports.GetUsersPost= async(req,res,next)=>{
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        const totalposts = await Post.find({
           user_id:user.user_id,
           flagged_count:{ $lt: 20 }
        }).countDocuments();
        const posts = await Post.find({
            user_id:user.user_id ,
            flagged_count:{ $lt: 20 }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(posts && posts.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetPostComments= async(req,res,next)=>{
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        const totalposts = await PostComment.find({
           post_id:req.params.post_id
        }).countDocuments();
        const post_comments = await PostComment.find({
            post_id:req.params.post_id
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(post_comments && post_comments.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetPostCommentsReplies=async(req,res,next)=>{
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        const totalposts = await PostComment.find({
           post_id:req.params.post_id,
           comment_id:req.params.comment_id,
           comment_type:"reply"
        }).countDocuments();
        const post_comments = await PostComment.find({
            post_id:req.params.post_id,
            comment_id:req.params.comment_id,
            comment_type:"reply"
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(post_comments && post_comments.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetAUserPost= async(req,res,next)=>{
    try {
        let user = req.params.user_id
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        const totalposts = await Post.find({
           user_id:user,
           flagged_count:{ $lt: 20 }
        }).countDocuments();
        const posts = await Post.find({
            user_id:user,
            flagged_count:{ $lt: 20 }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(posts && posts.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetUsersFollowingPost=  async(req,res,next)=>{
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        let user_following=await UserFollowers.find({follower_id:user.user_id}).lean()
        if(!user_following){
            return response.sendError({ res, message: "No Post found", statusCode: status.NOT_FOUND }); 
        }
        let following=[]
        for(let f of user_followers){
            let user_following=await User.findById(f.user_id).lean()
            let user_blocked= user_following.blacklist.find(x=>x===user.user_id) || {}
        if(!user_blocked){
            following.push(f.user_id)
        } 
        }
        const totalposts = await Post.find({
            flagged_count:{ $lt: 20 },
           user_id:{ $in: following }
        }).countDocuments();
        const posts = await Post.find({
            flagged_count:{ $lt: 20 },
            user_id:{ $in: following }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(posts && posts.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetRelatedUsersPost=async(req,res,next)=>{
    try {
        let user = req.user_details
        const postPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        
        const totalposts = await Post.find({
            flagged_count:{ $lt: 20 },
           user_id:{ $in: user.favourites||[] }
        }).countDocuments();
        const posts = await Post.find({
            flagged_count:{ $lt: 20 },
            user_id:{ $in: user.favourites||[] }
        }).sort({ _id: "desc" }).skip(skip).limit(postPerPage);
        const totalPages = Math.ceil(totalposts / postPerPage);
        if(posts && posts.length){
            const responseContent = {
                "total_posts": totalposts,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
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
exports.GetSinglePost=async (req,res,next)=>{
    try {
        if (!req.params.post_id) {
            return response.sendError({ res, message: "No post id found" });
        } 
        const post = await Post.findOne({_id:ObjectID(req.params.post_id), flagged_count:{ $lt: 20 }}).lean()
        if(post){
            return response.sendSuccess({
                res,
                message: "User record found",
                body: { data: post }
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
exports.LikePost=async(req,res,next)=>{
    try {
       let post_id= req.params.post_id
       let user= req.user_details
       let post_liked= await Post.findByIdAndUpdate(post_id,{
           $push:{
               user_likes:{
                   user_id:user.user_id,
                   username:user.username,
                   time:new Date(Date.now())
               }
           },
           $inc:{
               likes:1
           }
       }) 
       if(post_liked){
        return response.sendSuccess({ res, message: "Posts liked", body: post_liked });
       }
       return response.sendError({ res, message: "Unabled to like Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.UnLikePost=async(req,res,next)=>{
    try {
       let post_id= req.params.post_id
       let user= req.user_details
       let post_unliked= await Post.findByIdAndUpdate(post_id,{
           $pull:{
               user_likes:{
                   user_id:user.user_id,
               }
           },
           $inc:{
               likes:-1
           }
       }) 
       if(post_unliked){
        return response.sendSuccess({ res, message: "Posts unliked", body: post_unliked });
       }
       return response.sendError({ res, message: "Unabled to unlike Post" });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.deleteUserPost=async(req,res,next)=>{
    try {
        let user = req.user_details
        let post_id= req.params.post_id
        let post_delete= Post.findOneAndDelete({_id:ObjectID(post_id),user_id:user.user_id})
        if(post_delete){
            return response.sendSuccess({ res, message: "Posts deleted", body: post_delete });
        }
        return response.sendError({ res, message: "Could not delete Post"});
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.deleteUserPostComment=async(req,res,next)=>{
    try {
        let user = req.user_details
        let post_id= req.params.post_comment_id
        let post_delete= PostComment.findOneAndDelete({_id:ObjectID(post_id),user_id:user.user_id})
        if(post_delete){
            return response.sendSuccess({ res, message: "Post comment deleted", body: post_delete });
        }
        return response.sendError({ res, message: "Could not delete Post comment"});
    } catch (error) {
        console.log(error)
        next(error)
    }
}