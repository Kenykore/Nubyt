var ObjectID = require('mongoose').Types.ObjectId;
const { randomNumber, formatPhoneNumber, addLeadingZeros, getUserDetails, getTimeWindow, getNextScheduleDate, getNextSchedulePayment } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const status = require("http-status");
var moment = require('moment')
const config = require("../../../config/index")
var Notification = require("../../../models/notifications")
var User= require("../../../models/users")
var Post=require("../../../models/post")
var firebase_admin = require("firebase-admin");
const socket = require("../../../services/Socket")
exports.saveNotification= async (data)=>{
    try {
        if(!data){
            return
        }
        let notification_saved= await Notification.create(data)
       let reciever=socket.emitEvent(`/notify/${data.recipient_id}`)
       reciever.emit("alert",data)
       //send firebase notification
        return notification_saved
    } catch (error) {
        console.log(error)
        return null
    }
}
exports.getNotification= async(req,res,next)=>{
    try {
        let user = req.user_details
        const notifyPerPage = parseInt(req.query.limit) || 20;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * notifyPerPage;
        console.log(user, "user")
        const totalnotify = await Notification.find({
           recipient_id:user.user_id
        }).countDocuments();
        const notifications = await Notification.find({
            recipient_id:user.user_id
        }).sort({ _id:1 }).skip(skip).limit(notifyPerPage).lean();
        const totalPages = Math.ceil(totalnotify / notifyPerPage);
        let notify_data = []
        for (let c of notifications) {
            let user = await User.findById(c.user_id).lean()
            let post={}
            if(c.post_id){
                post=await Post.findById(c.post_id)
            }
            notify_data.push({ ...c, user: user,post:post })
        }
        if (notify_data && notify_data.length) {
            const responseContent = {
                "total_posts": totalnotify,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": notifyPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: notify_data
            }
            return response.sendSuccess({ res, message: "Notifications  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Notification found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)  
    }
}