const canvas = document.querySelector("canvas");
let canvas_rect = canvas.getBoundingClientRect();
const Tools = document.querySelector('#Tools');
const holder = document.querySelector("#Main-Area");
const Colors = document.querySelector("#Colors");
const Selected_Color = document.querySelector('#Selected_Color')
const chat = document.querySelector("#Chat-body")
const message_input = document.querySelector("#message_input");
const player_container = document.querySelector("#player_container");
const time_container = document.querySelector('#time_container');
const round_container = document.querySelector('#round_container');
const lobby_avatar = document.querySelector('#lobby_avatar');
const room_maker = document.querySelector('#room_maker');
const ctx = canvas.getContext("2d",{alpha:true,desynchronized:false,colorSpace:'srgb',willReadFrequently:true});
let TOOL = 'pen';
let window_width = window.innerWidth;

const SetCurrentTool = function(tool){
    TOOL = tool;
}

let Paint_Data = [];

// message_input.addEventListener("keydown",function(event){

//     if(event.key == "Enter")
//         sendMessage();

//     event.preventDefault();
// });

//console.log(canvas.offsetLeft);

let STATES = {
    MOUSEDOWN : false,
    MOUSEPREV: false,
    COLOR : 0,
    CURR : new vec2(0,0),
    PREV : new vec2(0,0)
}

const SwitchTools = function() {
    if(isDrawing){
        Tools.style.display = 'block';
    }
    else
        Tools.style.display = 'none';
}

const setColor = function (index) {
    //console.log(index);
    //console.log("Check")
    STATES.COLOR = index;
    Selected_Color.style.backgroundColor = COLORS[index];
}

const ClearCanvas = function(){
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.closePath();
}

const ShowRollDown = (type,data,rightword,showRoundChange) => {
    room_maker.innerHTML = `
    <p id='rightword'>The right word was <span>${rightword}</span></p>
    <p>Time is up!</p>
    <table>
        ${data.map(info=>`
        <tr>
            <td>${info.name}</td>
            <td class='${info.point_gain > 0 ? 'Gained' : 'NotGained'}'>${info.point_gain > 0 ? '+' : ''}${info.point_gain}</td>
        </tr>
        `).join('')}
    </table>
    `;
    // room_maker.style.animation = 'roll-down 1s cubic-bezier(0.55, 0.01, 0.45, 1.38) both 0s alternate backwards';
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
            return `<div class='SpaceBetween ${player.guessedIt ? 'guessedIt' : ""} Player_Info' >
            <span>#${points_arr.indexOf(player.points) + 1}</span>
            <div class='player-data container-column'>
                ${player.socketid == socketid ? `<p class='You'>${player.username} (You)</p>` : `<p>${player.username}</p>`}
                <p>${player.points} points</p>
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

RenderPaletta(Colors,setColor);

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

socket.on('paint_to_user',function(tool,data){
    if(tool == 'pen')
        Draw(ctx,data.color,data.pos1,data.pos2,data.width);
    else if(tool == 'trash')
        ClearCanvas();
});

socket.on('new-message-to-user',function(username,text,type){
    chat.insertAdjacentHTML('beforeend',`<div class='message ${type.substring(0,type.length)}'> ${username ? `<span class='user'>${username}:</span>` : ''} <span class='text'>${text}</span></div>`);
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
        if(window_width != window.innerWidth){
            canvas_rect = canvas.getBoundingClientRect();
            window_width = window.innerWidth;
        }

        if(MyTimer == null && GameIsOn && playerCount > 1){
            console.log('This is true');
            MyTimer = setInterval(ChangeTimer,1000);
        }
        if(STATES.MOUSEDOWN && STATES.MOUSEPREV){
            if(TOOL == 'pen'){
                const offset = new vec2(canvas_rect.x + 10.0,canvas_rect.y);
                //console.log(offset);
                const new_prev = Vec2.Sub(offset,STATES.PREV);
                const new_curr = Vec2.Sub(offset,STATES.CURR);
                Draw(ctx,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
                //Paint_Data.push({colorindex:STATES.COLOR,prev : new_prev, curr : new_curr, canvas_width : canvas.width});
                if(connected){
                    console.log("this code runs!");
                    Paint_Data.push({color : COLORS[STATES.COLOR],prev : new_prev,curr : new_curr,width : canvas.width});
                    socket.emit('paint_to_server',TOOL,{room : roomid , color : COLORS[STATES.COLOR] , pos1 : new_prev , pos2 : new_curr , width : canvas.width});
                }
            }
            else
                Fill(ctx,STATES.CURR,COLORS[STATES.COLOR]);
        }
        if(TOOL == 'trash'){
            socket.emit('paint_to_server',TOOL,{room : roomid});
            ClearCanvas();
            //ClearCanvas();
            TOOL = 'pen';
        }
    }
    requestAnimationFrame(loop)
}

loop();


