var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var userModel= new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
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
    firstName: {
        type: String, default: 'Nubyt'

    },
    lastName: {
        type: String,
        default: 'Nubyt'
    },
    address: {
        lat: Number,
        lng: Number,
        name: String,
    },
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
    followers:[String]
    
}, {
    timestamps: true
});


module.exports = mongoose.model('user', userModel);


