const mongoose = require("mongoose");
const {usermodel,userSchema} = require('./user');

const roomSchema = new mongoose.Schema({
    players : [userSchema],
    
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
    maxRound : {
        type : Number,
        default : 1,
    },
    currRound : {
        type : Number,
        default : 1,
    },
    word : {
        type : String,
    },
});

module.exports = mongoose.model('Room',roomSchema);