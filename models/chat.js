var mongoose = require('mongoose');
var chatModel=new mongoose.Schema({
user_id:String,
recipient_id:String,
message:String,
message_type:{
    type:String,
    enum:["send","received"],
    default:"send"
},
time:{
    type:Date,
    default:new Date(Date.now())
}

},{
    timestamps: true
})
module.exports = mongoose.model('chat', chatModel);