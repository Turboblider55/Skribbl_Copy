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
        default : 120,
        min : 15,
        max : 240,
    },
    currentTime : {
        type : Number,
        default : 120,
    },
    maxRound : {
        type : Number,
        default : 1,
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
    //This wariable have two states 0 or 1, which translates to someone currently choosing a word, or someone currently drawing
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