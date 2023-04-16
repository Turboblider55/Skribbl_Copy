const path = require('path');
const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const Room = require('./libs/Schemas/room');
const {usermodel} = require("./libs/Schemas/user");
const words = require('./libs/utils/words');
const ValidLetters = require('./libs/utils/ValidLetters');

const app = express();
let server = http.createServer(app);

const publicpath = path.join(__dirname,"/../public/");
//console.log(publicpath);
const port = process.env.PORT || 3000;

//midleware
app.use(express.static(publicpath));
//app.use(express.json());

//Connect to our MondoDB
const DB = 'mongodb+srv://Turbo:W4AXNtcl1z5m8Ace@cluster0.tzcemsi.mongodb.net/?retryWrites=true&w=majority';

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

    const SendToGuessedUsers = function(room,user,text){
        //Not so efficient, we have to send the message individually, but there are no other options i could find to do it only on the server side
        for(let player of room.players){
            if(player.guessedIt || player.isDrawing)
                io.to(player.socketid).emit("new-message-to-user",user,text,'Guessed');
        }
    }

    const createRoom = async function( username , socketid , lang , body, eye, mouth, cb) {
        try{
                const room = new Room({lang : lang});
                //const user = new usermodel({username : username , socketid : socketid , isPartyLeader : true });
                room.players.push({username : username , socketid : socketid , isPartyLeader : true , guessedIndex : 0, body_index : body , eye_index : eye , mouth_index : mouth});
                await room.save().then(()=>console.log("Room created successfully!")).catch((err)=>console.log("Room creation failed! error : " + err));
                return room;
                //return cb("new room created");
        }catch(err){
            console.log(err);
            cb(err);
        }
    }

    const CalculatePoints = async (room) => {
        //If noone guessed, than for now we don't do anything
        room.prevRoundInfo = [];
        await room.save();
        let points_data = [];
        if(room.guessedCounter == 0){
            for(let i = 0; i < room.players.length;i++){
                points_data.push({name : room.players[i].username , point_gain : 0});
            }
            return points_data;
        }
        
        const maxPoint = (room.guessedCounter + 1) * 80;
        for(let player of room.players){
            if(player.guessedIndex == 0){
                player.points += maxPoint - 80;
                points_data.push({name : player.username , point_gain : (maxPoint - 80)});
                continue;
            }
            if(player.guessedIndex != -1){
                console.log(player.guessedIndex);
                player.points += maxPoint - (player.guessedIndex - 1) * 80 ;
                points_data.push({name : player.username , point_gain : (maxPoint - (player.guessedIndex - 1) * 80 )});
                continue;
            }
        }
        await room.save();
        room.prevRoundInfo = points_data;
        await room.save();
        //console.log(room);

        return points_data;
    }

    const SetToStart = async (room) => {
        try{
        for(let player of room.players){
            player.guessedIt = false;
            player.isDrawing = false;
            player.guessedIndex = -1;
        }
        await room.save();
        room = await Room.findOne({_id : room._id});
        room.currentTime = room.DrawTime;
        await room.save();
        room = await Room.findOne({_id : room._id});
        room.guessedCounter = 0;
        //console.log(room);
        await room.save();
        await Room.updateOne({_id : room._id},{wordToChooseFrom : []});
        await room.save();
        await Room.updateOne({_id : room._id},{ wordToChooseFrom : [Math.floor(Math.random() * words.length) , Math.floor(Math.random() * words.length) , Math.floor(Math.random() * words.length)]});
        await room.save();
        await Room.updateOne({_id : room._id},{gameState : 1});
        await room.save();
        await Room.updateOne({ _id : room._id},{helpingLetter : []});
        await room.save();
        }catch(err){
            console.log(err);
        }
        // room = await Room.findOne({_id : room._id});
    }

    const EndGame = async (room) => {
        try{
        console.log('End of the game!');
        const point_gains = await CalculatePoints(room);
        await SetToStart(room);
        await setGameState(room._id,0);
        room = await Room.findOne({_id : room._id});
        io.to(room._id.valueOf()).emit('end-of-game',room);
        io.to(room._id.valueOf()).emit('round-over',room,'game-over',{point_gains : point_gains,rightWord : room.word});
        io.to(room._id.valueOf()).emit('new-message-to-user','',`The game is over!`,'Drawing');
        }catch(err){
            console.log(err);
        }
    }

    const ChangeRound = async (room) => {
        try{
            if(room.currRound < room.maxRound){
                const point_gains = await CalculatePoints(room);
                await SetToStart(room);
                await setGameState(room._id,1);
                room.turnIndex = 0;
                room.currRound++;

                io.to(room._id.valueOf()).emit('round-over',room,'round-over',{point_gains : point_gains,rightWord : room.word,wordstochoosefrom : [words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                // io.to(room._id.valueOf()).emit('new-message-to-user','',`<span>${room.players[room.turnIndex].username}</span> is drawing!`,'Drawing');

                room.players[0].isDrawing = true;
                room.players[0].guessedIt = false;
                room.players[0].guessedIndex = 0;
                await room.save();
                //room = await Room.find({_id : room._id});
                return;
            }
            //if(room.currRound == room.maxRound)
                return await EndGame(room);
        }catch(err){
            console.log(err);
        }

    }

    const TurnIsOver = (room) => {
        let counter = 0
        for(let player of room.players){
            if(player.isDrawing || player.guessedIt) counter++;
        }
        return counter == room.players.length;
    }

    const IncreaseGuessedUsers = async (room, socketid) => {
        try{
            const user = room.players.find(player=>player.socketid == socketid);

            if(!user)
                return;
            
            const index = room.players.indexOf(user);
            room.guessedCounter++;
            
            // await room.save();
            // room = await Room.findOne({_id : room._id});

            room.players[index].guessedIndex = room.guessedCounter;
            await room.save();
        }catch(err){
            console.log(err);
        }
    }

    const ChangeTurn = async (room) => {
        //console.log(room);
        try{
            //console.log(room.turnIndex + 1 < room.players.length);
            if(room.turnIndex + 1 < room.players.length){
                const point_gains = await CalculatePoints(room);
                await SetToStart(room);
                await setGameState(room._id,1);
                room.turnIndex++;
                await room.save();
                room = await Room.findOne({_id : room._id});
                io.to(room._id.valueOf()).emit('turn-over',room,'turn-over',{point_gains : point_gains,rightWord : room.word,wordstochoosefrom : [words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                // io.to(room._id.valueOf()).emit('new-message-to-user','',`<span>${room.players[room.turnIndex].username}</span> is drawing!`,'Drawing');

                room.players[room.turnIndex].isDrawing = true;
                room.players[room.turnIndex].guessedIt = false;
                room.players[room.turnIndex].guessedIndex = 0;
                await room.save();
                //room = await Room.find({_id : room._id});
                //console.log(room);
                //You have to user the valueof function to get only the id
                return;
            }
            //If the turnindex + 1 is not less than players.length, than it must be equal, 
            //Since we only increment by one every time
            // if(room.turnIndex + 1 == room.players.length){
                //console.log('This code runs!');
                return await ChangeRound(room);
            // }
        }catch(err){
            console.log(err);
        }
    }

    const JoinRoom = async function( username , socketid , lang , body , eye , mouth , cb) {

        //Another was to create a user with one function that will save it to the db
            // const room = new Room({name : 'Test2'});
            // room.save().then(()=>{
            //     console.log("Saved!"); 
            // }).catch((err)=>{
            //     console.error("error: "+err);
            // });
            try{
                //The order really matters in the query, first lt, then size and not reverse
                const room = await Room.findOne({lang : lang, players : {$lt : {$size : '$maxPlayerCount'}}});
                //console.log(room);
                if(room){
                    //console.log(room);
                    //const user =  new usermodel({username : username,socketid : socketid});
                    //console.log(user);
                    //room.updateOne({$push : {players : {name : name,socketid : socketid}}});
                    // if(room.players.length + 1 == 2)
                    // room.players[0].isDrawing = true;
                    // await room.save();
                    
                    room.players.push({username : username,socketid : socketid, body_index : body, eye_index : eye, mouth_index : mouth});
                    await room.save();
                    return room;
                    //room = await room.save().then(()=>console.log("Saved")).catch((err)=>console.log("An error occured : "+err));
                }
                else{
                    const room = await createRoom( username , socketid , lang , body, eye, mouth, cb);
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

    const setGameState = async (roomid,state) => {
        await Room.updateOne({_id : roomid},{gameState : state});
    }

    socket.on('Change-Timer',async (roomid,time)=>{
        //console.log('Time is sent');
        let room = await Room.findOne({_id : roomid});
        if(room){
            room.currentTime = time;
            await room.save();
            if(time != room.DrawTime && room.gameState == 2 &&time % (room.DrawTime / (room.word.length / 2 + 1)) == 0){
                    console.log("Helping letter is being created!");
                    let PossibleLetters = [];
                    for(let i = 0 ; i < room.word.length ; i++){
                        if(!room.helpingLetter.includes(i) && ValidLetters.includes(room.word.charAt(i)))
                            PossibleLetters.push(i);
                    }
                    await Room.updateOne({_id : room._id},{$push:{helpingLetter : PossibleLetters[Math.floor(Math.random() * PossibleLetters.length)]}});
                    await room.save();
                    room = await Room.findOne({_id : room._id});
                    socket.to(roomid).emit('Change-Timer',time,room.helpingLetter);
            }
            else
                socket.to(roomid).emit('Change-Timer',time);

            if(time == 0 && room.gameState == 2){
                io.to(roomid).emit('new-message-to-user','',`The word was <spam>'${room.word}'</span>`,'Right');
                await ChangeTurn(room);
                console.log("Turn is Over!");
                return;
            }
            else if(time == 0 && room.gameState == 1){
                const index = room.wordToChooseFrom[Math.floor(Math.random() * room.wordToChooseFrom.length)];
                await Room.updateOne({_id : room._id},{word : words[index]});
                await room.save();
                room = await Room.findOne({_id : room._id});
                await setGameState(room._id,2);
                // await Room.updateOne({_id : room._id},{gameState : 1});
                // await room.save();
                io.to(roomid).emit("start-turn-to-user",room);
            }
        }
    });

    socket.on('paint_to_server',(tool,data)=>{
        if(tool == 'pen')
            socket.broadcast.to(data.room).emit('paint_to_user',tool,{color : data.color , pos1 : data.pos1 , pos2 : data.pos2 , width : data.width});
        else if(tool == 'trash'){
            //Bucket is not working yet
            socket.broadcast.to(data.room).emit('paint_to_user',tool,{});
        }
        else if(tool == 'eraser'){
            socket.broadcast.to(data.room).emit('paint_to_user',tool,{pos1 : data.pos1 , pos2 : data.pos2 , width : data.width});
        }
    });

    socket.on('start-turn-to-server' , async (roomid,word) =>{
        let room = await Room.findOne({_id : roomid});
        if(room){
            await Room.updateOne({_id : room._id},{word : word});
            await room.save();
            room = await Room.findOne({_id : room._id});
            await setGameState(roomid,2);
            await room.save();
            room = await Room.findOne({_id : room._id});
            io.to(roomid).emit("start-turn-to-user",room);
            io.to(roomid).emit('new-message-to-user','',`<span>${room.players[room.turnIndex].username}</span> is drawing!`,'Drawing');
        }
    });

    socket.on("new-message-to-server" , async (roomid , socketid , username , text , isGuessed, isDrawing, cb)=>{
        
        //Check if the guessed word matches the word they have to guess
        try{
            let room = await Room.findOne({_id : roomid});
            if(room){
                const WordToGuess = room.word;
                if(room.gameState == 1 || room.gameState == 0){
                    io.to(roomid).emit("new-message-to-user",username,text,'Normal');
                    return;
                }
                if(isGuessed || isDrawing){
                    //console.log('IS guessed or drawing');
                    SendToGuessedUsers(room,username,text);
                    return;
                }
                if(!isGuessed){
                    if(text.toLowerCase() == WordToGuess.toLowerCase()){
                        socket.broadcast.to(roomid).emit('new-message-to-user','',`${username} guessed the word!`,'Guessed');
                        //io.sockets.socket(socketid).emit('new-message-to-user','Server','You guessed it!');
                        socket.emit('new-message-to-user','','You guessed it!','Guessed');
                        //You have to use update on the schema itself, not on the element of the room schema
                        const result = await Room.updateOne({'players.socketid' : socketid},{$set:{'players.$.guessedIt' : true}});
                        //console.log(result);
                        room = await Room.findOne({_id : roomid});
                        await IncreaseGuessedUsers(room,socketid);
                        if(TurnIsOver(room)){
                            io.to(roomid).emit('new-message-to-user','',`The word was <spam>'${WordToGuess}'</span>`,'Right');
                            await ChangeTurn(room);
                            console.log("Turn is Over!");
                            return;
                        }
                        
                        io.to(roomid).emit('updateRoom',room);
                        return cb(null,true);
                    }
                    //If the word does not match one on one, we check how many letters are matching
                    let diff = 0;
                    for(let i = 0;i < WordToGuess.length;i++){
                        text.toLowerCase().charAt(i) != WordToGuess.toLowerCase().charAt(i) && diff++;
                    }
                    //if the difference is only one letter, we allert the user it was close
                    if(diff < 2){
                        socket.broadcast.to(roomid).emit('new-message-to-user',username, text,'Normal');
                        //io.sockets.socket(socketid).emit('new-message-to-user','Server','You guessed it!');
                        socket.emit('new-message-to-user','',`The word <span>${text}</span> is close!`,'Close');
                        return cb(null,false);
                    }
                    else{
                        io.to(roomid).emit("new-message-to-user",username,text,'Normal');
                        return;
                    }
                }
            }
        }catch(e){
            console.log(e);
            return cb(e,null);
        }
    });

    // const createRoom = async function( username , socketid , lang , body, eye, mouth, cb) {
    socket.on("createRoom",async function(params,cb){
        try{
            const room = await createRoom(params.name,params.socketid,params.lang,params.body,params.eye,params.mouth,cb);
            if(room)
                cb(room,null);

        }catch(e){
            return cb(null,e);
        }
    });

    socket.on("startGame",async function(roomid,socketid,data){
        try{
            let room = await Room.findOne({_id : roomid})
            if(room.players.find(player=>player.socketid == socketid).isPartyLeader){
                if(room){
                    await Room.updateOne({_id : roomid},{maxPlayerCount : data.player});
                    await room.save();
                    await Room.updateOne({_id : roomid},{ DrawTime : data.time});
                    await room.save();
                    await Room.updateOne({_id : roomid},{ maxRound : data.round})
                    await room.save();
                    await Room.updateOne({_id : roomid},{ wordToChooseFrom : [Math.floor(Math.random() * words.length) , Math.floor(Math.random() * words.length) , Math.floor(Math.random() * words.length)]});
                    await room.save();
                    await setGameState(roomid,1);
                    room = await Room.findOne({_id : roomid});

                    if(room.players.length > 1)
                        io.to(roomid).emit('turn-over',room,'game-start',{wordstochoosefrom:[words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                    else
                        socket.emit('turn-over',room,'waiting',{});
                    
                    await Room.updateOne({_id : roomid},{'players.0.isDrawing' : true});
                    await room.save();
                }
            }
            else
                console.log("Someone tried to start the game who is not the leader!");
        }catch(err){
            console.log(err);
        }
    });

    socket.on("Join",async function(params,cb){
        try{
            if(params.name && params.lang && params.id){
                //console.log("Got everything!");
                //console.log("name : "+params.name+", lang: "+params.lang);

                const room = await JoinRoom(params.name,params.id,params.lang, params.body, params.eye, params.mouth, cb);
                if(room){
                    const id = room._id.valueOf();
                    socket.join(id);
                    //console.log(socket.rooms);
                    //io.to(room._id).emit('updateRoom',room);
                    socket.broadcast.to(id).emit('updateRoom',room);
                    console.log(id);
                    socket.broadcast.to(id).emit("new-message-to-user",'',`${params.name} joined the room!`,'Join');
                    // Moved the cb from return to here, because we would send the updated room data to the freshly joined user
                    // which would show who is the current drawer, which we don't want
                    cb(room,null);
                    //This can only be two, if the previous length of the array was one before joining
                    //Also it has to be the first round, first turn, since one player cannot play any game by itself
                    if(room.gameState == 0){
                        socket.emit('turn-over',room,'room-making',{});
                    }
                    else if(room.gameState == 1 && room.turnIndex == 0 && room.currRound == 1){
                        socket.emit('turn-over',room,'game-start',{wordstochoosefrom:[words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                        await setGameState(id,1);
                        room.players[0].isDrawing = true;
                        await room.save();
                    }
                    // Also if the game state is 0 and we just joined, we cannot be the drawer
                    // at the same time, we need to check if the turnindex is not 0,
                    // because that means, it is not the start of a new round
                    else if(room.gameState == 1 && room.turnIndex != 0){
                            socket.emit('turn-over',room,'turn-over',{point_gains : room.prevRoundInfo , rightWord : room.word , wordstochoosefrom:[words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                    }
                    else if(room.gameState == 1 && room.turnIndex == 0){
                        socket.emit('turn-over',room,'round-over',{point_gains : room.prevRoundInfo , rightWord : room.word , wordstochoosefrom:[words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                    }

                    const user = room.players.find(player=>player.isDrawing == true);
                    //console.log(user);
                    if(user)
                        if(user.username != params.name)
                            socket.to(user.socketid).emit('paint_data_request',params.id);

                    return;
                }
            }
            else{
                return cb(null,"Something went wrong!");
            }
        }catch(err){
            console.log(err);
            return cb(null, err);
        }
    });

    socket.on('paint_data_to_server',(data) => {
        socket.to(data.user).emit('paint_data_to_user',data.paint_data);
    })

    socket.on('disconnect',()=>{
        console.log("A user just disconnected from the server.");
    });

    socket.on("leave",async function(params){
        try{
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
                    socket.broadcast.to(params.roomid).emit('new-message-to-user','',`${params.username} left the room!`,'Leave');
                    
                    // if(room.gameState != 0){
                        if((params.isDrawing && room.gameState == 2) || (room.players.indexOf(params) == room.turnIndex && room.gameState == 1)){
                            //console.log(room.turnIndex + 1 < room.players.length);
                            if(room.turnIndex + 1 < room.players.length){
                                const point_gains = await CalculatePoints(room);
                                await SetToStart(room);
                                await setGameState(room._id,1);
                                io.to(room._id.valueOf()).emit('turn-over',room,'turn-over',{point_gains : point_gains,rightWord : room.word,wordstochoosefrom:[words[room.wordToChooseFrom[0]],words[room.wordToChooseFrom[1]],words[room.wordToChooseFrom[2]]]});
                                
                                room.players[room.turnIndex].isDrawing = true;
                                room.players[room.turnIndex].guessedIt = false;
                                await room.save();
                                //You have to user the valueof function to get only the id
                                return;
                            }
                            //If the turnindex + 1 is not less than players.length, than it must be equal, 
                            //Since we only increment by one every time
                            return await ChangeRound(room);
                        }
                        if(room.players.length == 1)
                            return EndGame(room);
                    // }
                }else{
                    const status = await deleteRoom(params.roomid);
                    console.log("Room deleting status : "+status.acknowledged);
                }
            }
        }catch(err){
            console.log(err);
        }
    });
})

server.listen(port,() => {
    console.log("Server started and running on port "+port +"!");
})


