require("dotenv").config();
const config = require("./config/index");
const app=require("./app")
const PORT = config.port;
const path = require('path');
const CachePugTemplates = require('cache-pug-templates');
const views = app.set('views', path.join(__dirname,'emails'));
var mongoose= require('mongoose')
var databaseConfig = require('./config/index.js');
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
app.listen(PORT,(()=>{
    console.log('new server working',PORT)
    const cache = new CachePugTemplates({ app, views });
    cache.start();
    console.log(`${config.node_environment} server started, listening on port ${PORT}`);
   // socketemitters()
  }));
