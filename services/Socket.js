
const io = require("../index")
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
