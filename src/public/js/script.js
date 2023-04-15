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
const word_information = document.querySelector('#word_information');
const roomMaking = document.querySelector("#RoomMaking");
const ctx = canvas.getContext("2d",{alpha:true,desynchronized:false,colorSpace:'srgb',willReadFrequently:true});
let TOOL = 'pen';
let window_width = window.innerWidth;

const SetCurrentTool = function(tool){
    TOOL = tool;
}

let Paint_Data = [];
Paint_Data.push([]);

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
        Tools.style.display = 'flex';
    }
    else
        Tools.style.display = 'none';
    //Changing the tools element will change the position of the canvas, so we need to get the position of the canvas again
    canvas_rect = canvas.getBoundingClientRect();
}

const ConvertWord = function(word,helpingletters) {
    let result = '';
    if(helpingletters)
        for(let i = 0 ; i < word.length; i ++) {
            //Not contains, includes
            if(helpingletters.includes(i)){
                result += `${word.charAt(i)} `;
            }
            else if(ValidLetters.includes(word.charAt(i)))
                result += '_ ';
            else
                result += `${word.charAt(i)} `;
        }
    else
        for(let i = 0 ; i < word.length; i ++) {
            //Not contains, includes
            if(ValidLetters.includes(word.charAt(i)))
                result += '_ ';
            else
                result += `${word.charAt(i)} `;
        }
    return result;
}

const setColor = function (index) {
    //console.log(index);
    //console.log("Check")
    STATES.COLOR = index;
    Selected_Color.style.backgroundColor = COLORS[index];
}

const RenderPaletta = (obj) => {
    for(let color in COLORS){
        obj.innerHTML += `<div onclick='setColor(${color})' style='background-color:${COLORS[color]};' class='color'></div>`
    }
}

const ClearCanvas = function(){
    ctx.beginPath();
    ctx.fillStyle = 'white';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.closePath();
}

const StartTurn = function(roomid,word){
    console.log(roomid,word);
    socket.emit('start-turn-to-server',roomid,word);
}

const RollUp = () => {
    room_maker.classList.remove('roll-down');
    room_maker.classList.add('roll-up');
}

const RollDown = () => {
    room_maker.classList.remove('roll-up');
    room_maker.classList.add('roll-down');
}

const ShowPointGains = (rightword,point_gains) => {
    room_maker.innerHTML = `
    <p id='rightword'>The right word was <span>${rightword}</span></p>
    <p>Time is up!</p>
    <table>
        ${point_gains.map(info=>`
        <tr>
            <td>${info.name}</td>
            <td class='${info.point_gain > 0 ? 'Gained' : 'NotGained'}'>${info.point_gain > 0 ? '+' : ''}${info.point_gain}</td>
        </tr>
        `).join('')}
    </table>
    `;
}

const ShowCurrentRound = (current_round,max_round) => {
    room_maker.innerHTML = `
    <div>Round ${current_round} of ${max_round}</div>
    `;
}

const ShowFinalResult = (players) => {
    const result = players.sort(function(a,b){return b.points - a.points});
    let str = "<div class='container-column result'><div class='SpaceBetween'>"
    for(let i = 0 ; i < result.length ; i ++) {
        if(i + 1 > 3){
            if(i > 4  && i % 4 == 0){
                str += "</div><div class='SpaceBetween'>";
            }
            else {
                str += `<div>
                <div class='SpaceBetween'>
                ${CreateAvatarText(result[i].body_index,result[i].eye_index,result[i].mouth_index,result[i].isPartyLeader)}
                <div class='PlaceX'>#${i + 1}</div>
                </div>
                <div class='name'>${result[i].username}</div>
                </div>`
            }
        }
        else{
            str += `<div>
            <div class='SpaceBetween'>
            ${CreateAvatarText(result[i].body_index,result[i].eye_index,result[i].mouth_index,result[i].isPartyLeader)}
            <div class='Place${i + 1}'>#${i + 1}</div>
            </div>
            <div class='username'>${result[i].username}</div>
            </div>`

            if(i + 1 == 3)
                str += "</div><div class='SpaceBetween'>"
        }
    }
    str += '</div></div>'
    return str;
}

const ShowWordChoosing = (wordstochoosefrom) => {
    const drawing_player = current_room.players.find(player=>current_room.players[current_room.turnIndex] == player);
        console.log(drawing_player);
        if(drawing_player.socketid == socketid){
            room_maker.innerHTML = `
            <p>Choose a word!</p>
            <div class='SpaceBetween'>
            ${wordstochoosefrom.map(function(word){
                return `<div class='word-option' onclick="StartTurn('${roomid}','${word}')">${word}</div>`
            }).join('')}
            </div>
            `;
            // <div class='word-option' onclick="StartTurn(${roomid},'Choosen word')">Click this!</div>
            //Waiting for the panel to come down, then start to count back
            Timer = 15;
            MyTimer = setInterval(ChangeTimer,1000);
        }
        else{
            room_maker.innerHTML = `
            <p>${drawing_player.username} is choosing a word!</p>
            ${CreateAvatarText(drawing_player.body_index,drawing_player.eye_index,drawing_player.mouth_index,drawing_player.isPartyLeader)}
            `
        }
}

const ShowRoomMaking = () => {
    word_information.innerHTML = 'Waiting';
    time_container.innerHTML = '0';

    room_maker.innerHTML = `
    <div id='RoomMaking'>
        <div class='SpaceBetween'>
            <div class='SpaceBetween'>
                <div id='player'></div>
                <div>Player Count</div>
            </div>
            <select id='player-count' ${!isLeader ? 'disabled' : ''}>
                <option value='2'>2</option>
                <option value='3'>3</option>
                <option value='4'>4</option>
                <option value='5'>5</option>
                <option value='6'>6</option>
                <option value='7'>7</option>
                <option value='8'>8</option>
                <option value='9'>9</option>
                <option value='10' selected='selected'>10</option>
            </select>
        </div>

        <div class='SpaceBetween'>
            <div class='SpaceBetween'>
                <div id='drawtime'></div>
                <div>Drawing Time</div>
            </div>
            <select id='drawing-time' ${!isLeader ? 'disabled' : ''}>
                <option value='15'>15 seconds</option>
                <option value='30'>30 seconds</option>
                <option value='45'>45 seconds</option>
                <option value='60' selected="selected">60 seconds</option>
                <option value='75'>75 seconds</option>
                <option value='90'>90 seconds</option>
                <option value='105'>105 seconds</option>
                <option value='120'>120 seconds</option>
            </select>
        </div>

        <div class='SpaceBetween'>
            <div class='SpaceBetween'>
                <div id='round'></div>
                <div>Rounds</div>
            </div>
            <select id='round-count' ${!isLeader ? 'disabled' : ''}>
                <option value='1'>1</option>
                <option value='2'>2</option>
                <option value='3 selected="selected"'>3</option>
                <option value='4'>4</option>
                <option value='5'>5</option>
            </select>
        </div>

        <button id='StartButton' onclick='StartGame()' ${!isLeader ? 'disabled' : ''}>Start</button>
    </div>
    `
}

const ShowRollDown = (type,data,rightword,wordstochoosefrom) => {
    if(type == 'room-making'){
        ShowRoomMaking();
        RollDown();
    }
    else if(type == 'waiting'){
        ShowCurrentRound(current_room.currRound,current_room.maxRound);
        RollUp();
        setTimeout(() => {
            room_maker.innerHTML = `
                <div>
                    <p>Waiting for other players!</p>
                </div>
                `;
            RollDown();
        }, 1000);
    }
    else if(type == 'game-start'){
            RollUp();
            setTimeout(() => {
                ShowCurrentRound(current_room.currRound,current_room.maxRound);
                RollDown();
                setTimeout(() => {
                    RollUp();
                    setTimeout(() => {
                        ShowWordChoosing(wordstochoosefrom);
                        RollDown();
                    }, 1000);
                }, 1000);
            }, 1000);
    }
    else if(type == 'turn-over'){
        data.sort(function(p1,p2){return p2.point_gain - p1.point_gain});
        ShowPointGains(rightword,data);
        RollDown();
        setTimeout(() => {
            RollUp();
            setTimeout(() => {
                ShowWordChoosing(wordstochoosefrom);
                RollDown();
            },1000);
        }, 2500);
    }
    else if(type == 'round-over'){
        data.sort(function(p1,p2){return p2.point_gain - p1.point_gain});
        ShowPointGains(rightword,data);
        RollDown();
        setTimeout(() => {
            setTimeout(() => {
                RollUp();
                setTimeout(() => {
                    ShowCurrentRound(current_room.currRound,current_room.maxRound);
                    RollDown();
                    setTimeout(() => {
                        RollUp();
                        setTimeout(() => {
                            ShowWordChoosing(wordstochoosefrom);
                            RollDown();
                        }, 1000);
                    }, 2000);
                }, 1000);
            }, 1000);
        }, 2500);
    }
    else if(type == 'game-over'){
        data.sort(function(p1,p2){return p2.point_gain - p1.point_gain});
        ShowPointGains(rightword,data);
        RollDown();
        setTimeout(() => {
            RollUp();
            setTimeout(() => {
                room_maker.innerHTML = `
                <div class='container-column final'>
                <div #id='result'>Result</div>
                ${ShowFinalResult(current_room.players)}
                </div>
                `;
                RollDown();
                setTimeout(() => {
                    RollUp();
                    setTimeout(() => {
                        // room_maker.innerHTML = `
                        // <div>
                        //     <p>Waiting for other players!</p>
                        // </div>
                        // `;
                        ShowRoomMaking();
                        RollDown();
                    }, 1000);
                }, 3000);
            }, 1000);
        }, 2500);
    }
}

const CreateAvatarText = function(body,eye,mouth,Leader){
    return `
    <div class='avatar'>
        <div class='body' style='background-position : -${(body % 10) * 100}% -${Math.floor(body / 10) * 100}%'></div>
        <div class='eye' style='background-position : -${(eye % 10) * 100}% -${Math.floor(eye / 10)  * 100}%'></div>
        <div class='mouth' style='background-position : -${(mouth % 10) * 100}% -${Math.floor(mouth / 10)  * 100}%'></div>
        ${Leader ? `<div class='leader'></div>` : ""}
    </div>
    `;
}
lobby_avatar.innerHTML = CreateAvatarText(body_index,eye_index,mouth_index,isLeader);

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
    
    lobby_avatar.innerHTML =  CreateAvatarText(body_index,eye_index,mouth_index, isLeader);
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
    points_arr.sort(function(a,b){return b - a});
    player_container.innerHTML = room.players.map(function(player){
        //if(player.socketid == socketid)
            return `<div class='SpaceBetween ${player.guessedIt ? 'guessedIt' : ""} Player_Info' >
            <span>#${points_arr.indexOf(player.points) + 1}</span>
            <div class='player-data container-column'>
                ${player.socketid == socketid ? `<p class='You username'>${player.username} (You)</p>` : `<p class='username'>${player.username}</p>`}
                <p class='points'>${player.points} points</p>
            </div>
            ${player.isDrawing ? "<div class='pen'></div>" : ""}
            ${CreateAvatarText(player.body_index, player.eye_index, player.mouth_index,player.isPartyLeader)}
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
    // console.log('Hey');
    if(Paint_Data[Paint_Data.length -1].length != 0){
        Paint_Data.push([]);
        console.log('New part added!');
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
    else if(tool == 'eraser'){
        Erase(ctx,data.pos1,data.pos2,data.width);
    }
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
        for(let j of i){
            if(j.tool == 'pen'){
                Draw(ctx,j.color,j.prev,j.curr,j.wjdth);
            }
            else if(j.tool == 'eraser'){
                Erase(ctx,j.prev,j.curr,j.width);
            }
        }
    }
});

const loop = () => {
    if(isDrawing){
        //console.log(MyTimer == null, GameIsOn, playerCount > 1);
        if(window_width != window.innerWidth){
            console.log("Window size changed!");
            canvas_rect = canvas.getBoundingClientRect();
            window_width = window.innerWidth;
        }

        if(MyTimer == null && GameIsOn && playerCount > 1){
            console.log('This is true');
            MyTimer = setInterval(ChangeTimer,1000);
        }
        // if(STATES.MOUSEDOWN && !STATES.MOUSEPREV){
        //     Paint_Data.push([]);
        //     console.log('New part added!');
        // }
        if(STATES.MOUSEDOWN && STATES.MOUSEPREV){
            if(TOOL == 'pen'){
                const offset = new vec2(canvas_rect.x,canvas_rect.y);
                //console.log(offset);
                const new_prev = Vec2.Sub(offset,STATES.PREV);
                const new_curr = Vec2.Sub(offset,STATES.CURR);
                Draw(ctx,COLORS[STATES.COLOR],new_prev,new_curr,canvas.width);
                //Paint_Data.push({colorindex:STATES.COLOR,prev : new_prev, curr : new_curr, canvas_width : canvas.width});
                if(connected){
                    console.log("this code runs!");
                    Paint_Data[Paint_Data.length - 1].push({ tool : TOOL,color : COLORS[STATES.COLOR],prev : new_prev,curr : new_curr,width : canvas.width});
                    socket.emit('paint_to_server',TOOL,{room : roomid , color : COLORS[STATES.COLOR] , pos1 : new_prev , pos2 : new_curr , width : canvas.width});
                }
            }
            else if(TOOL == 'eraser'){
                // Fill(ctx,STATES.CURR,COLORS[STATES.COLOR]);
                const offset = new vec2(canvas_rect.x,canvas_rect.y);
                //console.log(offset);
                const new_prev = Vec2.Sub(offset,STATES.PREV);
                const new_curr = Vec2.Sub(offset,STATES.CURR);

                Erase(ctx,new_prev,new_curr,canvas.width);
                Paint_Data[Paint_Data.length - 1].push({ tool : TOOL,color : COLORS[STATES.COLOR],prev : new_prev,curr : new_curr,width : canvas.width});
                socket.emit('paint_to_server',TOOL,{room : roomid , pos1 : new_prev , pos2 : new_curr , width : canvas.width});
            }
        }
        if(TOOL == 'trash'){
            socket.emit('paint_to_server',TOOL,{room : roomid});
            Paint_Data = [];
            Paint_Data.push([]);
            ClearCanvas();
            //ClearCanvas();
            TOOL = 'pen';
        }
    }
    requestAnimationFrame(loop)
}

loop();


