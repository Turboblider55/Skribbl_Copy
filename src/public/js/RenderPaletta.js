const RenderPaletta = (obj) => {
    for(let color in COLORS){
        obj.innerHTML += `<div onclick='setColor(${color})' style='background-color:${COLORS[color]};' class='color'></div>`
    }
}