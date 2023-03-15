const canvas = document.querySelector("canvas");
const holder = document.querySelector("#Main-Area");
const tools = document.querySelector("#Tools");
const chat = document.querySelector("#Chat")
const message_input = document.querySelector("#message_input");
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

RenderPaletta(tools,setColor);

// let OFFSETX = holder.offsetLeft + canvas.offsetLeft;
// let OFFSETY = holder.offsetTop + canvas.offsetTop;
//canvas.height = window.innerHeight * 0.5;
// canvas.width = window.innerWidth;
// canvas.height = window.innerHeight;


canvas.addEventListener('mousedown',event=>{
    if(event.button == 0){
        STATES.MOUSEDOWN = true;
    }
});
canvas.addEventListener('mouseup',event=>{
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

socket.on('new-message-to-user',function(username,text){
    chat.insertAdjacentHTML('beforeend',`<div class='message'>${username}: ${text}</div>`);
});

const loop = () => {
    if(isLeader)
    if(STATES.MOUSEDOWN && STATES.MOUSEPREV){
        if(TOOL == 'pen'){
            const offset = new vec2(canvas.offsetLeft,canvas.offsetTop);
            const new_prev = Vec2.Sub(offset,STATES.PREV);
            const new_curr = Vec2.Sub(offset,STATES.CURR);
            Draw(ctx,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
            //Paint_Data.push({colorindex:STATES.COLOR,prev : new_prev, curr : new_curr, canvas_width : canvas.width});
            if(connected){
                console.log("this code runs!");
                socket.emit('paint_to_server',roomid,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
            }
        }
        else
            Fill(ctx,STATES.CURR,COLORS[STATES.COLOR]);
    }
    requestAnimationFrame(loop)
}

loop();


