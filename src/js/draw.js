const Draw = (ctx,color,pos1,pos2,offsetx,offsety) => {

    const DX = pos2.x - pos1.x;
    const DY = pos2.y - pos1.y;
    const DISTANCE = Math.sqrt((DX * DX + DY * DY));
    const SUB_STEP = DISTANCE;
    console.log(SUB_STEP);
    const RATIO = 1.0 / SUB_STEP;


    ctx.beginPath();
    ctx.fillStyle = color;
    //ctx.strokeStyle = color;
    //ctx.lineWidth = 3;
    for(let i = 0;i < SUB_STEP;i++){
        ctx.moveTo((pos1.x + DX * RATIO * i) - offsetx,(pos1.y + DY * RATIO * i) - offsety);
        // ctx.lineTo(pos1.x + DX * RATIO * (i+1),pos1.y + DY * RATIO * (i+1));
        //ctx.stroke();
        ctx.arc((pos1.x + DX * RATIO * i) - offsetx,(pos1.y + DY * RATIO * i) - offsety,3,0,Math.PI * 2.0);
        ctx.fill();
    }
    ctx.closePath();
}