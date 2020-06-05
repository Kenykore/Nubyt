require("dotenv").config();
const bcrypt = require("bcryptjs");
const status = require("http-status");
const crypto = require("crypto");
const config=require("../../../config/index")
// model
const moment= require('moment')
const Administrator = require("../../../models/admin");
const Tokenizer = require("../../../utilities/tokeniztion");
const { randomNumber, formatPhoneNumber } = require("../../../utilities/utils");
const response = require("../../../utilities/response");
const request=require('request-promise')

exports.CreateAdmin = async (req,res,next)=>{
    try {
        let adminExist=await Administrator.findOne({$or: [ { email: req.body.email }, { mobile: req.body.mobile } ] })
        if(adminExist){
            return response.sendError({
                res,
                message: "Administrator account already exists"
            });
        }
        var options = {
            method: 'POST',
            uri: 'https://api.paystack.co/customer',
            body: {
            email:req.body.email
            },
            headers:{
                Authorization: `Bearer ${config.paystack_key}`
            },
            json: true // Automatically stringifies the body to JSON
        };
      let customer=  await request(options)
      if(!customer){
        return response.sendError({
            res,
            message: "Failed to create account on paystack"
        });
      }
      let customerCode= customer.data.customer_code
      const salt = await bcrypt.genSalt(10);
      const admin = await Administrator.create({
          name: req.body.name,
          email: req.body.email,
          password: await bcrypt.hash(req.body.password, salt),
          userType: req.body.userType ,
          mobile: req.body.mobile,
          customerCode:customerCode,
          city:req.body.city,
          country:req.body.country,
          firstName:req.body.firstName,
          lastName:req.body.lastName,
          address:req.body.address
      });
      const responseData = {
        firstName:admin.firstName,
        lastName:admin.lastName,
        address:admin.address,
        lastName: admin.lastName,
        mobile: admin.mobile,
        email:admin.email,
        city:admin.city,
        _id:admin._id,
        user_id:admin._id,
        country:admin.country,
        userType: admin.userType
    };
    const accessToken = Tokenizer.signToken(responseData);
    return response.sendSuccess({ res, message: "Account creation successful", body: { data: responseData, _token: accessToken } });
    } catch (error) {
        next(error)
        console.log(error)
    }
}
exports.LoginAdmin= async (req,res,next)=>{
    try {
        let email= req.body.email || req.body.mobile
        const admin=await Administrator.findOne({$or: [ { email: email }, { mobile:email } ] })
        if (!admin){
            return response.sendError({
                res,
                message: "Login failed. Invalid email address",
                statusCode: status.NOT_FOUND
            });
        }
        const isPasswordValid = await bcrypt.compare(
            req.body.password,
            admin.password
        );
        if (!isPasswordValid){
            return response.sendError({
                res,
                message: "Login failed. Invalid password"
            });
        }
        if (!admin.activated) {
            return response.sendError({
                res,
                statusCode: status.UNAUTHORIZED,
                message: "Login failed. Your account has not been verified or is disabled"
            });
        }
        const accessToken = Tokenizer.signToken({
            firstName:admin.firstName,
            lastName:admin.lastName,
            address:admin.address,
            lastName: admin.lastName,
            mobile: admin.mobile,
            email:admin.email,
            city:admin.city,
            _id:admin._id,
            user_id:admin._id,
            country:admin.country,
            userType: admin.userType
        });
        return response.sendSuccess({
            res,
            message: "Login successful",
            body: { _token: accessToken }
        });
    } catch (error) {
        next(error)
        console.log(error)  
    }
}
exports.forgotPassword= async (req, res, next) => {
    try {
        const checkEmail =await Administrator.findOne({$or: [ { email: req.body.email }, { mobile: req.body.email } ] })
        if (!checkEmail)
            return response.sendError({
                res,
                message: "Invalid email address or mobile number",
                statusCode: status.NOT_FOUND
            });

        // generate new reset code
        const code = randomNumber(7);
        var expiry=moment(Date.now()).add(60,"minutes").toDate()
        console.log(expiry)
        console.log(code,"password reset")
        await Administrator.findByIdAndUpdate(checkEmail._id,{resetPasswordToken:code,resetPasswordExpires:expiry})
        //send Email
        return response.sendSuccess({
            res,
            message: "Password reset email sent to your email inbox",
        });
    } catch (error) {
        console.log(error)
        next(error);
    }
}
exports.resetPassword= async (req, res, next) => {
    try {
        //check if reset code is right
        const admin = await Administrator.findOne({resetPasswordToken:req.body.code,resetPasswordExpires:{$gt:Date.now()}});
        if (!admin)
            return response.sendError({
                res,
                message: "Invalid or expired password reset code"
            });

        //hash and store password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(req.body.password, salt);

        await Administrator.findByIdAndUpdate(admin._id,{password:hashPassword})
        return response.sendSuccess({
            res,
            message: "Password reset successful"
        });
    } catch (error) {
        next(error);
    }
}


