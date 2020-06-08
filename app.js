//const functions = require('firebase-functions');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
/* global mailOptions */
/* global transporter */
/* global selfSignedConfig */
/* global process */
var port= process.env.PORT || 5100 ;
const path = require('path');
const CachePugTemplates = require('cache-pug-templates');
var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var methodOverride = require('method-override')
const cors = require('cors');
var nodemailer=require('nodemailer')
var app = express();

//var serviceAccount = require('./comestibles-207008-firebase-adminsdk-aokxz-01f5251eab.json');
/*admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://comestibles-207008.firebaseio.com"
  });*/
//const api = functions.https.onRequest(app)
//var io = require('socket.io')(api);

//2.Express Configuration
app.use(logger('dev'));
app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(methodOverride());
//var cors_options = 
var allowedOrigins = ['http://localhost',"http://localhost:4200",'http://localhost:8100',"http://localhost:8080","file://" ,"http://192.168.43.63:8100",
'https://app.comestibles.io','https://app.comestibles-delivery.io',"https://comestibles","http://127.0.0.1"]
app.use(cors({
  origin: function(origin, callback){
   console.log(origin)
    // allow requests with no origin 
    // (like mobile apps or curl requests)
    if(!origin) return callback(null, true);
    console.log(origin)
    if(allowedOrigins.indexOf(origin) === -1){
      var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }

    return callback(null, true);
  }
}));
/*(app.use(function(req,res,next){
    res.setHeader('Access-Control-Allow-Origin','')
    res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS,PUT,PATCH,DELETE')
    res.setHeader('Access-Control-Allow-Headers','X-Requested-With,content-type')
  next()
})*/

   //1.notification variables

//routes or APIS
//admin routes
const adminAuthRouter=require("./api/v1/routes/administrators/authentication")
const adminUserRouter=require("./api/v1/routes/administrators/users")
//user routers
const userAuthRouter=require("./api/v1/routes/users/authentication")
const userUsersRouter=require("./api/v1/routes/users/users")
const userPostRouter=require("./api/v1/routes/users/post")
//
//authentication
app.use("/auth/admin",adminAuthRouter);
app.use("/auth/user",userAuthRouter);
//users
app.use("/users",userUsersRouter)
app.use("/users/admin",adminUserRouter)
//posts
app.use("/post/user",userPostRouter)
//notifications api
//end of notification api
app.set('view engine', 'pug');

module.exports=app


//users api

