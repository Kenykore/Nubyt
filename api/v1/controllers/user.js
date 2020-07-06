var User = require('../../../models/users');
var Post= require("../../../models/post")
var UserFollowers = require('../../../models/followers');
var ObjectID = require('mongoose').Types.ObjectId;
//var socket= require('../../../socket/usersocket')
const { randomNumber, formatPhoneNumber, addLeadingZeros, getUserDetails, getTimeWindow, getNextScheduleDate, getNextSchedulePayment } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const status = require("http-status");
const Tokenizer = require("../../../utilities/tokeniztion");
var crypto = require('crypto')
const bcrypt = require("bcryptjs");
var nodemailer = require('nodemailer')
var Email = require('email-templates')
var moment = require('moment')
const config = require("../../../config/index")
const request = require('request-promise');
const { emit } = require('process');
const socket= require("../../../services/Socket")
var selfSignedConfig = {
    service: 'gmail',
    auth: {
        user: 'comestiblestech@gmail.com',
        pass: 'franceskorede1@'
    }
}


exports.updateUserDeviceToken = async function (req, res, next) {
    try {
        let token=req.body.token
        let user_details = req.user_details
        let user_updated = await User.findByIdAndUpdate(user_details.user_id, {
            $push: {
                "DeviceToken": token
            }
        }, { new: true })
        if (user_updated) {
            delete user_updated.password;
            delete user_updated.resetPasswordExpires
            delete user_updated.resetPasswordToken

            const accessToken = Tokenizer.signToken({
                user_id: user_updated._id,
                ...user_updated
            });
            return response.sendSuccess({
                res,
                message: "Token added successfully",
                body: { user: user_updated, _token: accessToken }
            });
        }
        return response.sendError({
            res,
            message: "Unable to add token,try again"
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.AddUserLoyaltyPoints = async function (req, res, next) {
    try {
        let user = req.user_details
        var amount = Number(req.body.amount)
        let response = await User.findOneAndUpdate({ username: user }, {
            $inc: { "LoyaltyPoints.Balance": amount },
        }, {
            safe: true,
            new: true
        })
        return await res.status(200).json({ success: true })
    }
    catch (err) {
        console.log(err)
        next(err)
        return res.status(500).json({ err: err, success: false })
    }
}
exports.RedeemUserLoyaltyPoints = async function (req, res, next) {
    try {
        var user = req.user_details
        let user_found = await User.findById(user.user_id)
        if (user_found.LoyaltyPoints.balance > req.body.loyaltyamount) {
            return response.sendError({
                res,
                message: "Unable to redeem points,points to redeem exceed available amount try again"
            });
        }
        var loyaltyamount = Number(req.body.loyaltyamount * -1)
        let point_updated = await User.findByIdAndUpdate(user.user_id, {
            $inc: { "loyaltyPoints.balance": loyaltyamount },
        }, {
            safe: true,
            new: true
        })
        req.body.amount = Number(req.body.loyaltyamount * 10)
        next()
    }
    catch (error) {
        console.log(error)
        next(error)
    }

    // User.findOne({_id:id},(err,user)=>{
    //     if(err){
    //         return next(err)
    //     }
    //     var BalancePoints=user.LoyaltyPoints.Balance
    //     console.log(BalancePoints)
    //     var TotalPoints=user.LoyaltyPoints.TotalPoints
    //     console.log(TotalPoints)
    //     user.LoyaltyPoints.Balance=Number(BalancePoints+5)
    //     user.LoyaltyPoints.TotalPoints=Number(TotalPoints+5)
    //     user.save((err,updatedUser)=>{
    //         if(err){
    //             return next(err)
    //         }
    //         console.log(updatedUser)
    //      return   res.json({success:true,status:"points added"})
    //     })
    // })   
}
exports.AddDiscountCode = async (req, res, next) => {
    try {
        const user = req.user_details
        const codes = {
            name: req.body.discount_name,
            Expiry_Date: moment(req.body.Expiry_Date).toDate(),
            Value: req.body.Value,
            types: req.body.types,
            used: false,
        }
        const response = await User.findOneAndUpdate({ _id: id }, {
            $push: {
                "DiscountCodes": codes
            }
        }, {
            safe: true,
            new: true
        })
        return await res.status(200).json({
            DiscountCodes: codes,
            success: true
        })

    }
    catch (err) {
        console.log(err)
        next(err)
        return res.status(500).json({ err: err, success: false })
    }
}
exports.AddDiscountCodeUsage = async (req, res, next) => {
    try {
        const userid = ObjectID(req.body.id)
        console.log(userid, "user id")
        const code_id = ObjectID(req.body.code_id)
        const response = await User.findOneAndUpdate({ _id: userid, "DiscountCodes._id": code_id }, {
            $set: {
                "DiscountCodes.$.used": true
            }


        })
        return await res.status(200).json({
            success: true
        })

    }
    catch (err) {
        console.log(err)
        next(err)
        return res.status(500).json({ err: err, success: false })
    }
}
exports.updateUserBlockList = async function (req, res, next) {
    try {
        let user_details = req.user_details
        let blocked_user_id= req.body.blocked_user_id
        let user_updated = await User.findByIdAndUpdate(user_details.user_id, {
            $push: {
                "blacklist":blocked_user_id
            }
        }, { new: true })
        if (user_updated) {
            delete user_updated.password;
            delete user_updated.resetPasswordExpires
            delete user_updated.resetPasswordToken

            const accessToken = Tokenizer.signToken({
                user_id: user_updated._id,
                ...user_updated
            });
            return response.sendSuccess({
                res,
                message: "User blocked successfully",
                body: { user: user_updated, _token: accessToken }
            });
        }
        return response.sendError({
            res,
            message: "Unable to block user,try again"
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.unBlockUser = async function (req, res, next) {
    try {
        let user_details = req.user_details
        let blocked_user_id= req.body.blocked_user_id
        let user_updated = await User.findByIdAndUpdate(user_details.user_id, {
            $pull: {
                "blacklist":{ $in: [blocked_user_id ] }
            }
        }, { new: true })
        if (user_updated) {
            delete user_updated.password;
            delete user_updated.resetPasswordExpires
            delete user_updated.resetPasswordToken

            const accessToken = Tokenizer.signToken({
                user_id: user_updated._id,
                ...user_updated
            });
            return response.sendSuccess({
                res,
                message: "User blocked successfully",
                body: { user: user_updated, _token: accessToken }
            });
        }
        return response.sendError({
            res,
            message: "Unable to block user,try again"
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.updateUserDiscountCode = function (req, res, next) {
    var id = ObjectID(req.body.id)
    var balance = req.body.balance
    var Total = req.body.Total
    var codes = {
        name: req.body.name,
        Expiry_Date: req.body.Expiry_Date,
        Value: req.body.Value
    }
    var loyalty = {
        Balance: balance,
        TotalPoints: Total
    }
    User.findOneAndUpdate({ _id: id }, {
        $push: {
            "DiscountCodes": codes
        }, LoyaltyPoints: loyalty
    }, {
        safe: true,
        new: true
    }, (err, user) => {
        if (err) {
            return next(err);
        }

        return res.status(201).json({
            DiscountCodes: user.DiscountCodes,
            success: true
        })

    });
}
exports.getIsUserFollowing=async(req,res,next)=>{
    try {
        //do check for blocked list
        let user_id=req.body.user_id
        let follower_details = req.user_details
        let user_followed= await UserFollowers.findOne({
            user_id:user_id,
            follower_id:follower_details.user_id
        })
        if(user_followed){
            return response.sendSuccess({ res, message: "Users followed  Sucessfully", body:{...user_followed,exist:true} });
        }
        return response.sendError({ res, message: "Couldnt follow user" });
        
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.followerUser= async(req,res,next)=>{
    try {
        //do check for blocked list
        let user_id=req.body.user_id
        let follower_details = req.user_details
        let user_followed= await UserFollowers.create({
            time: new Date(Date.now()),
            user_id:user_id,
            follower_id:follower_details.user_id
        })
        if(user_followed){
            return response.sendSuccess({ res, message: "Users followed  Sucessfully", body:{...user_followed} });
        }
        return response.sendError({ res, message: "Couldnt follow user" });
        
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.UnfollowerUser= async(req,res,next)=>{
    try {
        let id=req.body.user_id
        let follower_details = req.user_details
        let user_unfollowed= await UserFollowers.findOneAndDelete({user_id:id,follower_id:follower_details.user_id})
        if(user_unfollowed){
            return response.sendSuccess({ res, message: "Users Unfollowed  Sucessfully", body:{...user_followed} });
        }
        return response.sendError({ res, message: "Couldnt Unfollow user" });
        
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.createUserAdmin = async (req, res, next) => {
    try {
        var email = req.body.email;
        var mobile = req.body.mobile;
        let password = "comestibles"
        if (!email || !mobile) {
            return response.sendError({ res, statusCode: status.UNAUTHORIZED, message: "You must enter an email address" })
            // return res.status(422).send({error: 'You must enter an email address'});
        }

        let userExist = await User.findOne({ $or: [{ email: req.body.email || "" }, { mobile: req.body.mobile || "" }] })
        if (userExist) {
            return response.sendError({
                res,
                message: "User account already exists"
            });
        }
        var options = {
            method: 'POST',
            uri: 'https://api.paystack.co/customer',
            body: {
                email: req.body.email
            },
            headers: {
                Authorization: `Bearer ${config.paystack_key}`
            },
            json: true // Automatically stringifies the body to JSON
        };
        let customer = await request(options)
        if (!customer) {
            return response.sendError({
                res,
                message: "Failed to create account on paystack"
            });
        }
        let customerCode = customer.data.customer_code
        const salt = await bcrypt.genSalt(10);
        let transporter = nodemailer.createTransport(selfSignedConfig);
        let loyaltyPoints = {
            balance: 10,
            totalPoints: 10
        }
        let user = await User.create({
            password: await bcrypt.hash(password, salt),
            loyaltyPoints: loyaltyPoints,
            customerCode: customerCode,
            ...req.body
        })
        console.log("created user", user)
        let userRegDate = user.createdAt
        let mailOptions = {
            from: '"Comestibles" <comestiblestech@gmail.com>', // sender address
            to: "comestibles.com.ng@gmail.com", // list of receivers
            subject: "New User", // Subject line
            text: `An account with, email ${user.email} and phone number ${user.mobile} was created at ${userRegDate} 
                    `, // plain text body
        };
        const Welcome_Email = new Email({
            transport: transporter,
            send: true,
            preview: false,
        });
        // let welcomeres = await Welcome_Email.send({
        //     template: 'welcome',
        //     message: {
        //         from: 'Comestibles <comestiblestech@gmail.com>',
        //         to: email,
        //     },
        //     locals: {
        //         username: 'Comestibles',
        //     },
        // })
     //   console.log('email has been send!', welcomeres)

     //   await transporter.sendMail(mailOptions);
        await Wallet.create({
            user_id: user._id,
            balance: 0,
        })
        let responseData = user.toObject()
        delete responseData.password
        delete responseData.resetPasswordToken
        delete responseData.resetPasswordExpires
        return response.sendSuccess({ res, message: "Account creation successful", body: { user: responseData } });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.searchAllUser = async function (req, res, next) {
    try {
        const usersPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;

        const totalusers = await User.find({
            $or: [
                {  name: new RegExp(req.query.search, 'i') },
                {email: new RegExp(req.query.search, 'i') },
                { username: new RegExp(req.query.search, 'i') },
            ]
        }).countDocuments();
        const users = await User.find({
            $or: [
                {  name: new RegExp(req.query.search, 'i') },
                { email: new RegExp(req.query.search, 'i') },
                { username: new RegExp(req.query.search, 'i') },
            ]
        }).sort({ _id: "desc" }).skip(skip).limit(usersPerPage);
        const totalPages = Math.ceil(totalusers / usersPerPage);

        if (users && users.length) {
            const responseContent = {
                "total_users": totalusers,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: users
            }
            return response.sendSuccess({ res, message: "Users  found", body: responseContent });
        }
        return response.sendError({ res, message: "No User found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.getAllUser = async function (req, res, next) {
    try {
        const usersPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;

        const totalusers = await User.find({}).countDocuments();
        const users = await User.find({}).sort({ _id: "desc" }).skip(skip).limit(usersPerPage);
        const totalPages = Math.ceil(totalusers / usersPerPage);

        if (users && users.length) {
            const responseContent = {
                "total_users": totalusers,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: users
            }
            return response.sendSuccess({ res, message: "Users  found", body: responseContent });
        }
        return response.sendError({ res, message: "No User found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.getAllUserFollowers = async function (req, res, next) {
    try {
        const usersPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        let user_details = req.user_details
        const totalusers = await UserFollowers.find({user_id:user_details.user_id}).countDocuments();
        const users = await UserFollowers.find({user_id:user_details.user_id}).sort({ _id: "desc" }).skip(skip).limit(usersPerPage);
        const totalPages = Math.ceil(totalusers / usersPerPage);
        let user_followers=[]
        for(let u of users){
            let user_found= await getUserDetails(u.follower_id)
            user_followers.push({follower:user_found,...u})
        }
        if (user_followers && user_followers.length) {
          
            const responseContent = {
                "total_users": totalusers,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: user_followers
            }
            return response.sendSuccess({ res, message: "Users followers  found", body: responseContent });
        }
        return response.sendError({ res, message: "No User follower found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.filterAllUser = async function (req, res, next) {
    try {
        const usersPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;
        delete req.query.limit
        delete req.query.page
        const totalusers = await User.find({ ...req.query }).countDocuments();
        const users = await User.find({ ...req.query }).sort({ _id: "desc" }).skip(skip).limit(usersPerPage);
        const totalPages = Math.ceil(totalusers / usersPerPage);

        if (users && users.length) {
            const responseContent = {
                "total_users": totalusers,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: users
            }
            return response.sendSuccess({ res, message: "Users  found", body: responseContent });
        }
        return response.sendError({ res, message: "No User found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error);
        next(error)
    }
}
exports.searchUsers = async function (req, res, next) {
    try {
        const usersPerPage = parseInt(req.query.limit) || 10;
        let currentPage = parseInt(req.query.page) || 0;
        const skip = currentPage * usersPerPage;

        const totalusers = await User.find({
            $or: [
                { firstName: new RegExp(req.query.search, 'i') },
                { lastName: new RegExp(req.query.search, 'i') },
                { mobile: new RegExp(req.query.search, 'i') },
                { email: new RegExp(req.query.search, 'i') },
                { city: new RegExp(req.query.search, 'i') },
                { country: new RegExp(req.query.search, 'i') },
                { area: new RegExp(req.query.search, 'i') }
            ]
        }).countDocuments();
        const users = await User.find({
            $or: [
                { firstName: new RegExp(req.query.search, 'i') },
                { lastName: new RegExp(req.query.search, 'i') },
                { mobile: new RegExp(req.query.search, 'i') },
                { email: new RegExp(req.query.search, 'i') },
                { city: new RegExp(req.query.search, 'i') },
                { country: new RegExp(req.query.search, 'i') },
                { area: new RegExp(req.query.search, 'i') }
            ]
        }).sort({ _id: "desc" }).skip(skip).limit(usersPerPage);
        const totalPages = Math.ceil(totalusers / usersPerPage);

        if (users && users.length) {
            const responseContent = {
                "total_users": totalusers,
                "pagination": {
                    "current": currentPage,
                    "number_of_pages": totalPages,
                    "perPage": usersPerPage,
                    "next": currentPage === totalPages ? currentPage : currentPage + 1
                },
                data: users
            }
            return response.sendSuccess({ res, message: "Users  found", body: responseContent });
        }
        return response.sendError({ res, message: "No User found", statusCode: status.NOT_FOUND });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.getSingleUser = async function (req, res, next) {
    try {
        if (!req.params.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }

        const user = await User.findById(req.params.user_id).select("-password -resetPasswordToken").lean()
        
        if (user) {
            let user_followers_count=await UserFollowers.countDocuments({user_id:user._id})
            let user_following_count=await UserFollowers.countDocuments({follower_id:user._id})
            let user_likes=0
            let user_posts= await Post.find({user_id:user._id}).lean()
            if(user_posts){
                user_likes= user_posts.reduce((previous,next)=>{
                    console.log(next,"next")
                    return Number(previous+next.likes)
                },0)
            }
            let user_found={
                ...user,
                followers:user_followers_count,
                following:user_following_count,
                likes:user_likes
            }
            socket.emitEvent("hello",user._id,{user:user})
            return response.sendSuccess({
                res,
                message: "User record found",
                body: { data: user_found }
            });
        }
        return response.sendError({
            res,
            message: "User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.getSpecificUser = async function (req, res, next) {
    try {
        if (!req.params.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }

        const user = await User.findById(req.params.user_id)

        if (user) {
            return response.sendSuccess({
                res,
                message: "User record found",
                body: { data: user }
            });
        }
        return response.sendError({
            res,
            message: "User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.deleteAnyUser = async function (req, res, next) {
    try {
        if (!req.params.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }

        const user = await User.findByIdAndDelete(req.params.user_id)
        if (user) {
            return response.sendSuccess({
                res,
                message: "User Deleted ",
                body: { data: user }
            });
        }
        return response.sendError({
            res,
            message: "Couldnt delete,User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }

}
exports.updateUserAdmin = async function (req, res, next) {
    try {
        if (!req.params.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }
       
        if(req.body.hasOwnProperty("email") || req.body.hasOwnProperty("mobile")){
            let user_found=await User.findById(req.params.user_id).lean()
            if(user_found.email !==req.body.email){
                let userExist = await User.findOne({ email: req.body.email})
                if(userExist){
                    return response.sendError({
                        res,
                        message: "Email already exists"
                    }); 
                }
            }
            if(user_found.mobile!==req.body.mobile){
                let userExist = await User.findOne({ mobile: req.body.mobile})
                if(userExist){
                    return response.sendError({
                        res,
                        message: "Mobile number already exists"
                    }); 
                }
            } 
          
        }
        const user = await User.findByIdAndUpdate(req.params.user_id, { ...req.body })
        if (user) {
            return response.sendSuccess({
                res,
                message: "User updated",
                body: { data: user }
            });
        }
        return response.sendError({
            res,
            message: "Couldnt update,User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }

}
exports.deactivateUser = async function (req, res, next) {
    try {
        if (!req.body.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }

        const user = await User.findByIdAndUpdate(req.body.user_id, { activated: false })
        if (user) {
            return response.sendSuccess({
                res,
                message: "User Deactivated",
                body: { data: user }
            });
        }
        return response.sendError({
            res,
            message: "Couldnt deactivate,User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }

}
exports.activateUser = async function (req, res, next) {
    try {
        if (!req.body.user_id) {
            return response.sendError({ res, message: "No user id found" });
        }

        const user = await User.findByIdAndUpdate(req.body.user_id, { activated: true })
        if (user) {
            return response.sendSuccess({
                res,
                message: "User Activated",
                body: { data: user }
            });
        }
        return response.sendError({
            res,
            message: "Couldnt activate,User not found",
            statusCode: status.NOT_FOUND
        });
    } catch (error) {
        console.log(error)
        next(error)
    }

}
// exports.createOrgStaff = function(req, res, next){

//     console.log(req.get('Authorization'));
//      var   username=req.body.username
//       //  PhoneNumber:req.body.PhoneNumber,
//       var email=req.body.email
//       var  password=req.body.password
//        var OrganizationName=req.body.OrganizationName
//     //    OrganizationEmail:req.body.OrganizationEmail,
//      //  OrganizationNumber:req.body.OrganizationNumber,
//        // RefferalCode:req.body.RefferalCode,
//        //UserType:"individual"   },
//        User.findOne({email: email}, function(err, existingUser){

//         if(err){
//             return next(err);
//         }

//         if(existingUser){
//             return res.status(422).send({error: 'That user is already registered'});
//         }        
//         var user= new User({
//             email: email,
//           //  Address: Address,
//          //   BankAccountNumber:BankAccountNumber,
//             username:username,
//          password:password,
//          OrganizationName:OrganizationName
//                   //   PhoneNumber:PhoneNumber,
//         })
//         user.save(function(err,user){
//             if(err){
//                 return next(err);
//             }
//                         })
//                         User.find({OrganizationName:OrganizationName},
//                             function(err, user) {

//                                 if (err){
//                                     res.send(err);
//                                 }

//                                 res.json(user);

//                             });
//     }
// )

// }
// exports.createAnyStaff = function(req, res, next){

//     User.create({
//         FirstName:req.body.FirstName,
//         LastName:req.body.LastName,
//         username:req.body.Username,
//         PhoneNumber:req.body.PhoneNumber,
//         email:req.body.EmailAddress,
//         Password:req.body.Password,
//         OrganizationName:req.body.OrganizationName,
//        // RefferalCode:req.body.RefferalCode,
//        UserType:req.body.UserType    },
//          function(err, user) {

//         if (err){
//             res.send(err);
//         }

//         User.find({OrganizationName:req.body.OrganizationName},
//         function(err, user) {

//             if (err){
//                 res.send(err);
//             }

//             res.json(user);

//         });

//     }
// );
// }
// exports.getOrgUser = function(req, res, next){
//  var name=req.params.OrganizationName
//     User.find({OrganizationName:name},function(err, users) {

//         if (err){
//             res.send(err);
//         }

//         res.json(users);

//     });



// }


// exports.deleteOrgUser = function(req, res, next){

//     User.findOneAndDelete({
//         _id : req.params.id,
//         OrganizationName:req.params.OrganizationName
//     }, function(err, user) {
//         res.json(
//             {user:user});
//     });

// }

// exports.CreateOrg = function(req, res, next){

//     var email=req.body.email
//    // var Address=req.body.Address
//     var name=req.body.name
//   //  var PhoneNumber=req.body.PhoneNumber
//   //  var BankAccountNumber=req.body.BankAccountNumber
//     var AdminID=req.body.AdminID



//     Org.findOne({name: name}, function(err, existingUser){

//         if(err){
//             return next(err);
//         }

//         if(existingUser){
//             return res.status(422).send({error: 'That organization is already registered'});
//         }
//         var Organization= new Org({
//             email: email,
//           //  Address: Address,
//          //   BankAccountNumber:BankAccountNumber,
//             name:name,
//             AdminID:AdminID,
//          //   PhoneNumber:PhoneNumber,
//         })
//         Organization.save(function(err,Org){
//             if(err){
//                 return next(err);
//             }
//             res.status(201).json({Org:Org})
//         }
//     );

// })

// }
// exports.GetSpecificOrg = function(req, res, next){
//     Org.find({AdminID:new ObjectID(req.params.AdminID)},function(err, user) {

//         if (err){
//             res.send(err);
//         }

//         res.json({user:user});

//     });
// }
// exports.GetAllOrg = function(req, res, next){
//     Org.find(function(err, user) {

//         if (err){
//             res.send(err);
//         }

//         res.json({user:user});

//     });
// }
// exports.deleteOrg = function(req, res, next){

//     Org.remove({
//         _id : req.params.Org,
//     }, (err, user) => {
//         res.json(user);
//     });

// }
