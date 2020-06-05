var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs')
var moment = require('moment')
var AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true
    },
    customerCode: {
        type: String,
        unique: true
    },
    mobile:{
        type:String,
        unique:true
    },
    extension:{
        type:String,
        default:"234"
    },
    raw_mobile:{
        type:String,
        default:""
    },
    city: {
        type: String,
        default:"Ibadan"
    },
    country: {
        type: String,
        default:"Nigeria"
    },
    area:{
        type:String,
        default:"UI"
    },
    userType: {
        type: String,
        enum: ['manager', 'staff'],
        default: 'staff',
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
    firstName: {
        type: String, default: 'Comestibles'
    },
    lastName: {
        type: String,
        default: 'Comestibles'
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
    authorization: [{
        authorization_code: String,
        email: String,
        card_type: String,
        last4: String,
        exp_month: String,
        exp_year: String,
        bank: String,
        channel: String,
        country_code: String,
        reusable: Boolean,
        signature: String
    }],
    // subscription: [{
    //     Plan_Code: String,
    //     Plan_Name: String,
    //     price: Number,
    //     email_token: String,
    //     subscription_code: String,
    //     Expiry_Date: Date,
    //     Deliveries: Number,
    //     ServiceCharge: Number,
    //     RewardPoints: Number,
    //     FoodCredit: Boolean,
    //     Discount: Number,
    //     Disabled: { type: Boolean, default: false },
    //     Usage: [{ Time: String, Delivery: { type: Number, default: 0 } }],
    //     Type: String
    // }],
    profilePic: {
        type: String,
    },
    loyaltyPoints: {
        Balance: {
            type: Number,
            default: 0
        },
        TotalPoints: {
            type: Number,
            default: 0
        }
    },
    busy: {
        type: Boolean,
        default: false
    },
    bankAccountDetails: {
        transfer_code:String,
        account_name:{
            type: String,
            default: "Supply",
        },
        bank_name: {
            type: String,
            default: "FBN"
        },
        account_number: {
            type: String,
            default: '308000000000'
        },
        bank_code: {
            type: String,
            default: "011"
        }
    },
    activated: {
        type: Boolean,
        default: true
    },
    discountCodes: [{ name: { type: String }, Expiry_Date: Date, Value: Number, types: String, used: { type: Boolean, default: false } }],
}, {
    timestamps: true
}
)
// AdminSchema.pre('save', function (next) {
//     var user = this;
//     var SALT_FACTOR = 5;
//     if (!user.isModified('password')) {
//         return next();
//     }
//     bcrypt.genSalt(SALT_FACTOR, function (err, salt) {
//         if (err) {
//             return next(err)
//         }
//         bcrypt.hash(user.password, salt, null, function (err, hash) {
//             if (err) {
//                 return next(err)
//             }
//             user.password = hash;
//             next()
//         })
//     })
// })

// Admin.methods.comparePassword = function (passwordAttempt, cb) {

//     bcrypt.compare(passwordAttempt, this.password, function (err, isMatch) {

//         if (err) {
//             return cb(err);
//         } else {
//             cb(null, isMatch);
//         }
//     });

// }

module.exports = mongoose.model('Admin', AdminSchema);