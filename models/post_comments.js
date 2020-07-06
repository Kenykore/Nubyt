var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var postCommentModel= new mongoose.Schema({
    user_id:{
        type:String,
        required:true
    },
    time:Date,
    post_id:{
        type:String,
        required:true
    },
    comment_type:{
        type:String,
        default:"comment",
        enum:["comment","reply"]
    },
    comment_id:{
            type: String,
            required: function () {
                return this.comment_type === "reply";
            }
    },
    description:{
        type:String,
        required:true
    },
    }, {
        timestamps: true
    });
    module.exports = mongoose.model('post_comment', postCommentModel);