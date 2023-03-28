const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        trim : true,
        required : true,
    },
    socketid : {
        type : String,
        required : true,
    },
    isPartyLeader : {
        type : Boolean,
        default : false,
    },
    guessedIt : {
        type: Boolean,
        default: false,
    },
    guessedIndex : {
        type : Number,
        default : -1
    },
    isDrawing : {
        type : Boolean, 
        default : false
    },
    points : {
        type : Number,
        default : 0,
    },
    body_index : {
        type : Number, 
        default : 0
    },
    eye_index : {
        type : Number, 
        default : 0
    },
    mouth_index : {
        type : Number, 
        default : 0
    }
});
const usermodel = mongoose.model('User',userSchema); 
module.exports = {usermodel,userSchema};