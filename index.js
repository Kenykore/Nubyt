require("dotenv").config();
const config = require("./config/index");
const app=require("./app")
const PORT = config.port;
const path = require('path');
const CachePugTemplates = require('cache-pug-templates');
const views = app.set('views', path.join(__dirname,'emails'));
var mongoose= require('mongoose')
var databaseConfig = require('./config/index.js');
const SocketClientService = require("./services/Socket");

//configuration
//1. Database Connection
mongoose.connect(databaseConfig.database_url,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})
var db= mongoose.connection;
//db.dropCollection('orders')
db.on('error',console.error.bind(console,'connection error'));
db.once('open',(()=>{
    console.log("connected to db")
}))
var http = require('http').createServer(app);
var io = require('socket.io')(http);
exports.Socket= io
io.on('connection', (socket) => {
    console.log('a user connected');
    let token = socket.handshake.query.token;
    let user_id=socket.handshake.query.user_id
    console.log("token",token,"user id",user_id)
    // let user_space= SocketClientService.emitEvent(user_id)
    //user_space.emitEvent(io,user_id)
    const dynamicNsp = io.of(`/${user_id}`).on('connect', (socket) => {
        console.log("connect to private")
        const newNamespace = socket.nsp; 
        //newNamespace.emit('hello');
      });
    //   setTimeout(()=>{
    //     dynamicNsp.emit("hello",{second:true})
    //   },2000)
     
    socket.on('disconnect', () => {
        console.log('user disconnected');
      });
  });

http.listen(PORT,(()=>{
    console.log('new server working',PORT)
    const cache = new CachePugTemplates({ app, views });
    cache.start();
    console.log(`${config.node_environment} server started, listening on port ${PORT}`);
   // socketemitters()
  }));
