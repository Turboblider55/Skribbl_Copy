const canvas = document.querySelector("canvas");
const holder = document.querySelector("#Main-Area");
const tools = document.querySelector("#Tools");
const chat = document.querySelector("#Chat")
const message_input = document.querySelector("#message_input");
const player_container = document.querySelector("#player_container");
const time_container = document.querySelector('#time_container');
const lobby_avatar = document.querySelector('#lobby_avatar');
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

const setColor = function (index) {
    console.log(index);
    //console.log("Check")
    STATES.COLOR = index;
}

const CreateAvatarText = function(body,eye,mouth){
    return `
    <div class='avatar'>
        <div class='body' style='background-position : -${(body % 10) * 100}% -${Math.floor(body / 10) * 100}%'></div>
        <div class='eye' style='background-position : -${(eye % 10) * 100}% -${Math.floor(eye / 10)  * 100}%'></div>
        <div class='mouth' style='background-position : -${(mouth % 10) * 100}% -${Math.floor(mouth / 10)  * 100}%'></div>
    </div>
    `;
}
lobby_avatar.innerHTML = CreateAvatarText(body_index,eye_index,mouth_index);

const ChangeAvatar = function(num){
    switch(num){
        case 1 : eye_index > 0 ? eye_index-- : eye_index = 56; break;
        case 2 : mouth_index > 0 ? mouth_index-- : mouth_index = 50; break;
        case 3 : body_index > 0 ? body_index-- : body_index = 25; break;
        case 4 : eye_index < 56 ? eye_index++ : eye_index = 0; break;
        case 5 : mouth_index < 50 ? mouth_index++ : mouth_index = 0; break;
        case 6 : body_index < 25 ? body_index++ : body_index = 0; break;
        default : break;
    }
    
    lobby_avatar.innerHTML =  CreateAvatarText(body_index,eye_index,mouth_index);
}


const renderTimer = function (time) {
    time_container.innerHTML = time;
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
        //if(player.socketid == socketid)
            return `<div class='SpaceBetween'>
            <span>#${points_arr.indexOf(player.points) + 1}</span>
            <div class='player-data'>
                ${player.socketid == socketid ? `<p class='You'>${player.username} (You)</p>` : `<p>${player.username}</p>`}
                <p>${player.points}</p>
            </div>
            ${player.isDrawing ? "<div class='pen'></div>" : ""}
            ${CreateAvatarText(player.body_index, player.eye_index, player.mouth_index)}
            </div>`;
        //else
            // return `<div class='SpaceBetween'>
            // <span>#${points_arr.indexOf(player.points) + 1}</span>
            // <div class='player-data'>
            //     <p>${player.username}</p>
            //     <p>${player.points}</p>
            // </div>
            // ${CreateAvatarText(player.body_index, player.eye_index, player.mouth_index)}
            // </div>`;
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
canvas.addEventListener('mousemove',function(event){
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
        //console.log(MyTimer == null, GameIsOn, playerCount > 1);
        if(MyTimer == null && GameIsOn && playerCount > 1){
            console.log('This is true');
            MyTimer = setInterval(ChangeTimer,1000);
        }
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


