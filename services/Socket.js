
const io = require("../index")
const { uploadViaSocket } = require("../api/v1/controllers/post")
 exports.emitEvent= (event,user_id,data)=> {
        try {
            const dynamicNsp = io.Socket.of(`/${user_id}`)
            dynamicNsp.emit(event,data)
        } catch (error) {
            console.log(error)
        }
    }
     exports.listenToEvent= (event,user_id,cb)=>{
        try {
            const dynamicNsp = io.Socket.of(`/${user_id}`).on(event, (socket) => {
                console.log("event called",event)
                const newNamespace = socket.nsp;
                cb() 
               // newNamespace.emit('hello');
              });
            // console.log("function called",this.socket_connected)
            // this.socket_connected.on('connect', (socket) => {
            //     console.log("connect to private in self")
            //     const newNamespace = socket.nsp; 
            //     newNamespace.emit('hello');
            //   });
            // //   setTimeout(
            //     this.socket_connected.emit("hello",{second:true})
            //   ,2000)
        } catch (error) {
            console.log(error)
        }
    }
    exports.listenToUploadEvent= async (user_id,details)=>{
        try {
            console.log(user_id,"user id")
            let res=await uploadViaSocket(details)
            console.log(res)
            console.log(res)
            if(res.error!==null){
                const dynamicNsp = io.Socket.of(`/${user_id}`)
                dynamicNsp.emit("upload_error",{message:res.message,success:false,mode:details.mode})
            }
            // else{
            //     const dynamicNsp = io.Socket.of(`/${user_id}`)
            //     dynamicNsp.emit("upload_done",{message:res.message,success:true,data:res.body}) 
            // }
            // const dynamicNsp = io.Socket.of(`/${user_id}`).on("upload_file", async (details) => {
            //     console.log("upload file event called",details)

            //    // newNamespace.emit('hello');
            //   });
            //   console.log(dynamicNsp,"namespace")
            // console.log("function called",this.socket_connected)
            // this.socket_connected.on('connect', (socket) => {
            //     console.log("connect to private in self")
            //     const newNamespace = socket.nsp; 
            //     newNamespace.emit('hello');
            //   });
            // //   setTimeout(
            //     this.socket_connected.emit("hello",{second:true})
            //   ,2000)
        } catch (error) {
            console.log(error)
        }
    }
