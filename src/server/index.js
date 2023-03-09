const path = require('path');
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const Room = require('./libs/Schemas/room');
const {usermodel} = require("./libs/Schemas/user");

const app = express();
let server = http.createServer(app);

const publicpath = path.join(__dirname,"/../public/");
console.log(publicpath);
const port = process.env.PORT || 3000;

//midleware
app.use(express.static(publicpath));
//app.use(express.json());

//Connect to our MondoDB
const DB = 'mongodb+srv://Turbo:WhJk23765@cluster0.tzcemsi.mongodb.net/?retryWrites=true&w=majority';

//
mongoose.set('strictQuery', false);

mongoose.connect(DB).then(()=>{
    console.log("Mongoose Connection Succesfull!");

}).catch((err)=>{
    console.error("An error occured! error : "+err);
});

//socketio
let io = require("socket.io")(server);

io.on("connection", (socket) => {
    console.log("Socket connection successfull!");

    const deleteRoom = async function(roomid){
        try{
            const status = await Room.deleteOne({_id : roomid});
            return status;
        }catch(err){
            return false;
        }
    }

    const createRoom = async function( def , username , socketid , lang , cb , maxPlayerCount , maxRound , DrawTime ) {
        try{
            if(def == 1){
                const room = new Room({lang : lang});
                //const user = new usermodel({username : username , socketid : socketid , isPartyLeader : true });
                room.players.push({username : username , socketid : socketid , isPartyLeader : true });
                await room.save().then(()=>console.log("Room created successfully!")).catch((err)=>console.log("Room creation failed! error : " + err));
                return room;
                //return cb("new room created");
            }
            else{
                const room = new Room({lang : lang , maxPlayerCount : maxPlayerCount , maxRound : maxRound , DrawTime : DrawTime });
                //const user = new usermodel({username : username , socketid : socketid , isPartyLeader : true , maxPlayerCount : maxPlayerCount , maxRound : maxRound , DrawTime : DrawTime });
                room.players.push({username : username , socketid : socketid , isPartyLeader : true });
                await room.save().then(()=>console.log("Room created successfully!")).catch((err)=>console.log("Room creation failed! error : " + err));
                return room;
                //return cb("new room created");
            }
        }catch(err){
            console.log(err);
            return cb(err);
        }
    }

    const JoinRoom = async function( username , socketid , lang , cb) {

        //Another was to create a user with one function that will save it to the db
            // const room = new Room({name : 'Test2'});
            // room.save().then(()=>{
            //     console.log("Saved!"); 
            // }).catch((err)=>{
            //     console.error("error: "+err);
            // });
            try{
                const room = await Room.findOne({lang : lang});
                //console.log(room);
                if(room){
                    //console.log(room);
                    const user =  new usermodel({username : username,socketid : socketid});
                    //console.log(user);
                    //room.updateOne({$push : {players : {name : name,socketid : socketid}}});
                    room.players.push({username : username,socketid : socketid});
                    await room.save();
                    return room;
                    //room = await room.save().then(()=>console.log("Saved")).catch((err)=>console.log("An error occured : "+err));
                }
                else{
                    const room = await createRoom(1 , username , socketid , lang , cb);
                    return room;
                    // console.log("No room found!");
                    // return cb("no room found");
                }
            }catch(err){
                console.error(err);
            }
        //Creating object based on test schema
        //const test = new Test({name : "John",age : 16});
        //await test.save();
        
        //Usually we dont use this promuise syntacs, we use an async function
        // test.save().then(()=>{
        //     console.log("User Saved!");
        // }).catch((err)=>{
        //     console.err(err);
        // });
        //Saving it to the db
        
        //console.log(room);
    }

    socket.on('paint_to_server',(room,color,pos1,pos2)=>{
        console.log(room);
        socket.broadcast.to(room).emit('paint_to_user',color,pos1,pos2);
    });

    socket.on("Join",async function(params,cb){
        if(params.name && params.lang && params.id){
            //console.log("Got everything!");
            //console.log("name : "+params.name+", lang: "+params.lang);

            const room = await JoinRoom(params.name,params.id,params.lang,cb);
            if(room){
                socket.join(room._id.valueOf());
                //console.log(socket.rooms);
                io.to(room._id).emit('updateRoom',room);
                console.log(room._id.valueOf());
                return cb(room._id,null);
            }
        }
        else{
            return cb(null,"Something went wrong!");
        }
    });

    socket.on('disconnect',()=>{
        console.log("A user just disconnected from the server.");
    });

    socket.on("leave",async function(params){
        const room = await Room.findOne({_id : params.roomid});
        console.log("This code runs when the page is refreshed!");
        
        if(room){
            //if we find a room with a matching roomid, then we also leave the socket room
            socket.leave(params.roomid);
            if(room.players.length > 1){
                console.log("Room found!");
                room.players.pull({socketid : params.socketid});
                
                await room.save();
                //Sending to every user in the room the new roomdata
                io.to(room._id).emit('updateRoom',room);
                //Get the updated room the check if anyone player is in there
            }else{
                const status = await deleteRoom(params.roomid);
                console.log("Room deleting status : "+status.acknowledged);
            }
        }
    });
})

server.listen(port,() => {
    console.log("Server started and running on port "+port +"!");
})


