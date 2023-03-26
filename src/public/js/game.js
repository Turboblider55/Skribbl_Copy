
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

function validateName(name){
    return name.trim().length > 0;
}

function ChangeTimer(){
    if(Timer != -1 && Timer > 0){
        //console.log('Time is sent');
        Timer--;
        console.log(Timer);
        socket.emit('Change-Timer',roomid,Timer);
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
    document.querySelector("#game").style.display = 'flex';
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
        EndOfGame();
    }
}

function EndOfGame(){
    if(GameIsOn){
        console.log('End of game!');
        clearInterval(MyTimer);
        GameIsOn = false;
        isGuessed = false;
    }
}

function JoinRoom(){
    const u = document.querySelector("#username").value;
    const l = document.querySelector("#language").value;    

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

        socket.emit("Join",{name : username,lang : l,id : socketid},function(data,err){
            if(err){
                console.log(err);
            }
                roomid = data._id.valueOf();
                //console.log(data.players.find(user=> user.socketid == socketid).isPartyLeader);
                isLeader = data.players.find(user=> user.socketid == socketid).isPartyLeader;
                isDrawing = data.players.find(user=> user.socketid == socketid).isDrawing;
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

socket.on('Change-Timer',function(time){
    Timer = time;
    console.log(Timer);
});

socket.on('end-of-game',function(room){
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

socket.on('change-turn',function(room){
    console.log('Turn Changed!');
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    current_room = room;
    renderPlayers(room);
    if(MyTimer)
    clearInterval(MyTimer);
    Timer = room.DrawTime;
    isGuessed = false;
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;
});

socket.on('change-round',function(room){
    console.log('Round changed!');
    console.log(room);
    isLeader = room.players.find(user=> user.socketid == socketid).isPartyLeader;
    isDrawing = room.players.find(user=> user.socketid == socketid).isDrawing;
    current_room = room;
    renderPlayers(room);
    if(MyTimer)
    clearInterval(MyTimer);
    Timer = room.DrawTime;
    isGuessed = false;
    playerCount = room.players.length;
    GameIsOn = playerCount > 1 ? true : false;
});
socket.on('disconnect', function(){
    console.log('Disconnected from server');
    Disconnect();
});