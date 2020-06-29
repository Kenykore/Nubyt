var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var uploadModel= new mongoose.Schema({
user_id:String,
public_id:String,
time:Date
    
}, {
    timestamps: true
});


module.exports = mongoose.model('upload', uploadModel);


