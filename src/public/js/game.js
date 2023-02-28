
let socket = io();
let ID = "";

let username = '';
let roomid = '';
let Joined = false;

function validateName(name){
    return name.trim().length > 0 && name.split(" ").length == 1;
}

function gameon(){
    document.querySelector("#game").style.display = 'flex';
    document.querySelector("#lobby").style.display = 'none';
    //console.log("Hello");
}
function gameoff(){
    document.querySelector("#game").style.display = 'none';
    document.querySelector("#lobby").style.display = 'flex';
    //console.log("Hello");
}

function JoinRoom(){
    const u = document.querySelector("#username").value;
    const l = document.querySelector("#language").value;    

    if(c){
        if(u.length > 0)
            if(validateName(u))
                username = u;
            else
                alert("This name is not valid!");
        else{
            username = generatename();
            console.log(username);
        }

        socket.emit("Join",{name : username,lang : l,id : ID},function(data,err){
            if(err){
                console.log(err);
            }
            else{
                roomid = data;
                console.log(roomid);
                console.log('No error here!');
                gameon();
                Joined = !Joined;
            }
        })
    }
    else{
        alert("Could not connect to the server!");
    }
}

let c = false;

socket.on("connect",function(){
    console.log("Socket connected succesfully!");
    //console.log(socket.id);
    ID = socket.id;
    c = true;
});

socket.on("room-name",function(obj){
    console.log(obj.roomname);
    roomid = obj.roomname;
});

socket.on('disconnect', function(){
    console.log('Disconnected from server');
    gameoff();
    if(Joined){
        socket.emit("leave",{ roomid , socketid : ID},function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log('disconnected');
            }
        })
        Joined = !Joined;
    }
});
