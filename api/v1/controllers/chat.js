var User = require('../../../models/users');
var Chat=require("../../../models/chat")
const response = require("../../../utilities/response");
const status = require("http-status");
const socket = require("../../../services/Socket")
const lodash=require("lodash")
const ObjectID=require("mongoose").Types.ObjectId

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
            namespace.emit("new_chat",{...chat_created.toObject(),user:user})
            receipt_namespace.emit("new_chat",{...chat_created.toObject(),user:user})
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
        console.log(user.user_id)
     let chat_found= await Chat.find({
        $or:[{
             user_id:user.user_id,
                    },{
              recipient_id:user.user_id,
            }]
    }).sort({ _id:1 }).lean()
    console.log(chat_found,"chat found")
    let chats=[]
    for(let c of chat_found){
        console.log(c,"chat found")
        if(c.recipient_id.toString()!==user.user_id){
            let index_found=chats.findIndex(x=>x._id===c.recipient_id)
            if(index_found>=0){
                chats[index_found].data=c
            }
            else{
                let user=await User.findOne({_id:ObjectID(c.recipient_id)})
                chats.push({_id:c.recipient_id,user:user,data:c})
            }    
        }
        else{
            let index_found=chats.findIndex(x=>x._id===c.user_id)
            if(index_found>=0){
                chats[index_found].data=c
            }
            else{
                let user=await User.findOne({_id:ObjectID(c.user_id)})
                chats.push({_id:c.user_id,user:user,data:c})
            }
        }
      
    }
    chats=lodash.orderBy(chats,['data.time'],['desc'])
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
        const chats = await Chat.find({
            $or:[{
                user_id:user.user_id,
                recipient_id:recipient_id
            },{
                recipient_id:user.user_id,
                user_id:recipient_id
            }]
        }).sort({ _id:1 }).skip(skip).limit(chatPerPage).lean();
        const totalPages = Math.ceil(totalchats / chatPerPage);
        let chat_data = []
        for (let c of chats) {
            let user = await User.findById(c.recipient_id).lean()
            chat_data.push({ ...c, user: user, })
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