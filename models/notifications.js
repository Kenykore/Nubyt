var mongoose = require('mongoose');
var notificationModel=new mongoose.Schema({
user_id:String,
recipient_id:String,
message:String,
notification_type:{
    type:String,
    enum:["like","follow","chat"],
    default:"chat"
},
post_id:String,
time:{
    type:Date,
    default:new Date(Date.now())
}

},{
    timestamps: true
})
module.exports = mongoose.model('notification', notificationModel);