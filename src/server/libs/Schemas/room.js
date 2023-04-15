const mongoose = require("mongoose");
const {usermodel,userSchema} = require('./user');

const roomSchema = new mongoose.Schema({
    players : {
        type : [ userSchema ]
    },
    maxPlayerCount : {
        type : Number,
        default : 10,
        max : 10,
        min : 2,
    },
    lang :{
        type : String,
        required : true
    },
    DrawTime : {
        type : Number,
        default : 60,
        min : 15,
        max : 120,
    },
    currentTime : {
        type : Number,
        default : 60,
    },
    maxRound : {
        type : Number,
        default : 3,
        min : 1,
        max : 5
    },
    currRound : {
        type : Number,
        default : 1,
    },
    turnIndex : {
        type : Number,
        default : 0
    },
    word : {
        type : String,
    },
    guessedCounter : {
        type : Number,
        default : 0
    },
    //This wariable have 3 states 0 to 2, which are waiting, choosing a word and drawing 
    gameState:{
        type : Number,
        default : 0
    },
    wordToChooseFrom : {
        type : [ Number ],
        default : [ 1 , 2 , 3 ]
    },
    prevRoundInfo : {
        type : [{}],
    },
    helpingLetter : {
        type : [Number],
        default : []
    }
});

module.exports = mongoose.model('Room',roomSchema);