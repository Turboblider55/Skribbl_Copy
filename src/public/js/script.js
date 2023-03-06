const canvas = document.querySelector("canvas");
const holder = document.querySelector("#Main-Area");
const tools = document.querySelector("#Tools");
//console.log(holder.offsetLeft)
const ctx = canvas.getContext("2d",{alpha:true,desynchronized:false,colorSpace:'srgb',willReadFrequently:true});

let TOOL = 'pen';

const SetCurrentTool = function(tool){
    TOOL = tool;
}

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

const OFFSETX = holder.offsetLeft + canvas.offsetLeft;
const OFFSETY = holder.offsetTop + canvas.offsetTop;
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

const loop = () => {
    if(STATES.MOUSEDOWN && STATES.MOUSEPREV)
        if(TOOL == 'pen')
            Draw(ctx,COLORS[STATES.COLOR],STATES.PREV,STATES.CURR,OFFSETX,OFFSETY);
        else
            Fill(ctx,STATES.CURR,COLORS[STATES.COLOR]);
    requestAnimationFrame(loop)
}

loop();


