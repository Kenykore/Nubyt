require("dotenv").config();
const bcrypt = require("bcryptjs");
const status = require("http-status");
var User = require('../../../models/users');
var crypto = require('crypto')
var moment =require('moment')
const deviceDetector = require("device-detector-js");
var nodemailer = require('nodemailer')
var cron = require('node-cron')
const sendEmail= require("../../../services/Notification")
const Tokenizer = require("../../../utilities/tokeniztion");
const { randomNumber, formatPhoneNumber } = require("../../../utilities/utils");
const bchAddressCreator= require('../../../utilities/bch_utils')
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
        const user = await User.findOne({ $or: [{ email: email }, { mobile: email },{username:email}] }).lean()
        if (!user) {
            return response.sendError({
                res,
                message: "Login failed. Invalid email address or mobile number or username",
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
        const deviceDetect = new deviceDetector();
        const userAgent = req.header("User-Agent")
        const device = deviceDetect.parse(userAgent);
        console.log(device,"device")
        if(user.device===undefined || device.device.brand!==user.device.user_device.brand || device.device.model !==user.device.user_device.model || device.device.type!==user.device.user_device.device_type || device.os.version!==user.device.os.version){
            await User.findByIdAndUpdate(user._id,{device:{
                os: {
                    "name": device.os.name,
                    "version": device.os.version,
                  },
                  user_device: {
                    "device_type": device.device.type,
                    "brand": device.device.brand,
                    "model": device.device.model
                  },
            }})
            let mailOptions = {
                from: 'Nubyt', // sender address
                to:  user.email, // list of receivers
                subject: "New Device Login", // Subject line
                template_name:"new-login",
                data:{
                    date: moment(Date.now()).format("DD/MM/YYYY HH:mm"),
                    device:`${device.os.name} ${device.os.version} ,${device.device.type} ${device.device.brand} ${device.device.model}`
                } 
            };
             await sendEmail(mailOptions)
        }
      
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
        if (!email || !mobile || !req.body.username) {
            return response.sendError({ res, statusCode: status.UNAUTHORIZED, message: "You must enter an email address,mobile number or username" })
            // return res.status(422).send({error: 'You must enter an email address'});
        }
        if (!password) {
            return response.sendError({ res, statusCode: status.UNAUTHORIZED, message: "You must enter a password" });
        }
        let userExist = await User.findOne({ $or: [{ email: req.body.email }, { mobile: req.body.email },{username:req.body.username}] })
        if (userExist) {
            if(userExist.email===req.body.email){
                return response.sendError({
                    res,
                    message: "Email already exists"
                }); 
            }
            else if(userExist.mobile===req.body.mobile){
                return response.sendError({
                    res,
                    message: "Mobile number already exists"
                }); 
            }
            else if(userExist.username===req.body.username){
                return response.sendError({
                    res,
                    message: "Username already exists"
                });  
            }
        }
       delete req.body.password
               const salt = await bcrypt.genSalt(10);
            //    let walletInfo=await bchAddressCreator.createAdddress()
        let user = await User.create({
            password: await bcrypt.hash(password, salt),
            ...req.body,
            // walletInfo:walletInfo
        })
        console.log("created user", user)        
        let userRegDate = user.createdAt
        let mailOptions = {
            from: 'Nubyt', // sender address
            to: user.email, // list of receivers
            subject: "Welcome to Nubyt", // Subject line
            template_name:"welcome",
            data:{
                name:user.username
            } 
        };
        await sendEmail(mailOptions)
       
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
        const checkEmail =await User.findOne({$or: [ { email: req.body.email }, { mobile: req.body.email },{username:req.body.email} ] })
        if (!checkEmail){
            return response.sendError({
                res,
                message: "Invalid email address,username or mobile number",
                statusCode: status.NOT_FOUND
            });
        }
          
            const code = randomNumber(7);
            var expiry=moment(Date.now()).add(60,"minutes").toDate()
            console.log(expiry)
            await User.findByIdAndUpdate(checkEmail._id,{resetPasswordToken:code,resetPasswordExpires:expiry})
            const deviceDetect = new deviceDetector();
            const userAgent = req.header("User-Agent")
            const device = deviceDetect.parse(userAgent);
            console.log(device,"device")
              //send Email
              let mailOptions = {
                from: 'Nubyt', // sender address
                to:  checkEmail.email, // list of receivers
                subject: "Password Change Request", // Subject line
                template_name:"forget-password",
                data:{
                    code:code,
                    device:`${device.os.name} ${device.os.version} ,${device.device.type} ${device.device.brand} ${device.device.model}`
                } 
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
        const deviceDetect= new deviceDetector();
const userAgent = req.header("User-Agent")
const device = deviceDetect.parse(userAgent);
console.log(device,"device")
        let mailOptions = {
            from: 'Nubyt', // sender address
            to:  user.email, // list of receivers
            subject: "Password Changed", // Subject line
            template_name:"reset-password",
            data:{
                date:moment(Date.now()).format("DD/MM/YYYY HH:mm"),
                device:`${device.os.name} ${device.os.version} ,${device.device.type} ${device.device.brand} ${device.device.model}`
            } 
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
        const deviceDetect= new deviceDetector();
        const userAgent = req.header("User-Agent")
        const device = deviceDetect.parse(userAgent);
        console.log(device,"device")
                let mailOptions = {
                    from: '"Nubyt" <support@nubyt.co>', // sender address
                    to:  user.email, // list of receivers
                    subject: "Password Changed", // Subject line
                    template_name:"reset-password",
                    data:{
                        date:moment(Date.now()).format("DD/MM/YYYY HH:mm"),
                        device:`${device.os.name} ${device.os.version} ,${device.device.type} ${device.device.brand}`
                    } 
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
        if(update.hasOwnProperty("email") || update.hasOwnProperty("mobile") || update.hasOwnProperty("username")){
            let user_found=await User.findById(userDetails._id).lean()
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
            if(user_found.username!==req.body.username){
                let userExist = await User.findOne({ username: req.body.username})
                if(userExist){
                    return response.sendError({
                        res,
                        message: "Username already exists"
                    }); 
                }
            }
         
        }
      
        let user_updated=await  User.findByIdAndUpdate(userDetails._id, update, { new: true }).lean() 
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

