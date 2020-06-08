const status = require("http-status");
const Tokenizer = require("../utilities/tokeniztion");
const crypto = require("crypto");
const User= require("../models/users")
const ObjectID= require("mongoose").Types.ObjectId
// helper
const response = require("../utilities/response");

const Secure = {
    verifyUser(req, res, next) {
        let token = req.header("Authorization");
        if (!token) {
            return response.sendError({ res, message: "Authorization token not found", statusCode: status.UNAUTHORIZED });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        } else {
            return response.sendError({ res, message: "Invalid authorization string. Token must start with Bearer", statusCode: status.UNAUTHORIZED });
        }

        try {
            const verified = Tokenizer.verifyToken(token);
            req.user_details = verified.data;
            next();
        } catch (error) {
            next(error);
        }
    },
    async verifyNonBlockUser(req,res,next){
        try {
            let user_details= req.user_details
            let user_blocked= await User.findOne({_id:ObjectID(req.body.user_id || req.params.user_id),blocked: { $in: [user_details.user_id]}}).lean()
            if(user_blocked){
                return response.sendError({ res, message: "Cannot perform this action, user blocked you", statusCode: status.FORBIDDEN });
            }
            else{
                next()
                return
            }
        } catch (error) {
            console.log(error)
            next(errror)
        }
    },
    // async verifyNonLoggedIn(req, res, next) {
    //     try {
    //         let token = req.header("Authorization");
    //         if (!token) {

    //             let email_phone = req.body.email;
    //             if (!email_phone || !req.body.password) {
    //                 return response.sendError({ res, message: "Invalid credentials" });
    //             }
    //             const user = await User.findOne({
    //                 where: {
    //                     [Op.or]: [{ email: email_phone }, { mobile: email_phone }],
    //                     password: crypto.createHash("md5").update(req.body.password).digest("hex")
    //                 }
    //             });
    //             console.log(user, "user")
    //             if (!user) {
    //                 return response.sendError({ res, message: "Invalid credentials", statusCode: status.NOT_FOUND });
    //             }
    //             if (!user.enabled) {
    //                 return response.sendError({
    //                     res, message: "Your account has been disabled. Please contact info@mvxchange.com for help", statusCode: status.UNAUTHORIZED
    //                 });
    //             }
    //             const payload = {
    //                 user_id: user.id,
    //                 email: user.email,
    //                 name: user.name,
    //                 created_at: user.createdat,
    //                 mobile: user.mobile,
    //                 verified: user.verified,
    //                 company_name: user.company_name
    //             };
    //             console.log("payload", payload)
    //             req.user_details =  payload 
    //             next();
    //             return
    //         }

    //         if (token.startsWith('Bearer ')) {
    //             token = token.slice(7, token.length);
    //         } else {
    //             return response.sendError({ res, message: "Invalid authorization string. Token must start with Bearer", statusCode: status.UNAUTHORIZED });
    //         }

    //         try {
    //             const verified = Tokenizer.verifyToken(token);
    //             req.user_details = verified.data;
    //             next();
    //         } catch (error) {
    //             next(error);
    //         }

    //     } catch (error) {
    //         next(error);
    //     }
    // },
    verifyAdmin(req, res, next) {
        let token = req.header("Authorization");
        if (!token) {
            return response.sendError({ res, message: "Authorization token not found", statusCode: status.UNAUTHORIZED });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        } else {
            return response.sendError({ res, message: "Invalid authorization string. Token must start with Bearer", statusCode: status.UNAUTHORIZED });
        }

        try {
            const verified = Tokenizer.verifyToken(token);
            req.admin_details = verified.data;

            //check if role is administrator
            const role = req.admin_details.userType;
            if ((role !== "staff") && (role !== "manager")) {
                return response.sendError({ res, message: "Not Authorised. Protected admin route", statusCode: status.UNAUTHORIZED });
            }
            next();
        } catch (error) {
            next(error);
        }
    },
    verifyVendor(req, res, next) {
        let token = req.header("Authorization");
        if (!token) {
            return response.sendError({ res, message: "Authorization token not found", statusCode: status.UNAUTHORIZED });
        }

        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        } else {
            return response.sendError({ res, message: "Invalid authorization string. Token must start with Bearer", statusCode: status.UNAUTHORIZED });
        }

        try {
            const verified = Tokenizer.verifyToken(token);
            req.user_details = verified.data;

            //check if role is administrator
            const role = req.user_details.type;
            console.log(role,"role")
            if ((role !== "restuarant") && (role !== "chef")) {
                return response.sendError({ res, message: "Not Authorised. Protected Vendor route", statusCode: status.UNAUTHORIZED });
            }
            next();
        } catch (error) {
            next(error);
        }
    }
}

module.exports = Secure;