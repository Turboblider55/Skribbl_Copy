
let socket = io();
let ID = "";

function validateName(name){
    return name.trim().length > 0 && name.split(" ").length == 1;
}

function game(){
    document.querySelector("#game").style.display = 'flex';
    document.querySelector("#lobby").style.display = 'none';
    //console.log("Hello");
}
function room(){
    
}

function JoinRoom(){
    const u = document.querySelector("#username").value;
    const l = document.querySelector("#language").value;    

    if(c){
        let name = '';
        if(u.length > 0)
            if(validateName(u))
                name = u;
            else
                alert("This name is not valid!");
        else{
            name = generatename();
            console.log(name);
        }

        socket.emit("Join",{name,lang : l,id : ID},function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log('No error here!');
                game();
            }
        })
    }
}

function CreateRoom(){
    const u = document.querySelector("#username").value;
    const l = document.querySelector("#language").value;    

    if(c){
        let name = '';
        if(u.length > 0)
            if(validateName(u))
                name = u;
            else
                alert("This name is not valid!");
        else{
            name = generatename();
            console.log(name);
        }

        socket.emit("Join",{name,lang : l,id : ID},function(err){
            if(err){
                console.log(err);
            }
            else{
                console.log('No error here!');
                game();
            }
        })
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
    
});
