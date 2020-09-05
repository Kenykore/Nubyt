var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var walletModel= new mongoose.Schema({
user_id:String,
"mnemonic": String,
"cashAddress": String,
"legacyAddress": String,
"WIF":String,
}, {
    timestamps: true
});


module.exports = mongoose.model('upload', uploadModel);


