var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var userModel= new mongoose.Schema({
    username:{
        type:String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    bio:{
        type:String
    },
    instagram_id:{
        type:String
    },
    facebook_id:{
        type:String
    },
    userType: {
        type: String,
        enum: ['individual', 'content-creator',],
        default: 'individual',
        required: true
    },
    password: {
        type: String,
        required: true,
    },
    socketID: {
        type: String,
        default: "FFURORUJTITUJ"
    },
    mobile: {
        type:String,
        required: true
    },
    extension:{
        type:String,
        default:"234"
    },
    raw_mobile:{
        type:String,
        default:""
    },
    name: {
        type: String, default: 'Nubyt'

    },
    address: {
        lat: Number,
        lng: Number,
        name: String,
    },
    dob:Date,
    gender:String,
    deviceToken: [""],
    resetPasswordToken: {
        type: String,
        default: "adddddsbjugsj"
    },
    resetPasswordExpires: Date,
    profilePic: {
        type: String,
    },
    activated: {
        type: Boolean,
        default: true
    },
    device:{
        os: {
            "name": String,
            "version": String,
          },
          user_device: {
            "device_type": String,
            "brand": String,
            "model": String
          },
    },
    blacklist:[String],
    favourites:[String]
}, {
    timestamps: true
});


module.exports = mongoose.model('user', userModel);


