var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var userFollowerModel= new mongoose.Schema({
user_id:String,
follower_id:String,
time:Date
    
}, {
    timestamps: true
});


module.exports = mongoose.model('user_follower', userFollowerModel);


