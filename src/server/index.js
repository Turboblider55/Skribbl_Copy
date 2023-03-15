const path = require('path');
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const Room = require('./libs/Schemas/room');
const {usermodel} = require("./libs/Schemas/user");

const app = express();
let server = http.createServer(app);

const publicpath = path.join(__dirname,"/../public/");
//console.log(publicpath);
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

    socket.on('paint_to_server',(room,color,pos1,pos2,width)=>{
        socket.broadcast.to(room).emit('paint_to_user',color,pos1,pos2,width);
    });

    socket.on("new-message-to-server",async (roomid , socketid , username , text , isGuessed, cb)=>{
        const WordToGuess = 'TesztSzo';
        //Check if the guessed word matches the word they have to guess
        try{
            if(text.toLowerCase() == WordToGuess.toLowerCase()){
                socket.broadcast.to(roomid).emit('new-message-to-user','Server',`${username} guessed the word!`);
                //io.sockets.socket(socketid).emit('new-message-to-user','Server','You guessed it!');
                socket.emit('new-message-to-user','Server','You guessed it!');
                //You have to use update on the schema itself, not on the element of the room schema
                const result = await Room.updateOne({'players.socketid' : socketid},{$set:{'players.$.guessedIt' : true}});
                console.log(result);
                const room = await Room.findOne({_id : roomid});
                io.to(roomid).emit('updateRoom',room);
                return cb(null,true);
            }
            //If the word does not match one on one, we check how many letters are matching
            let diff = 0;
            for(let i = 0;i < WordToGuess.length;i++){
                text.toLowerCase().charAt(i) != WordToGuess.toLowerCase().charAt(i) && diff++;
            }
            //if the difference is only one letter, we allert the user it was close
            if(diff < 1){
                socket.broadcast.to(roomid).emit('new-message-to-user',username, text);
                //io.sockets.socket(socketid).emit('new-message-to-user','Server','You guessed it!');
                socket.emit('new-message-to-user','Server',`The word ${text} is close!`);
                return cb(null,false);
            }
            else
                io.to(roomid).emit("new-message-to-user",username,text);
            }
        catch(e){
            return cb(e,null);
        }
    });

    socket.on("Join",async function(params,cb){
        if(params.name && params.lang && params.id){
            //console.log("Got everything!");
            //console.log("name : "+params.name+", lang: "+params.lang);

            const room = await JoinRoom(params.name,params.id,params.lang,cb);
            if(room){
                const id = room._id.valueOf();
                socket.join(id);
                //console.log(socket.rooms);
                //io.to(room._id).emit('updateRoom',room);
                socket.broadcast.to(id).emit('updateRoom',room);
                console.log(id);
                socket.broadcast.to(id).emit("new-message-to-user",'Server',`${params.name} has joined!`);
                return cb(room,null);
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
        let room = await Room.findOne({_id : params.roomid});
        //console.log("This code runs when the page is refreshed!");
        
        if(room){
            //if we find a room with a matching roomid, then we leave the socket room and the mongodb room too
            socket.leave(params.roomid);

            if(room.players.length > 1){
                //We can only do one task at once, we have to save and fetch the room again between tasks
                console.log("Room found!");
                room.players.pull({socketid : params.socketid});
                await room.save();
                room = await Room.findOne({_id : params.roomid});
                room.players[0].isPartyLeader = true;
                await room.save();
                //for some reason, it won't update the local variable, so we have to fetch the updated one
                room = await Room.findOne({_id : params.roomid});
                //Sending to every user in the room the new roomdata
                socket.broadcast.to(params.roomid).emit('updateRoom',room);
                socket.broadcast.to(params.roomid).emit('new-message-to-user','Server',`${params.username} has left!`);
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


