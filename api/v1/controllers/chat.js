var User = require('../../../models/users');
var Chat=require("../../../models/chat")
const response = require("../../../utilities/response");
const status = require("http-status");
const socket = require("../../../services/Socket")
var firebase_admin = require("firebase-admin");
const validateChatCreation = require("../../../validations/validate_create_chat")
exports.CreateChat = async (req, res, next) => {
    try {
        let user = req.user_details
        const { error } = validateChatCreation({ ...req.body, user_id: user.user_id });
        if (error)
            return response.sendError({
                res,
                message: error.details[0].message
            });
        let chat_created = await Chat.create({
            ...req.body,
            user_id:user.user_id,
            time:new Date(Date.now())
        })
        if (chat_created) {
            let user=await User.findById(chat_created.recipient_id).lean()
            let namespace= socket.emitEvent(`/chat/${chat_created.user_id}`)
            let receipt_namespace=socket.emitEvent(`/chat/${chat_created.recipient_id}`)
            namespace.emit("new_chat",{...chat_created,user:user})
            receipt_namespace.emit("new_chat",{...chat_created,user:user})
            return response.sendSuccess({ res, message: "Chat Sent Successfully", body: {chat:{...chat_created,user:user }} });
        }
        return response.sendError({
            res,
            message: "Unable to send Chat"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetUserChat = async (req, res, next) => {
    try {
        let user = req.user_details
     let chat_found= await Chat.aggregate([
        {
            $sort: { "createdAt": -1 }    
        },
        {
            $match:{user_id:user.user_id}
        },
        {
            $group : { _id : "$recipient_id", data: { $push: "$$ROOT" }, count: { $sum: 1 }, },
        }, 
    ])
    let chats=[]
    for(let c of chat_found){
        console.log(c,"chat found")
        let user=await User.findOne({_id:ObjectID(c._id)})
        chats.push({user:user,...c.data[0]})
     }
        if (chats && chats.length) {
            return response.sendSuccess({
                res,
                message: "Chats found",
                body: { data: chats }
            });
        }
        return response.sendError({
            res,
            message: "Chats not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.GetChatMessage=async(req,res,next)=>{
    try {
        let user = req.user_details
        const chatPerPage = parseInt(req.query.limit) || 20;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * chatPerPage;
        console.log(user, "user")
        let recipient_id=req.query.recipient_id
        if(!recipient_id){
            return response.sendError({ res, message: "Reciever Missing",});
        }
        const totalchats = await Chat.find({
            $or:[{
                user_id:user.user_id,
                recipient_id:recipient_id
            },{
                recipient_id:user.user_id,
                user_id:recipient_id
            }]
          
        }).countDocuments();
        const chats = await LivePost.find({
            $or:[{
                user_id:user.user_id,
                recipient_id:recipient_id
            },{
                recipient_id:user.user_id,
                user_id:recipient_id
            }]
        }).sort({ _id: "desc" }).skip(skip).limit(chatPerPage).lean();
        const totalPages = Math.ceil(totalchats / chatPerPage);
        let chat_data = []
        for (let c of chats) {
            let user = await User.findById(c.recipient_id).lean()
            post_data.push({ ...p, user: user, })
        }
        if (chat_data && chat_data.length) {
            const responseContent = {
                "total_posts": totalchats,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": chatPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: chat_data
            }
            return response.sendSuccess({ res, message: "Chats  found", body: responseContent });
        }
        return response.sendError({ res, message: "No Chat found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)  
    }
}