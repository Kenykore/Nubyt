var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var postModel= new mongoose.Schema({
    user_id:{
        type:String,
        required:true
    },
    time:Date,
    title:{
        type:String,
    },
    description:{
        type:String,
    },
    media_id:{
        type:String,
    },
    poster_image:{
        type:String,
    },
    filters:[],
    sound_id:{
        type:String,
        default:null
    },
    media:{
        type:String,
        required:true,
    },
    user_likes:[{user_id:String,username:String,time:Date}],
    likes:{
        type:Number,
        default:0 
    },
    views:{
        type:Number,
        default:0
    },
    tags:[String],
    comment_disabled:{
        type:Boolean,
        default:false
    },
    flagged_reasons:[String],
    flagged_count:{
        type:Number,
        default:0 
    },
    duet_disabled:{
        type:Boolean,
        default:true
    },
    visibility:{
        type:String,
        enum:["public","friends"],
        default:"public"
    }

    }, {
        timestamps: true
    });
    module.exports = mongoose.model('post', postModel);
