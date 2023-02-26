
let socket = io();
let ID = "";

let username = '';

function validateName(name){
    return name.trim().length > 0 && name.split(" ").length == 1;
}

function game(){
    document.querySelector("#game").style.display = 'flex';
    document.querySelector("#lobby").style.display = 'none';
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

        socket.emit("Join",{name : username,lang : l,id : ID},function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log('No error here!');
                game();
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
    console.log(socket.id);
    ID = socket.id;
    c = true;
});

socket.on('disconnect', function(){
    console.log('Disconnected from server');

    socket.emit("leave",{name : username},function(err){
        if(err){
            console.log(err);
        }
        else{
            console.log('No error here!');
            game();
        }
    })
});
