const canvas = document.querySelector("canvas");
const holder = document.querySelector("#Main-Area");
const tools = document.querySelector("#Tools");
const chat = document.querySelector("#Chat")
const message_input = document.querySelector("#message_input");
const player_container = document.querySelector("#player_container");
const ctx = canvas.getContext("2d",{alpha:true,desynchronized:false,colorSpace:'srgb',willReadFrequently:true});
let TOOL = 'pen';

const SetCurrentTool = function(tool){
    TOOL = tool;
}

let Paint_Data = [];

// message_input.addEventListener("keydown",function(event){

//     if(event.key == "Enter")
//         sendMessage();

//     event.preventDefault();
// });


canvas.width = window.innerWidth * 0.25;
//console.log(canvas.offsetLeft);

let STATES = {
    MOUSEDOWN : false,
    MOUSEPREV: false,
    COLOR : 0,
    CURR : new vec2(0,0),
    PREV : new vec2(0,0)
}

const setColor = (index) => {
    console.log(index);
    //console.log("Check")
    STATES.COLOR = index;
}

const renderPlayers = function(room){
    // console.log(room.players)
    // room.players = room.players.sort((a,b)=> a.username - b.username);
    // console.log(room.players);

    let arr = [];
    for(let player of room.players)
        arr.push(player.points);
    
    let points_arr = [...new Set(arr)];
    player_container.innerHTML = room.players.map(function(player){
        if(player.username == username)
            return `<div class='SpaceBetween'><span>#${points_arr.indexOf(player.points) + 1}</span><span class='You'>${player.username} (You)</span></div>`;
        else
            return `<div class='SpaceBetween'><span>#${points_arr.indexOf(player.points) + 1}</span> <span>${player.username}</span></div>`;
    }).join("\n");
}

RenderPaletta(tools,setColor);

// let OFFSETX = holder.offsetLeft + canvas.offsetLeft;
// let OFFSETY = holder.offsetTop + canvas.offsetTop;
//canvas.height = window.innerHeight * 0.5;
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;


canvas.addEventListener('mousedown',function(event){
    if(event.button == 0){
        STATES.MOUSEDOWN = true;
    }
});
canvas.addEventListener('mouseup',function(event){
    if(event.button == 0){
        STATES.MOUSEDOWN = false;
        STATES.MOUSEPREV = false;
    }
});
canvas.addEventListener('mousemove',event=>{
    //console.log("Mouse Moved X: "+event.clientX);
    if(!STATES.MOUSEPREV && STATES.MOUSEDOWN){
        STATES.CURR.x = event.clientX;
        STATES.CURR.y = event.clientY;
        STATES.PREV.x = event.clientX;
        STATES.PREV.y = event.clientY;
        
        STATES.MOUSEPREV = true;
    }
    if(STATES.MOUSEDOWN){
        //console.log("Hello");
        STATES.PREV = new vec2(STATES.CURR.x,STATES.CURR.y);
        STATES.CURR.x = event.clientX;
        STATES.CURR.y = event.clientY;
    }
    // if(!STATES.MOUSEDOWN){
    //     console.log("Hello");
    //     STATES.PREV = new vec2(event.clientX,event.clientY);
    // }
});

socket.on('paint_to_user',function(color,pos1,pos2,width){
    Draw(ctx,color,pos1,pos2,width);
});

socket.on('new-message-to-user',function(username,text,type){
    chat.insertAdjacentHTML('beforeend',`<div class='message ${type.substring(0,type.length)}'> <span class='user'>${username}:</span> <span class='text'>${text}</span></div>`);
});

socket.on('paint_data_request',function(id){
    socket.emit('paint_data_to_server',{user : id, paint_data : Paint_Data});
});

socket.on('paint_data_to_user',function(data){
    console.log('New painting data arrived!');
    console.log(data);
    for(let i of data){
        Draw(ctx,i.color,i.prev,i.curr,i.width);
    }
});

const loop = () => {
    if(isDrawing){
        if(MyTimer == null && GameIsOn)
            MyTimer = setInterval(ChangeTimer,1000);
        if(STATES.MOUSEDOWN && STATES.MOUSEPREV){
            if(TOOL == 'pen'){
                const offset = new vec2(canvas.offsetLeft,canvas.offsetTop);
                const new_prev = Vec2.Sub(offset,STATES.PREV);
                const new_curr = Vec2.Sub(offset,STATES.CURR);
                Draw(ctx,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
                //Paint_Data.push({colorindex:STATES.COLOR,prev : new_prev, curr : new_curr, canvas_width : canvas.width});
                if(connected){
                    console.log("this code runs!");
                    Paint_Data.push({color : COLORS[STATES.COLOR],prev : new_prev,curr : new_curr,width : canvas.width});
                    socket.emit('paint_to_server',roomid,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
                }
            }
            else
                Fill(ctx,STATES.CURR,COLORS[STATES.COLOR]);
        }
    }
    requestAnimationFrame(loop)
}

loop();


