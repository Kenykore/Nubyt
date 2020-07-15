var mongoose = require('mongoose');
var postModel= new mongoose.Schema({
    user_id:{
        type:String,
        required:true
    },
    media_id:{
        type:String,
    },
    poster_image:{
        type:String,
    },
    media:{
        type:String,
        required:true,
    },
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
    },
    start_time:{
        type:Date,
        default:new Date(Date.now())
    },
    watching:[{user_id:String,username:String,time:Date,image:String}],
    end_time:{
        type:Date
    },
    ended:{
        type:Boolean,
        default:false
    }

    }, {
        timestamps: true
    });
    module.exports = mongoose.model('live_post', postModel);