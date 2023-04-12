const Draw = (ctx,color,pos1,pos2,canvas_width) => {

    //Ugly work at best
    let RATIO = canvas.width / canvas_width;
    //Canculating the new positions of the points, 
    //relative to the drawer's canvas size 
    //(if wider, we pull the points apart, 
    //if thinner, we pull them closer together)
    const new_pos1 = new vec2(pos1.x * RATIO,pos1.y);
    const new_pos2 = new vec2(pos2.x * RATIO,pos2.y);

    const DX = new_pos2.x - new_pos1.x;
    const DY = new_pos2.y - new_pos1.y;
    const DISTANCE = Math.sqrt((DX * DX + DY * DY));
    const SUB_STEP = DISTANCE;
    //console.log(SUB_STEP);
    RATIO = 1.0 / SUB_STEP;

    ctx.beginPath();
    ctx.fillStyle = color;
    //ctx.strokeStyle = color;
    //ctx.lineWidth = 3;
    for(let i = 0;i < SUB_STEP;i++){
        ctx.moveTo((new_pos1.x + DX * RATIO * i),(new_pos1.y + DY * RATIO * i));
        // ctx.lineTo(new_pos1.x + DX * RATIO * (i+1),new_pos1.y + DY * RATIO * (i+1));
        //ctx.stroke();
        ctx.arc((new_pos1.x + DX * RATIO * i),(new_pos1.y + DY * RATIO * i),3,0,Math.PI * 2.0);
        ctx.fill();
    }
    ctx.closePath();
}

const Fill = (ctx,pos,color) => {
    var c = ctx.getImageData(pos.x, pos.y, 1, 1).data;
    console.log(c);
}

const Erase = (ctx,pos1,pos2,canvas_width) => {
    //Ugly work at best
    let RATIO = canvas.width / canvas_width;
    //Canculating the new positions of the points, 
    //relative to the drawer's canvas size 
    //(if wider, we pull the points apart, 
    //if thinner, we pull them closer together)
    const new_pos1 = new vec2(pos1.x * RATIO,pos1.y);
    const new_pos2 = new vec2(pos2.x * RATIO,pos2.y);

    const DX = new_pos2.x - new_pos1.x;
    const DY = new_pos2.y - new_pos1.y;
    const DISTANCE = Math.sqrt((DX * DX + DY * DY));
    const SUB_STEP = DISTANCE;
    //console.log(SUB_STEP);
    RATIO = 1.0 / SUB_STEP;

    ctx.beginPath();
    ctx.fillStyle = 'white';
    //ctx.strokeStyle = color;
    //ctx.lineWidth = 3;
    for(let i = 0;i < SUB_STEP;i++){
        ctx.moveTo((new_pos1.x + DX * RATIO * i),(new_pos1.y + DY * RATIO * i));
        // ctx.lineTo(new_pos1.x + DX * RATIO * (i+1),new_pos1.y + DY * RATIO * (i+1));
        //ctx.stroke();
        ctx.arc((new_pos1.x + DX * RATIO * i),(new_pos1.y + DY * RATIO * i),5,0,Math.PI * 2.0);
        ctx.fill();
    }
    ctx.closePath();
}