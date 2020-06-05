require("dotenv").config();
const bcrypt = require("bcryptjs");
const status = require("http-status");
var User = require('../../../models/users');
var crypto = require('crypto')
var nodemailer = require('nodemailer')
var cron = require('node-cron')
const sendEmail= require("../../../services/Notification")
const Tokenizer = require("../../../utilities/tokeniztion");
const { randomNumber, formatPhoneNumber } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const request = require('request-promise')
const config = require("../../../config/index")
const ObjectID=require("mongoose").Types.ObjectId


// { 
//     host: 'server225.web-hosting.com',
//     port: 465,
//     secure: true, // use TLS
//     auth: {
//         user:'comestibles@comestibles.com.ng',
//         pass:'franceskoredepeter1@'    
//     },
//     tls: {
//         // do not fail on invalid certs
//         rejectUnauthorized: false
//     }
// };


exports.login = async function (req, res, next) {
    try {
        let email = req.body.email || req.body.mobile
        let password = req.body.password
        const user = await User.findOne({ $or: [{ email: email }, { mobile: email }] }).lean()
        if (!user) {
            return response.sendError({
                res,
                message: "Login failed. Invalid email address or mobile number",
                statusCode: status.NOT_FOUND
            });
        }
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );
        if (!isPasswordValid) {
            return response.sendError({
                res,
                message: "Login failed. Invalid password"
            });
        }
        if (!user.activated) {
            return response.sendError({
                res,
                statusCode: status.UNAUTHORIZED,
                message: "Login failed. Your account has not been verified or is disabled"
            });
        }
        delete user.password;
        delete user.resetPasswordExpires
        delete user.resetPasswordToken

        const accessToken = Tokenizer.signToken({
            ...user,
            user_id:user._id
        });
        return response.sendSuccess({
            res,
            message: "Login successful",
            body: { _token: accessToken }
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}
exports.register = async function (req, res, next) {
    try {
        var email = req.body.email;
        var mobile = req.body.mobile;
        let password= req.body.password
        if (!email || !mobile) {
            return response.sendError({ res, statusCode: status.UNAUTHORIZED, message: "You must enter an email address" })
            // return res.status(422).send({error: 'You must enter an email address'});
        }
        if (!password) {
            return response.sendError({ res, statusCode: status.UNAUTHORIZED, message: "You must enter a password" });
        }
        let userExist = await User.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.email }] })
        if (userExist) {
            return response.sendError({
                res,
                message: "User account already exists"
            });
        }
       delete req.body.password
        let user = await User.create({
            password: await bcrypt.hash(password, salt),
            ...req.body
        })
        console.log("created user", user)        
        let userRegDate = user.createdAt
        let mailOptions = {
            from: '"Comestibles" <comestiblestech@gmail.com>', // sender address
            to: "comestibles.com.ng@gmail.com", // list of receivers
            subject: "New User", // Subject line
            text: `A new user with, email ${user.email} and phone number ${user.mobile} just signed up at ${userRegDate} 
                    `, // plain text body
        };
      
       
        let responseData = user.toObject()
        delete responseData.password
        delete responseData.resetPasswordToken
        delete responseData.resetPasswordExpires
        const accessToken = Tokenizer.signToken({...responseData,user_id:user._id});
        return response.sendSuccess({ res, message: "Account creation successful", body: { user: responseData, _token: accessToken } });
    }

    catch (error) {
        console.log(error)
        next(error)
    }
}
exports.forgotPassword = async function (req, res, next) {
    try {
        const checkEmail =await User.findOne({$or: [ { email: req.body.email }, { mobile: req.body.mobile } ] })
        if (!checkEmail){
            return response.sendError({
                res,
                message: "Invalid email address or mobile number",
                statusCode: status.NOT_FOUND
            });
        }
          
            const code = randomNumber(7);
            var expiry=moment(Date.now()).add(60,"minutes").toDate()
            console.log(expiry)
            await User.findByIdAndUpdate(checkEmail._id,{resetPasswordToken:code,resetPasswordExpires:expiry})
              //send Email
              let mailOptions = {
                  from: '"Comestibles" <comestiblestech@gmail.com>', // sender address
                  to: checkEmail.email, // list of receivers
                  subject: "Password Reset", // Subject line
                  text: `Your token to reset password is ${code}
              If you did not request this ,please ignore this and your password would remain unchanged
              `, // plain text body
              };
             await sendEmail(mailOptions)
        return response.sendSuccess({
            res,
            message: "Password reset email sent to your email inbox",
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
             
}
exports.resetPassword = async function (req, res, next) {
    try {
        const user = await User.findOne({resetPasswordToken:req.body.code,resetPasswordExpires:{$gt:Date.now()}});
        if (!user)
            return response.sendError({
                res,
                message: "Invalid or expired password reset code"
            });

        //hash and store password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        await User.findByIdAndUpdate(user._id,{password:hashPassword})
        var mailOptions = {
            from: '"Comestibles" <comestiblestech@gmail.com>', // sender address
            to: user.email, // list of receivers
            subject: "Password Changed", // Subject line
            text: `Your Password has been changed. If you didnt change it yourself kindly contact support
        `, // plain text body
        };
        await sendEmail(mailOptions)
        return response.sendSuccess({
            res,
            message: "Password reset successful"
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
   
}

exports.resetPasswordApp = async function (req, res, next) {
    try {
        let userDetails=req.user_details
        let old_password=req.body.old_password
        let new_password= req.boy.new_password
        const user = await User.findById(userDetails._id).lean()
        if (!user) {
            return response.sendError({
                res,
                message: "User not found",
                statusCode: status.NOT_FOUND
            });
        }
        const isPasswordValid = await bcrypt.compare(
            old_password,
            user.password
        );
        if (!isPasswordValid) {
            return response.sendError({
                res,
                message: "Old password is incorrect,try again"
            });
        }

        //hash and store password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(new_password, salt);

        await User.findByIdAndUpdate(user._id,{password:hashPassword})
        var mailOptions = {
            from: '"Comestibles" <comestiblestech@gmail.com>', // sender address
            to: user.email, // list of receivers
            subject: "Password Changed", // Subject line
            text: `Your Password has been changed. If you didnt change it yourself kindly contact support
        `, // plain text body
        };
        await sendEmail(mailOptions)
        return response.sendSuccess({
            res,
            message: "Password reset successful"
        });

    } catch (error) {
        console.log(error)
        next(error)
    }
   
}
exports.UpdateProfile = async function (req, res, next) {
    try {
        let userDetails=req.user_details
        //fix security loophole
        let update=req.body
        if(update.hasOwnProperty("email") || update.hasOwnProperty("mobile")){
            let user_found=await User.findById(userDetails._id).lean()
            if(user_found.email !==req.body.email || user_found.mobile!==req.body.mobile){
                let userExist = await User.findOne({ $or: [{ email: req.body.email || "" }, { mobile: req.body.mobile || "" }] })
                if(userExist){
                    return response.sendError({
                        res,
                        message: "Email or mobile number already exists"
                    }); 
                }
            }
         
        }
      
        let user_updated=await  User.findByIdAndUpdate(userDetails._id, update, { new: true }) 
        if(user_updated){
            delete user_updated.password;
            delete user_updated.resetPasswordExpires
            delete user_updated.resetPasswordToken
    
            const accessToken = Tokenizer.signToken({
                user_id:user_updated._id,
                ...user_updated
            });
            return response.sendSuccess({
                res,
                message: "Profile update successful",
                body:{user:user_updated,_token:accessToken}
            });
        }
        return response.sendError({
            res,
            message: "Unable to update Profile,try again"
        });
    } catch (error) {
        console.log(error)
        next(error)
    }
}

