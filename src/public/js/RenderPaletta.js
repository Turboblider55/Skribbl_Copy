const RenderPaletta = (obj) => {
    for(let color in COLORS){
        obj.innerHTML += `<div onclick='setColor(${color})'>${COLORS[color]}</div>`
    }
}