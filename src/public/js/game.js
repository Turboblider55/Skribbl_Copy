
let socket = io();

let socketid = "";
let connected = false;
let username = '';
let roomid = '';
let Joined = false;
let isLeader = false;
let current_room = {};
let isGuessed  = false;
let isDrawing = false;
let GameIsOn = false;
let Timer = -1;
let MyTimer = null;
let playerCount = 0;
let game_state = '';

//by default, there are 26 body, 57 eye, and 51 mouth,
//but we need to subtract 1, since we need the indexes
let body_index = Math.floor(Math.random() * 25);
let eye_index = Math.floor(Math.random() * 56);
let mouth_index = Math.floor(Math.random() * 50);

function validateName(name){
    return name.trim().length > 0 && name.trim().length <= 30;
}

function ChangeTimer(){
    if(Timer != -1 && Timer > 0){
        //console.log('Time is sent');
        Timer--;
        console.log(Timer);
        socket.emit('Change-Timer',roomid,Timer);
        renderTimer(Timer);
    }
}

function sendMessage(event,obj){
    if(event.key == 'Enter'){
        event.preventDefault();
        const text = obj.value;
        if(text.trim().length > 0){
            socket.emit("new-message-to-server",roomid,socketid,username,text,isGuessed,isDrawing,function(err,res){
                if(err){
                    console.log(err);
                    return;
                }
                isGuessed = res;
                console.log(isGuessed);
            });
            obj.value = '';
        }
    }
}

function gameon(){
    document.querySelector("#game").style.display = 'grid';
    document.querySelector("#lobby").style.display = 'none';
    Joined = true;
}
function gameoff(){
    document.querySelector("#game").style.display = 'none';
    document.querySelector("#lobby").style.display = 'flex';
    Joined = false;
}

 function Disconnect(){
    if(Joined){
        gameoff();
        socket.emit("leave",{roomid , socketid , username , isDrawing})
    }
}

function EndOfGame(){
    console.log(GameIsOn);
        console.log('End of game!');
        clearInterval(MyTimer);
        GameIsOn = false;
        isGuessed = false;
        isDrawing = false;
        SwitchTools();
        //Not needed for now,
        // ctx.beginPath();
        // ctx.fillRect(0,0,canvas.width,canvas.height);
        // ctx.closePath();
}

function JoinRoom(){
    const u = document.querySelector("#username").value;
    // const l = document.querySelector("#language").value;    
    const l = "english";

    if(connected){
        if(u.length > 0)
            if(validateName(u))
                username = u;
            else
                alert("This name is not valid!");
        else{
            username = generatename();
            console.log(username);
        }

        socket.emit("Join",{name : username,lang : l,id : socketid, body : body_index, eye : eye_index, mouth : mouth_index},function(data,err){
            if(err){
                console.log(err);
                return;
            }
                roomid = data._id;
                //console.log(data.players.find(user=> user.socketid == socketid).isPartyLeader);
                isLeader = data.players.find(user=> user.socketid == socketid).isPartyLeader;
                isDrawing = data.players.find(user=> user.socketid == socketid).isDrawing;
                playerCount = data.players.length;
                GameIsOn = playerCount > 1 ? true : false;

                if(!GameIsOn){
                    RollDown();
                }

                round_container.innerHTML = `Round ${data.currRound} of ${data.maxRound}`;
                time_container.innerHTML = data.DrawTime;
                SwitchTools();
                ClearCanvas();
                console.log(isDrawing);
                //console.log(isLeader);
                current_room = data;
                //console.log(data);
                console.log('No error here!');
                Joined = true;
                Timer = data.currentTime;
                console.log(data);
                renderPlayers(data);
                gameon();
        })
    }
    else{
        alert("Could not connect to the server!");
    }
}

function StartGame(){
    let player = document.querySelector("#player-count").value;
    let time = document.querySelector("#drawing-time").value;
    let round = document.querySelector("#round-count").value;
    socket.emit("startGame",roomid,socketid,{player,time,round});
}
function CreateRoom(){
    socket.emit("createRoom",{name : username,lang : l,id : socketid, body : body_index, eye : eye_index, mouth : mouth_index},function(data,err){

        if(err){
            console.log("ERROR!");
            return;
        }
                roomid = data._id;
                //console.log(data.players.find(user=> user.socketid == socketid).isPartyLeader);
                isLeader = true
                isDrawing = false
                playerCount = 1

                round_container.innerHTML = `Round ${data.currRound} of ${data.maxRound}`;
                time_container.innerHTML = data.DrawTime;
                SwitchTools();
                ClearCanvas();
                console.log(isDrawing);
                //console.log(isLeader);
                current_room = data;
                //console.log(data);
                console.log('No error here!');
                Joined = true;
                Timer = data.currentTime;
                console.log(data);
                renderPlayers(data);
                gameon();


    });
}

socket.on('Change-Timer',function(time,helpingLetter){
    Timer = time;
    //console.log(Timer);
    if(helpingLetter && !isDrawing)
        word_information.innerHTML = `<p>Guess This</p><p>${ConvertWord(current_room.word,helpingLetter)}</p>`;
    renderTimer(time);
});

socket.on("Kicked",function(text){
    alert('You have been kicked! Reason:' +text);
    Disconnect();
});

socket.on('end-of-game',function(room){
    //console.log(room);
    renderPlayers(room);
    EndOfGame();
});

socket.on("connect",function(){
    console.log("Socket connected succesfully!");
    //console.log(socket.id);
    socketid = socket.id;
    connected = true;
});

socket.on("updateRoom",function(room){
    //console.log('New room data');
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    //console.log(isLeader);
    current_room = room;
    renderPlayers(room);
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;
})

socket.on("start-turn-to-user",function(room){
    console.log('Turn started!')

    clearInterval(MyTimer);
    MyTimer = null;

    current_room = room;
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    SwitchTools();
    renderPlayers(room);
    ClearCanvas();
    
    Timer = room.DrawTime;
    isGuessed = false;
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;

    if(isDrawing){
        word_information.innerHTML = `<p>Draw This</p><p>${current_room.word}</p>`;
    }
    else{
        word_information.innerHTML = `<p>Guess This</p><p>${ConvertWord(current_room.word)}</p>`;
    }

    room_maker.classList.remove('roll-down');
    room_maker.classList.add('roll-up');
    canvas_rect = canvas.getBoundingClientRect();
});

socket.on('turn-over',function(room,type,datas){
    console.log('Turn Changed!');
    current_room = room;
    ShowRollDown(type,datas.point_gains,datas.rightWord,datas.wordstochoosefrom);
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    SwitchTools();
    
    renderPlayers(room);
    // ClearCanvas();

    clearInterval(MyTimer);
    MyTimer = null;

    Timer = room.DrawTime;
    isGuessed = false;
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;
});

socket.on('round-over',function(room,type,datas){
    console.log('Round changed!');
    current_room = room;
    ShowRollDown(type,datas.point_gains,datas.rightWord,datas.wordstochoosefrom);
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    round_container.innerHTML = `Round ${room.currRound} of ${room.maxRound}`;
    SwitchTools();
    renderPlayers(room);
    // ClearCanvas();

    clearInterval(MyTimer);
    MyTimer = null;
    
    Timer = room.DrawTime;
    isGuessed = false;
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;
});
socket.on('disconnect', function(){
    console.log('Disconnected from server');
    Disconnect();
});