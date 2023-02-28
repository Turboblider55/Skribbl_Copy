const path = require('path');
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const Room = require('./libs/Schemas/room');
const {usermodel} = require("./libs/Schemas/user");

// var socket = require("socket.io");
// var io = socket(server);

const app = express();
let server = http.createServer(app);

//shortcut


const publicpath = path.join(__dirname,"/../public/");
console.log(publicpath);
const port = process.env.PORT || 3000;

//midleware
app.use(express.static(publicpath));

//Connect to our MondoDB
const DB = 'mongodb+srv://Turbo:WhJk23765@cluster0.tzcemsi.mongodb.net/?retryWrites=true&w=majority';

//
mongoose.set('strictQuery', false);

mongoose.connect(DB).then(()=>{
    console.log("Connection Succesfull!");

}).catch((err)=>{
    console.error("An error occured! error : "+err);
});

//socketio
let io = require("socket.io")(server);

io.on("connection", (socket) => {
    console.log("Socket connection successfull!");

    const deleteRoom = async function(roomid){
        try{
            const status = await Room.deleteOne({_id : roomid},{justOne : true});
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
                return room._id;
                //return cb("new room created");
            }
            else{
                const room = new Room({lang : lang , maxPlayerCount : maxPlayerCount , maxRound : maxRound , DrawTime : DrawTime });
                //const user = new usermodel({username : username , socketid : socketid , isPartyLeader : true , maxPlayerCount : maxPlayerCount , maxRound : maxRound , DrawTime : DrawTime });
                room.players.push({username : username , socketid : socketid , isPartyLeader : true });
                await room.save();
                return room._id;
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
                    console.log(room);
                    const user =  new usermodel({username : username,socketid : socketid});
                    //console.log(user);
                    //room.updateOne({$push : {players : {name : name,socketid : socketid}}});
                    room.players.push({username : username,socketid : socketid});
                    await room.save();
                    return room._id;
                    //room = await room.save().then(()=>console.log("Saved")).catch((err)=>console.log("An error occured : "+err));
                }
                else{
                    const roomid = await createRoom(1 , username , socketid , lang , cb);
                    return roomid;
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

    socket.on("Join",async function(params,cb){
        if(params.name && params.lang && params.id){
            console.log("Got everything!");
            console.log("name : "+params.name+", lang: "+params.lang);

            const roomid = await JoinRoom(params.name,params.id,params.lang,cb);
            return cb(roomid,null);
        }
        else{
            return cb("Something went wrong!");
        }
    });

    socket.on('disconnect',()=>{
        console.log("A user just disconnected from the server.");
        console.log(socket.id);
    });

    socket.on("leave",async function(params,cb){
        let room = await Room.findOne({_id : params.roomid});
        if(room)
            if(room.players.length > 1){
                console.log("Room found!");
                room.players.pull({socketid : params.socketid});
                await room.save();
                //Get the updated room the check if anyone player is in there
            }else{
                const status = await deleteRoom(params.roomid);
                console.log("Room deleting status : "+status.acknowledged);
            }
        else
            cb("No room found!");
    });
})

server.listen(port,"0.0.0.0",() => {
    console.log("Server started and running on port "+port +"!");
})


